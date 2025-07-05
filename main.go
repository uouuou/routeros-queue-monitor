package main

import (
	"github.com/uouuou/routeros-queue-monitor/config"
	"github.com/uouuou/routeros-queue-monitor/handlers"
	"github.com/uouuou/routeros-queue-monitor/services"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化RouterOS服务
	rosService := services.NewRouterOSService(*cfg)
	if err := rosService.Connect(); err != nil {
		log.Fatalf("无法连接到RouterOS: %v", err)
	}
	defer rosService.Close()

	// 初始化API处理器
	apiHandler := handlers.NewAPIHandler(rosService)

	// 设置Gin路由
	r := gin.Default()

	// CORS配置
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 静态文件服务
	r.Use(static.Serve("/", static.LocalFile("./static", true)))

	// API路由
	api := r.Group("/api")
	{
		api.GET("/queue-stats", apiHandler.GetQueueStats)
		api.GET("/ws", apiHandler.HandleWebSocket)
	}

	// 启动后台监控
	go apiHandler.StartMonitoring()

	log.Printf("服务器启动在端口 %s", cfg.Server.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Server.Port, r))
}
