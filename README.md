# RouterOS Queue Monitor

<div align="center">

![RouterOS Queue Monitor](https://img.shields.io/badge/RouterOS-Queue%20Monitor-00f5ff?style=for-the-badge&logo=mikrotik)
![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?style=for-the-badge&logo=go)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)

**🚀 现代化的 RouterOS 队列监控系统**

*实时监控 • 数据可视化 • 科技感UI • 高性能*

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [部署方式](#-部署方式) • [配置说明](#-配置说明) • [故障排除](#-故障排除)

</div>

---

## 📋 项目简介

RouterOS Queue Monitor 是一个专为 MikroTik RouterOS 设计的现代化队列监控系统。它提供实时的队列状态监控、数据可视化和告警功能，帮助网络管理员更好地监控和管理网络流量。

### ✨ 核心特性

- 🔄 **实时监控**: WebSocket 实时数据更新，无需手动刷新
- 📊 **数据可视化**: 直观的图表和进度条显示队列状态
- 🎨 **科技感UI**: 现代化的深色主题界面设计
- 📱 **响应式设计**: 完美适配桌面、平板和手机设备
- ⚡ **高性能**: Go 语言后端，快速响应和低资源占用
- 🔍 **智能过滤**: 支持队列搜索、分类和排序
- 📈 **多视图模式**: 网格视图和列表视图自由切换
- 💾 **数据导出**: 支持 JSON 格式数据导出
- 🔔 **状态告警**: 高负载队列自动告警提醒
- ⌨️ **快捷键支持**: 提高操作效率的键盘快捷键

---

## 🎯 功能特性

### 📊 监控功能

- **队列状态监控**: 实时显示所有队列的当前状态
- **流量统计**: 上行/下行流量统计和趋势分析
- **利用率监控**: 队列利用率实时计算和告警
- **历史数据**: 保存历史监控数据用于趋势分析

### 🎨 用户界面

- **现代化设计**: 科技感十足的深色主题界面
- **数据可视化**: 进度条、状态指示器、统计卡片
- **交互体验**: 流畅的动画效果和悬停反馈
- **自定义控件**: 美化的下拉选择框和搜索框

### 🔧 管理功能

- **智能过滤**: 按队列类型、状态、名称过滤
- **多种排序**: 支持按名称、利用率、速率排序
- **实时搜索**: 队列名称实时搜索功能
- **数据导出**: 一键导出监控数据

### 🚀 技术特性

- **WebSocket 通信**: 实时双向数据传输
- **RESTful API**: 标准的 REST API 接口
- **并发安全**: Go 协程安全的并发处理
- **错误处理**: 完善的错误处理和恢复机制

---

## 🛠 系统要求

### 服务器端

- **操作系统**: Linux / Windows / macOS
- **Go 版本**: 1.21 或更高版本
- **内存**: 最小 512MB RAM
- **存储**: 最小 100MB 可用空间
- **网络**: 能够访问 RouterOS 设备的网络连接

### RouterOS 设备

- **RouterOS 版本**: 6.40 或更高版本
- **API 访问**: 启用 API 服务（默认端口 8728）
- **用户权限**: 具有读取队列信息权限的用户账户

### 客户端浏览器

- **现代浏览器**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **JavaScript**: 启用 JavaScript 支持
- **WebSocket**: 支持 WebSocket 协议

---

## 🚀 快速开始

### 方式一：直接运行

1. **克隆项目**

```bash
git clone https://github.com/uouuou/routeros-queue-monitor.git
cd routeros-queue-monitor
```

2. **安装依赖**

```bash
go mod tidy
```

3. **配置文件**

```bash
cp config.json.example config.json
# 编辑 config.json 文件，填入你的 RouterOS 连接信息
```

4. **运行程序**

```bash
go run main.go
```

5. **访问界面**

```
打开浏览器访问: http://localhost:5000
```

### 方式二：编译运行

1. **编译程序**

```bash
go build -o routeros-queue-monitor
```

2. **运行程序**

```bash
./routeros-queue-monitor
```
---

## ⚙️ 配置说明

### 配置文件 (config.json)

```json
{
  "server": {
    "port": "5000"
  },
  "routeros": {
    "host": "192.168.1.1",
    "username": "admin",
    "password": "password",
    "port": "8728"
  },
  "monitor": {
    "interval": 2
  }
}
```

### 环境变量

可以通过环境变量覆盖配置文件设置：

```bash
export ROS_HOST=192.168.1.1
export ROS_USERNAME=admin
export ROS_PASSWORD=your_password
export ROS_PORT=8728
export SERVER_PORT=5000
```

### RouterOS 配置

1. **启用 API 服务**

```routeros
/ip service enable api
/ip service set api port=8728
```

2. **创建监控用户**（推荐）

```routeros
/user add name=monitor password=monitor_password group=read
```

3. **防火墙规则**（如需要）

```routeros
/ip firewall filter add chain=input protocol=tcp dst-port=8728 src-address=监控服务器IP action=accept
```

---

## 📱 使用说明

### 界面概览

1. **顶部导航栏**
   
   - 连接状态指示器
   - 刷新按钮
   - 全屏切换按钮
2. **统计概览区域**
   
   - 活跃队列数量
   - 总上行/下行流量
   - 高负载队列数量
3. **控制面板**
   
   - 队列筛选：全部/上行/下行/高负载/正常
   - 排序方式：名称/利用率/速率/流量
   - 搜索框：实时搜索队列名称
   - 视图切换：网格视图/列表视图
   - 导出按钮：导出当前数据
4. **队列监控区域**
   
   - 队列卡片显示详细信息
   - 实时利用率进度条
   - 状态颜色指示（绿色/黄色/红色）

### 快捷键

- `Ctrl + R`: 刷新数据
- `Ctrl + F`: 聚焦搜索框
- `F11`: 全屏切换
- `Esc`: 关闭弹窗

### 状态说明

| 状态 | 颜色    | 利用率范围 | 说明                       |
| ---- | ------- | ---------- | -------------------------- |
| 正常 | 🟢 绿色 | 0% - 69%   | 队列运行正常               |
| 警告 | 🟡 黄色 | 70% - 89%  | 队列负载较高，需要关注     |
| 危险 | 🔴 红色 | 90% - 100% | 队列负载过高，需要立即处理 |

---

## 🐳 部署方式

### Docker 部署

1. **创建 Dockerfile**

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod tidy && go build -o routeros-queue-monitor

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/
COPY --from=builder /app/routeros-queue-monitor .
COPY --from=builder /app/static ./static
COPY --from=builder /app/config.json.example ./config.json
EXPOSE 5000
CMD ["./queue-monitor"]
```

2. **构建镜像**

```bash
docker build -t queue-monitor .
```

3. **运行容器**

```bash
docker run -d \
  --name queue-monitor \
  --restart unless-stopped \
  -p 5000:5000 \
  -v $(pwd)/config.json:/root/config.json:ro \
  queue-monitor
```

### Docker Compose 部署

```yaml
version: '3.8'

services:
  routeros-queue-monitor:
    build: .
    container_name: routeros-queue-monitor
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - ROS_HOST=${ROS_HOST:-192.168.1.1}
      - ROS_USERNAME=${ROS_USERNAME:-admin}
      - ROS_PASSWORD=${ROS_PASSWORD:-password}
      - SERVER_PORT=5000
    volumes:
      - ./config.json:/app/config.json:ro
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/api/queue-stats"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # 可选：Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: routeros-queue-monitor-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - routeros-queue-monitor
```

### 系统服务部署

1. **创建服务文件**

```bash
sudo tee /etc/systemd/system/routeros-queue-monitor.service > /dev/null <<EOF
[Unit]
Description=RouterOS Queue Monitor
After=network.target

[Service]
Type=simple
User=monitor
WorkingDirectory=/opt/routeros-queue-monitor
ExecStart=/opt/queue-monitor/routeros-queue-monitor
Restart=always
RestartSec=5
Environment=GIN_MODE=release

[Install]
WantedBy=multi-user.target
EOF
```

2. **启用并启动服务**

```bash
sudo systemctl daemon-reload
sudo systemctl enable routeros-queue-monitor
sudo systemctl start routeros-queue-monitor
```

3. **查看服务状态**

```bash
sudo systemctl status routeros-queue-monitor
sudo journalctl -u routeros-queue-monitor -f
```

---

## 🔧 API 文档

### REST API 端点

#### 获取队列统计

```http
GET /api/queue-stats
```

**响应示例:**

```json
{
  "queues": [
    {
      "name": "User_001_OUT",
      "rate": "15.50 Mbps",
      "max_limit": "100.00 Mbps", 
      "utilization": 15.5,
      "bytes": 1048576000,
      "packets": 1000000,
      "status": "normal"
    }
  ],
  "system_stats": {
    "total_queues": 10,
    "total_upload": "150.00 Mbps",
    "total_download": "300.00 Mbps",
    "high_utilization": 2,
    "average_utilization": 45.5
  },
  "timestamp": 1640995200
}
```

### WebSocket API

#### 连接端点

```
ws://localhost:5000/api/ws
```

#### 消息格式

**队列更新消息:**

```json
{
  "type": "queue_update",
  "data": {
    "queues": [...],
    "system_stats": {...},
    "timestamp": 1640995200
  }
}
```

**错误消息:**

```json
{
  "type": "error",
  "message": "连接RouterOS失败"
}
```

**心跳消息:**

```json
{
  "type": "ping"
}
```

---

## 🔍 故障排除

### 常见问题

#### 1. 无法连接到 RouterOS

**问题**: 显示"连接RouterOS失败"

**解决方案**:

- 检查 RouterOS IP 地址是否正确
- 确认 API 服务已启用：`/ip service print`
- 检查防火墙规则是否允许 8728 端口
- 验证用户名和密码是否正确
- 确认网络连通性：`ping RouterOS_IP`

#### 2. 页面加载缓慢或卡顿

**问题**: 界面响应缓慢

**解决方案**:

- 检查网络延迟到 RouterOS 设备
- 调整配置文件中的 `monitor.interval` 参数
- 减少 `monitor.max_history` 历史数据点数量
- 检查服务器资源使用情况

#### 3. WebSocket 连接失败

**问题**: 实时更新不工作

**解决方案**:

- 检查浏览器是否支持 WebSocket
- 确认防火墙没有阻止 WebSocket 连接
- 查看浏览器开发者工具的网络标签页
- 尝试刷新页面重新建立连接

#### 4. 数据显示不准确

**问题**: 队列数据显示异常

**解决方案**:

- 检查 RouterOS 队列配置是否正确
- 确认监控用户有足够的权限读取队列信息
- 查看应用日志文件获取详细错误信息
- 重启监控服务


#### 启用调试模式

```bash
# 设置日志级别为 debug
export LOG_LEVEL=debug
./queue-monitor
```
---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork 项目**
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

### 开发环境设置

1. **克隆项目**

```bash
git clone https://github.com/uouuou/routeros-queue-monitor.git
```

2. **安装依赖**

```bash
go mod tidy
```

3. **运行测试**

```bash
go test ./...
```

4. **启动开发服务器**

```bash
go run main.go
```

### 代码规范

- 遵循 Go 官方代码规范
- 使用 `gofmt` 格式化代码
- 添加适当的注释和文档
- 编写单元测试

### 报告问题

如果你发现了 bug 或有功能建议，请：

1. 检查是否已有相关 issue
2. 创建新的 issue 并提供详细信息
3. 包含复现步骤和环境信息

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🙏 致谢

- [MikroTik](https://mikrotik.com/) - RouterOS 操作系统
- [Gin](https://github.com/gin-gonic/gin) - Go Web 框架
- [Gorilla WebSocket](https://github.com/gorilla/websocket) - WebSocket 库
- [Font Awesome](https://fontawesome.com/) - 图标库
- [Chart.js](https://www.chartjs.org/) - 图表库

---

## 📞 联系方式

- **项目主页**: [GitHub Repository](https://github.com/uouuou/routeros-queue-monitor)
- **问题反馈**: [GitHub Issues](https://github.com/uouuou/routeros-queue-monitor/issues)
- **邮箱**:  hrinvay@gmail.com

---

## 🔄 更新日志

### v1.0.0 (2024-01-15)

- 🎉 初始版本发布
- 📊 基础队列监控功能
- 🔌 RouterOS API 集成
- 🌐 Web 界面
- ✨ 科技感 UI 设计
- 🚀 WebSocket 实时数据更新
- 📊 增强的数据可视化
- 📱 完全响应式设计
- 🔍 智能搜索和过滤功能
- 💾 数据导出功能

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

### MIT 许可证说明

MIT 许可证是一个宽松的开源许可证，允许你：

✅ **商业使用** - 可以用于商业项目
✅ **修改** - 可以修改源代码
✅ **分发** - 可以分发原始或修改后的代码
✅ **私人使用** - 可以私人使用
✅ **专利使用** - 提供专利使用权

**唯一要求**：在所有副本中包含原始许可证和版权声明

**免责声明**：软件按"原样"提供，不提供任何形式的保证

<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个星标！**

Made with ❤️ by [Rinvay]

</div>

