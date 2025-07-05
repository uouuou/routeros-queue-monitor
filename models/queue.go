package models

import (
	"strconv"
	"strings"
)

// QueueStats 队列统计信息
type QueueStats struct {
	Name        string  `json:"name"`
	Bytes       int64   `json:"bytes"`
	Packets     int64   `json:"packets"`
	Rate        string  `json:"rate"`
	MaxLimit    string  `json:"max_limit"`
	LimitAt     string  `json:"limit_at"`
	Utilization float64 `json:"utilization"`
	Status      string  `json:"status"`
}

// SystemStats 系统统计信息
type SystemStats struct {
	TotalQueues     int     `json:"total_queues"`
	TotalUpload     string  `json:"total_upload"`
	TotalDownload   string  `json:"total_download"`
	HighUtilization int     `json:"high_utilization"`
	AverageUtil     float64 `json:"average_utilization"`
}

// MonitorData 监控数据结构体
type MonitorData struct {
	Queues      []QueueStats `json:"queues"`
	SystemStats SystemStats  `json:"system_stats"`
	Timestamp   int64        `json:"timestamp"`
}

// ParseRate 解析速率字符串为bps
func ParseRate(rateStr string) int64 {
	if rateStr == "" || rateStr == "0" {
		return 0
	}

	// 移除单位
	rateStr = strings.ReplaceAll(rateStr, "bps", "")
	rateStr = strings.ReplaceAll(rateStr, "ps", "")

	var multiplier int64 = 1

	if strings.Contains(rateStr, "k") || strings.Contains(rateStr, "K") {
		multiplier = 1000
		rateStr = strings.ReplaceAll(rateStr, "k", "")
		rateStr = strings.ReplaceAll(rateStr, "K", "")
	} else if strings.Contains(rateStr, "M") {
		multiplier = 1000000
		rateStr = strings.ReplaceAll(rateStr, "M", "")
	} else if strings.Contains(rateStr, "G") {
		multiplier = 1000000000
		rateStr = strings.ReplaceAll(rateStr, "G", "")
	}

	if rate, err := strconv.ParseFloat(strings.TrimSpace(rateStr), 64); err == nil {
		return int64(rate * float64(multiplier))
	}

	return 0
}

// FormatRate 格式化速率
func FormatRate(bps int64) string {
	if bps >= 1000000000 {
		return strconv.FormatFloat(float64(bps)/1000000000, 'f', 1, 64) + " Gbps"
	} else if bps >= 1000000 {
		return strconv.FormatFloat(float64(bps)/1000000, 'f', 1, 64) + " Mbps"
	} else if bps >= 1000 {
		return strconv.FormatFloat(float64(bps)/1000, 'f', 1, 64) + " kbps"
	}
	return strconv.FormatInt(bps, 10) + " bps"
}

// CalculateUtilization 计算利用率
func CalculateUtilization(currentRate, maxLimit string) float64 {
	current := ParseRate(currentRate)
	maximum := ParseRate(maxLimit)

	if maximum > 0 {
		return float64(current) / float64(maximum) * 100
	}
	return 0
}
