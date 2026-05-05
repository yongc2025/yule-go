package main

import (
	"fmt"
	"log"
	"net/http"

	"yule-go/config"
	"yule-go/db"
	"yule-go/middleware"
	"yule-go/router"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	config.Load()

	// 初始化数据库
	db.Init()

	// 设置 Gin 模式
	gin.SetMode(config.C.Server.Mode)

	r := gin.New()

	// 全局中间件
	r.Use(middleware.Logger())
	r.Use(middleware.CORS())
	r.Use(gin.Recovery())

	// 健康检查（不需要认证）
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "ok",
			"data": gin.H{
				"status":  "running",
				"service": "yule-go",
			},
		})
	})

	// API v1 路由组
	v1 := r.Group("/api/v1")
	{
		v1.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"code": 0, "message": "pong"})
		})

		// 公开路由（不需要认证）
		router.RegisterScheduleRoutes(v1)
		router.RegisterRentalRoutes(v1)
		router.RegisterPaymentRoutes(v1)
		router.RegisterRouteRoutes(v1)

		// 小程序端路由（需要 JWT 认证）
		auth := v1.Group("")
		auth.Use(middleware.JWTAuth())
		{
			router.RegisterOrderRoutes(auth)
		}

		// 管理后台路由（需要管理员认证）
		admin := v1.Group("/admin")
		admin.Use(middleware.AdminAuth())
		{
			router.RegisterAdminOrderRoutes(admin)
		}
	}

	port := config.C.Server.Port
	log.Printf("🚀 yule-go server starting on :%s", port)
	if err := r.Run(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
