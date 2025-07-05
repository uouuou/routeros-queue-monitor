/**
 * RouterOS Queue Monitor
 * 简洁可靠的队列监控系统
 */

class QueueMonitor {
    constructor() {
        this.ws = null;
        this.queues = [];
        this.systemStats = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.currentView = 'grid';
        this.filterType = 'all';
        this.sortBy = 'name';
        this.searchTerm = '';

        this.init();
    }

    init() {
        console.log('初始化 RouterOS Queue Monitor...');

        // 2秒后隐藏加载屏幕
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 2000);

        this.setupEventListeners();
        this.connectWebSocket();
        this.loadInitialData();
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws`;

        try {
            this.ws = new WebSocket(wsUrl);
            this.setupWebSocketHandlers();
        } catch (error) {
            console.error('WebSocket连接失败:', error);
            this.updateConnectionStatus(false);
        }
    }

    setupWebSocketHandlers() {
        this.ws.onopen = () => {
            console.log('WebSocket连接已建立');
            this.updateConnectionStatus(true);
            this.reconnectAttempts = 0;
            this.showNotification('连接成功', '已连接到RouterOS监控服务', 'success');
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('解析WebSocket消息失败:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket连接已关闭');
            this.updateConnectionStatus(false);
            this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket错误:', error);
            this.updateConnectionStatus(false);
        };
    }

    handleMessage(message) {
        switch (message.type) {
            case 'queue_update':
                this.handleQueueUpdate(message.data);
                break;
            case 'error':
                console.error('服务器错误:', message.message);
                this.showNotification('服务器错误', message.message, 'error');
                break;
        }
    }

    handleQueueUpdate(data) {
        this.queues = data.queues || [];
        this.systemStats = data.system_stats || {};
        this.updateDisplay();
        this.updateLastUpdateTime();
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            setTimeout(() => {
                this.connectWebSocket();
            }, 2000 * this.reconnectAttempts);
        }
    }

    async loadInitialData() {
        try {
            const response = await fetch('/api/queue-stats');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.queues) {
                this.handleQueueUpdate(data);
            }
        } catch (error) {
            console.error('加载初始数据失败:', error);
            this.showNotification('数据加载失败', error.message, 'error');
        }
    }

    updateDisplay() {
        this.updateStats();
        this.updateQueueDisplay();
    }

    updateStats() {
        if (!this.systemStats) return;

        this.updateElement('totalQueues', this.systemStats.total_queues || 0);
        this.updateElement('totalUpload', this.systemStats.total_upload || '0 Mbps');
        this.updateElement('totalDownload', this.systemStats.total_download || '0 Mbps');
        this.updateElement('highUtilization', this.systemStats.high_utilization || 0);
    }

    updateQueueDisplay() {
        const filteredQueues = this.getFilteredQueues();

        if (this.currentView === 'grid') {
            this.updateGridView(filteredQueues);
        } else {
            this.updateListView(filteredQueues);
        }
    }

    getFilteredQueues() {
        let filtered = [...this.queues];

        // 搜索过滤
        if (this.searchTerm) {
            filtered = filtered.filter(queue =>
                queue.name.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        }

        // 类型过滤
        switch (this.filterType) {
            case 'upload':
                filtered = filtered.filter(queue => queue.name.includes('_OUT'));
                break;
            case 'download':
                filtered = filtered.filter(queue => queue.name.includes('_IN'));
                break;
            case 'high':
                filtered = filtered.filter(queue => queue.utilization > 80);
                break;
        }

        // 排序
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'utilization':
                    return b.utilization - a.utilization;
                case 'rate':
                    return this.parseRateToMbps(b.rate) - this.parseRateToMbps(a.rate);
                default:
                    return 0;
            }
        });

        return filtered;
    }

    updateGridView(queues) {
        const grid = document.getElementById('gridView');

        if (queues.length === 0) {
            grid.innerHTML = '<div class="empty-state">没有找到匹配的队列</div>';
            return;
        }

        grid.innerHTML = queues.map(queue => this.createQueueCard(queue)).join('');
    }

    updateListView(queues) {
        const listBody = document.getElementById('listBody');

        if (queues.length === 0) {
            listBody.innerHTML = '<div class="empty-state">没有找到匹配的队列</div>';
            return;
        }

        listBody.innerHTML = queues.map(queue => this.createListRow(queue)).join('');
    }

    createQueueCard(queue) {
        const statusClass = this.getStatusClass(queue.utilization);

        // 格式化速率显示
        const currentRate = this.formatRateToMbps(queue.rate);
        const maxLimit = this.formatRateToMbps(queue.max_limit);

        return `
            <div class="queue-card ${statusClass}">
                <div class="queue-header">
                    <div class="queue-name">${queue.name}</div>
                    <div class="queue-status ${statusClass}">${this.getStatusText(queue.utilization)}</div>
                </div>
                
