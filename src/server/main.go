package main

import (
	"fmt"
	"log"
	"net/http"

	"yule-go/config"
	"yule-go/db"
	"yule-go/handler"
	"yule-go/middleware"
	"yule-go/repository"
	"yule-go/router"
	"yule-go/scheduler"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	config.Load()

	// 初始化数据库
	db.Init()

	// 设置 Gin 模式
	gin.SetMode(config.C.Server.Mode)

	// 初始化定时任务调度器
	orderRepo := repository.NewOrderRepository()
	sched := scheduler.New(orderRepo)
	sched.Start()
	handler.SetScheduler(sched)

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
		router.RegisterAuthRoutes(v1)
		router.RegisterScheduleRoutes(v1)
		router.RegisterRentalRoutes(v1)
		router.RegisterPaymentRoutes(v1)
		router.RegisterRouteRoutes(v1)
		router.RegisterMemberCallbackRoutes(v1)

		// 小程序端路由（需要 JWT 认证）
		auth := v1.Group("")
		auth.Use(middleware.JWTAuth())
		{
			router.RegisterOrderRoutes(auth)
			router.RegisterMemberRoutes(auth)
			router.RegisterReferralRoutes(auth)
		}

		// 管理后台路由（需要管理员认证）
		admin := v1.Group("/admin")
		{
			// 管理员认证（不需要认证）
			router.RegisterAdminAuthRoutes(admin)
		}
		adminAuth := v1.Group("/admin")
		adminAuth.Use(middleware.AdminAuth())
		{
			router.RegisterAdminAuthProtectedRoutes(adminAuth)
			router.RegisterAdminOrderRoutes(adminAuth)
			router.RegisterAdminRentalRoutes(adminAuth)
			router.RegisterAdminDashboardRoutes(adminAuth)
			router.RegisterAdminCustomerRoutes(adminAuth)
			router.RegisterAdminRouteRoutes(adminAuth)
			router.RegisterAdminFinanceRoutes(adminAuth)
		}
	}

	port := config.C.Server.Port
	log.Printf("🚀 yule-go server starting on :%s", port)

	// 在 goroutine 中启动服务，主线程等待退出信号
	go func() {
		if err := r.Run(fmt.Sprintf(":%s", port)); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// 等待退出信号，优雅停止调度器
	scheduler.WaitForSignal(sched)
}
