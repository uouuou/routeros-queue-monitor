package services

import (
	"fmt"
	"github.com/uouuou/routeros-queue-monitor/config"
	"github.com/uouuou/routeros-queue-monitor/models"
	"log"
	"strconv"
	"time"

	"github.com/go-routeros/routeros"
)

// RouterOSService 管理RouterOS连接和队列统计
type RouterOSService struct {
	config config.Config
	client *routeros.Client
}

// NewRouterOSService 创建一个新的RouterOSService实例
func NewRouterOSService(cfg config.Config) *RouterOSService {
	return &RouterOSService{
		config: cfg,
	}
}

// Connect 连接到RouterOS设备
func (r *RouterOSService) Connect() error {
	address := fmt.Sprintf("%s:%s", r.config.RouterOS.Host, r.config.RouterOS.Port)

	client, err := routeros.Dial(address, r.config.RouterOS.Username, r.config.RouterOS.Password)
	if err != nil {
		return fmt.Errorf("连接RouterOS失败: %v", err)
	}

	r.client = client
	log.Printf("成功连接到RouterOS: %s", address)
	return nil
}

// Close 关闭RouterOS连接
func (r *RouterOSService) Close() {
	if r.client != nil {
		r.client.Close()
	}
}

// GetQueueTreeStats 获取队列树统计信息
func (r *RouterOSService) GetQueueTreeStats() (*models.MonitorData, error) {
	if r.client == nil {
		return nil, fmt.Errorf("RouterOS客户端未连接")
	}

	// 获取队列树统计
	reply, err := r.client.Run("/queue/tree/print", "=stats")
	if err != nil {
		return nil, fmt.Errorf("获取队列统计失败: %v", err)
	}

	var queues []models.QueueStats
	var totalUpload, totalDownload int64
	var highUtilCount int
	var totalUtil float64

	for _, re := range reply.Re {
		queue := models.QueueStats{
			Name:     re.Map["name"],
			Rate:     re.Map["rate"],
			MaxLimit: re.Map["max-limit"],
			LimitAt:  re.Map["limit-at"],
		}

		// 解析字节数和包数
		if bytes, err := strconv.ParseInt(re.Map["bytes"], 10, 64); err == nil {
			queue.Bytes = bytes
		}
		if packets, err := strconv.ParseInt(re.Map["packets"], 10, 64); err == nil {
			queue.Packets = packets
		}

		// 计算利用率
		queue.Utilization = models.CalculateUtilization(queue.Rate, queue.MaxLimit)
		totalUtil += queue.Utilization

		// 统计高利用率队列
		if queue.Utilization > 80 {
			highUtilCount++
		}

		// 统计上行下行流量
		currentRate := models.ParseRate(queue.Rate)
		if contains(queue.Name, "_OUT") {
			totalUpload += currentRate
		} else if contains(queue.Name, "_IN") {
			totalDownload += currentRate
		}

		// 设置状态
		if queue.Utilization > 90 {
			queue.Status = "critical"
		} else if queue.Utilization > 70 {
			queue.Status = "warning"
		} else {
			queue.Status = "normal"
		}

		queues = append(queues, queue)
	}

	// 计算平均利用率
	avgUtil := float64(0)
	if len(queues) > 0 {
		avgUtil = totalUtil / float64(len(queues))
	}

	systemStats := models.SystemStats{
		TotalQueues:     len(queues),
		TotalUpload:     models.FormatRate(totalUpload),
		TotalDownload:   models.FormatRate(totalDownload),
		HighUtilization: highUtilCount,
		AverageUtil:     avgUtil,
	}

	return &models.MonitorData{
		Queues:      queues,
		SystemStats: systemStats,
		Timestamp:   time.Now().Unix(),
	}, nil
}

// IsConnected 检查RouterOS连接状态
func (r *RouterOSService) IsConnected() bool {
	if r.client == nil {
		return false
	}

	// 简单的ping测试
	_, err := r.client.Run("/system/identity/print")
	return err == nil
}

// Reconnect 重新连接到RouterOS设备
func (r *RouterOSService) Reconnect() error {
	if r.client != nil {
		r.client.Close()
	}
	return r.Connect()
}

// contains 检查字符串是否包含指定的前缀或后缀
func contains(str, substr string) bool {
	return len(str) >= len(substr) && str[len(str)-len(substr):] == substr ||
		len(str) >= len(substr) && str[:len(substr)] == substr
}