                <div class="queue-stats">
                    <div class="stat-item">
                        <div class="stat-value">${currentRate}</div>
                        <div class="stat-label">当前速率</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${maxLimit}</div>
                        <div class="stat-label">最大限制</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.formatBytes(queue.bytes)}</div>
                        <div class="stat-label">总流量</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${queue.utilization.toFixed(1)}%</div>
                        <div class="stat-label">利用率</div>
                    </div>
                </div>
                
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill ${statusClass}" 
                             style="width: ${Math.min(queue.utilization, 100)}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    createListRow(queue) {
        const statusClass = this.getStatusClass(queue.utilization);

        // 格式化速率显示
        const currentRate = this.formatRateToMbps(queue.rate);
        const maxLimit = this.formatRateToMbps(queue.max_limit);

        return `
            <div class="list-row">
                <div class="queue-name-col">${queue.name}</div>
                <div>${currentRate}</div>
                <div>${maxLimit}</div>
                <div>${queue.utilization.toFixed(1)}%</div>
                <div class="queue-status ${statusClass}">${this.getStatusText(queue.utilization)}</div>
            </div>
        `;
    }

    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');

        if (statusDot && statusText) {
            if (connected) {
                statusDot.className = 'status-dot';
                statusText.textContent = '已连接';
            } else {
                statusDot.className = 'status-dot disconnected';
                statusText.textContent = '连接断开';
            }
        }
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        this.updateElement('lastUpdate', timeString);
    }

    setupEventListeners() {
        // 搜索输入防抖
        let searchTimeout;
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchTerm = e.target.value;
                    this.updateQueueDisplay();
                }, 300);
            });
        }

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'r':
                        e.preventDefault();
                        this.loadInitialData();
                        break;
                    case 'f':
                        e.preventDefault();
                        if (searchInput) searchInput.focus();
                        break;
                }
            }
        });
    }

    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notifications');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;

        container.appendChild(notification);

        // 自动移除通知
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // 工具方法
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * 解析速率字符串并转换为Mbps数值
     * @param {string} rateStr - 速率字符串，如 "10Mbps", "1Gbps", "500kbps"
     * @returns {number} - Mbps数值
     */
    parseRateToMbps(rateStr) {
        if (!rateStr || rateStr === '0' || rateStr === '0 bps') return 0;

        // 移除所有空格并转为小写
        const cleanStr = rateStr.replace(/\s+/g, '').toLowerCase();

        // 提取数字部分
        const numMatch = cleanStr.match(/^(\d+(?:\.\d+)?)/);
        if (!numMatch) return 0;

        const num = parseFloat(numMatch[1]);

        // 根据单位转换为Mbps
        if (cleanStr.includes('gbps') || cleanStr.includes('g')) {
            return num * 1000; // Gbps to Mbps
        } else if (cleanStr.includes('mbps') || cleanStr.includes('m')) {
            return num; // 已经是Mbps
        } else if (cleanStr.includes('kbps') || cleanStr.includes('k')) {
            return num / 1000; // kbps to Mbps
        } else if (cleanStr.includes('bps') || cleanStr.includes('b')) {
            return num / 1000000; // bps to Mbps
        } else {
            // 如果没有单位，假设是bps
            return num / 1000000;
        }
    }

    /**
     * 格式化速率为Mbps显示
     * @param {string} rateStr - 原始速率字符串
     * @returns {string} - 格式化后的Mbps字符串
     */
    formatRateToMbps(rateStr) {
        if (!rateStr || rateStr === '0' || rateStr === '0 bps') {
            return '0 Mbps';
        }

        const mbps = this.parseRateToMbps(rateStr);

        if (mbps >= 1000) {
            // 如果大于等于1000Mbps，显示为Gbps
            return `${(mbps / 1000).toFixed(2)} Gbps`;
        } else if (mbps >= 1) {
            // 1Mbps以上，保留2位小数
            return `${mbps.toFixed(2)} Mbps`;
        } else if (mbps >= 0.01) {
            // 0.01Mbps以上，保留2位小数
            return `${mbps.toFixed(2)} Mbps`;
        } else if (mbps > 0) {
            // 小于0.01Mbps，显示为kbps
            return `${(mbps * 1000).toFixed(0)} kbps`;
        } else {
            return '0 Mbps';
        }
    }

    /**
     * 旧的parseRate方法，保持兼容性
     */
    parseRate(rateStr) {
        return this.parseRateToMbps(rateStr);
    }

    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';

        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    getStatusClass(utilization) {
        if (utilization >= 90) return 'critical';
        if (utilization >= 70) return 'warning';
        return 'normal';
    }

    getStatusText(utilization) {
        if (utilization >= 90) return '危险';
        if (utilization >= 70) return '警告';
        return '正常';
    }
}

