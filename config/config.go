package config

import (
	"encoding/json"
	"os"
)

// Config 定义配置结构体
type Config struct {
	Server struct {
		Port string `json:"port"`
	} `json:"server"`
	RouterOS struct {
		Host     string `json:"host"`
		Username string `json:"username"`
		Password string `json:"password"`
		Port     string `json:"port"`
	} `json:"routeros"`
	Monitor struct {
		Interval int `json:"interval"` // 监控间隔（秒）
	} `json:"monitor"`
}

// Load 加载配置文件
func Load() *Config {
	config := &Config{}

	// 默认配置
	config.Server.Port = "5000"
	config.RouterOS.Host = "192.168.1.1"
	config.RouterOS.Username = "admin"
	config.RouterOS.Password = "password"
	config.RouterOS.Port = "8728"
	config.Monitor.Interval = 2

	// 尝试从配置文件加载
	if file, err := os.Open("config.json"); err == nil {
		defer file.Close()
		decoder := json.NewDecoder(file)
		decoder.Decode(config)
	}

	// 环境变量覆盖
	if port := os.Getenv("SERVER_PORT"); port != "" {
		config.Server.Port = port
	}
	if host := os.Getenv("ROS_HOST"); host != "" {
		config.RouterOS.Host = host
	}
	if username := os.Getenv("ROS_USERNAME"); username != "" {
		config.RouterOS.Username = username
	}
	if password := os.Getenv("ROS_PASSWORD"); password != "" {
		config.RouterOS.Password = password
	}

	return config
}
