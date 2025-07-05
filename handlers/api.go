package handlers

import (
	"github.com/uouuou/routeros-queue-monitor/models"
	"github.com/uouuou/routeros-queue-monitor/services"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// APIHandler 处理API请求和WebSocket连接
type APIHandler struct {
	rosService *services.RouterOSService
	clients    map[*websocket.Conn]bool
	clientsMux sync.RWMutex
	upgrader   websocket.Upgrader
	lastData   *models.MonitorData
	dataMux    sync.RWMutex
}

// NewAPIHandler 创建一个新的APIHandler实例
func NewAPIHandler(rosService *services.RouterOSService) *APIHandler {
	return &APIHandler{
		rosService: rosService,
		clients:    make(map[*websocket.Conn]bool),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // 允许所有来源
			},
		},
	}
}

// GetQueueStats 处理获取队列统计的API请求
func (h *APIHandler) GetQueueStats(c *gin.Context) {
	h.dataMux.RLock()
	data := h.lastData
	h.dataMux.RUnlock()

	if data == nil {
		// 如果没有缓存数据，实时获取
		var err error
		data, err = h.rosService.GetQueueTreeStats()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":  "获取队列统计失败",
				"detail": err.Error(),
			})
			return
		}
	}

	c.JSON(http.StatusOK, data)
}

// HandleWebSocket 处理WebSocket连接
func (h *APIHandler) HandleWebSocket(c *gin.Context) {
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket升级失败: %v", err)
		return
	}
	defer conn.Close()

	// 添加客户端
	h.clientsMux.Lock()
	h.clients[conn] = true
	h.clientsMux.Unlock()

	log.Printf("新的WebSocket连接: %s", conn.RemoteAddr())

	// 发送当前数据
	h.dataMux.RLock()
	if h.lastData != nil {
		conn.WriteJSON(map[string]interface{}{
			"type": "queue_update",
			"data": h.lastData,
		})
	}
	h.dataMux.RUnlock()

	// 处理客户端消息
	for {
		var msg map[string]interface{}
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("WebSocket读取错误: %v", err)
			break
		}

		// 处理ping消息
		if msgType, ok := msg["type"].(string); ok && msgType == "ping" {
			conn.WriteJSON(map[string]interface{}{
				"type":      "pong",
				"timestamp": time.Now().Unix(),
			})
		}
	}

	// 移除客户端
	h.clientsMux.Lock()
	delete(h.clients, conn)
	h.clientsMux.Unlock()

	log.Printf("WebSocket连接断开: %s", conn.RemoteAddr())
}

// StartMonitoring 启动后台监控
func (h *APIHandler) StartMonitoring() {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	log.Println("开始监控RouterOS队列...")

	for {
		select {
		case <-ticker.C:
			h.updateData()
		}
	}
}

// updateData 从RouterOS获取最新数据
func (h *APIHandler) updateData() {
	// 检查连接状态
	if !h.rosService.IsConnected() {
		log.Println("RouterOS连接断开，尝试重连...")
		if err := h.rosService.Reconnect(); err != nil {
			log.Printf("重连失败: %v", err)
			h.broadcastError("连接断开")
			return
		}
		log.Println("重连成功")
	}

	// 获取最新数据
	data, err := h.rosService.GetQueueTreeStats()
	if err != nil {
		log.Printf("获取数据失败: %v", err)
		h.broadcastError(err.Error())
		return
	}

	// 更新缓存
	h.dataMux.Lock()
	h.lastData = data
	h.dataMux.Unlock()

	// 广播给所有WebSocket客户端
	h.broadcastData(data)
}

// broadcastData 广播数据到所有客户端
func (h *APIHandler) broadcastData(data *models.MonitorData) {
	message := map[string]interface{}{
		"type": "queue_update",
		"data": data,
	}

	h.clientsMux.RLock()
	defer h.clientsMux.RUnlock()

	for client := range h.clients {
		err := client.WriteJSON(message)
		if err != nil {
			log.Printf("发送数据到客户端失败: %v", err)
			client.Close()
			delete(h.clients, client)
		}
	}
}

// broadcastError 广播错误消息到所有客户端
func (h *APIHandler) broadcastError(errorMsg string) {
	message := map[string]interface{}{
		"type":      "error",
		"message":   errorMsg,
		"timestamp": time.Now().Unix(),
	}

	h.clientsMux.RLock()
	defer h.clientsMux.RUnlock()

	for client := range h.clients {
		err := client.WriteJSON(message)
		if err != nil {
			log.Printf("发送错误消息到客户端失败: %v", err)
			client.Close()
			delete(h.clients, client)
		}
	}
}

// GetConnectedClients 获取当前连接的客户端数量
func (h *APIHandler) GetConnectedClients() int {
	h.clientsMux.RLock()
	defer h.clientsMux.RUnlock()
	return len(h.clients)
}