// 全局函数
function refreshData() {
    if (window.monitor) {
        window.monitor.loadInitialData();
        window.monitor.showNotification('刷新数据', '正在重新加载数据...', 'info');
    }
}

function switchView(view) {
    if (!window.monitor) return;

    window.monitor.currentView = view;

    // 更新按钮状态
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // 显示/隐藏视图
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');

    if (gridView && listView) {
        gridView.style.display = view === 'grid' ? 'grid' : 'none';
        listView.style.display = view === 'list' ? 'block' : 'none';
    }

    window.monitor.updateQueueDisplay();
}

function filterQueues() {
    if (!window.monitor) return;

    const select = document.getElementById('queueFilter');
    if (select) {
        window.monitor.filterType = select.value;
        window.monitor.updateQueueDisplay();
    }
}

function sortQueues() {
    if (!window.monitor) return;

    const select = document.getElementById('sortBy');
    if (select) {
        window.monitor.sortBy = select.value;
        window.monitor.updateQueueDisplay();
    }
}

function searchQueues() {
    // 搜索功能已在事件监听器中实现
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            const btn = document.querySelector('[onclick="toggleFullscreen()"] i');
            if (btn) btn.className = 'fas fa-compress';
        }).catch(err => {
            console.error('进入全屏失败:', err);
        });
    } else {
        document.exitFullscreen().then(() => {
            const btn = document.querySelector('[onclick="toggleFullscreen()"] i');
            if (btn) btn.className = 'fas fa-expand';
        });
    }
}

// 在文件末尾添加导出功能
function exportData() {
    if (!window.monitor || !window.monitor.queues.length) {
        if (window.monitor) {
            window.monitor.showNotification('导出失败', '没有可导出的数据', 'warning');
        }
        return;
    }

    try {
        const data = {
            timestamp: new Date().toISOString(),
            export_time: new Date().toLocaleString('zh-CN'),
            systemStats: window.monitor.systemStats,
            queues: window.monitor.queues.map(queue => ({
                name: queue.name,
                current_rate: window.monitor.formatRateToMbps(queue.rate),
                max_limit: window.monitor.formatRateToMbps(queue.max_limit),
                utilization: `${queue.utilization.toFixed(1)}%`,
                total_bytes: window.monitor.formatBytes(queue.bytes),
                status: window.monitor.getStatusText(queue.utilization)
            })),
            summary: {
                total_queues: window.monitor.queues.length,
                high_utilization_queues: window.monitor.queues.filter(q => q.utilization > 80).length,
                average_utilization: (window.monitor.queues.reduce((sum, q) => sum + q.utilization, 0) / window.monitor.queues.length).toFixed(1) + '%'
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `routeros-queue-monitor-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        window.monitor.showNotification('导出成功', '队列数据已成功导出到文件', 'success');
    } catch (error) {
        console.error('导出数据失败:', error);
        if (window.monitor) {
            window.monitor.showNotification('导出失败', '导出数据时发生错误', 'error');
        }
    }
}



// 应用初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，初始化应用...');

    // 初始化主应用
    window.monitor = new QueueMonitor();

    console.log('RouterOS Queue Monitor 初始化完成');
});

// 页面可见性API - 当页面不可见时暂停更新
document.addEventListener('visibilitychange', () => {
    if (window.monitor) {
        if (document.hidden) {
            console.log('页面隐藏');
        } else {
            console.log('页面可见，刷新数据');
            window.monitor.loadInitialData();
        }
    }
});

// 网络状态监控
window.addEventListener('online', () => {
    if (window.monitor) {
        window.monitor.showNotification('网络恢复', '网络连接已恢复', 'success');
        window.monitor.connectWebSocket();
    }
});

window.addEventListener('offline', () => {
    if (window.monitor) {
        window.monitor.showNotification('网络断开', '网络连接已断开', 'warning');
    }
});

// 错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    if (window.monitor) {
        window.monitor.showNotification('应用错误', '应用遇到了一个错误', 'error');
    }
});

console.log('RouterOS Queue Monitor JavaScript 加载完成');
