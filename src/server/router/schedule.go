package router

import (
	"yule-go/handler"
	"yule-go/repository"
	"yule-go/service"

	"github.com/gin-gonic/gin"
)

// RegisterScheduleRoutes 注册团期相关路由
func RegisterScheduleRoutes(r *gin.RouterGroup) {
	// 初始化依赖链
	repo := repository.NewScheduleRepository()
	svc := service.NewScheduleService(repo)
	h := handler.NewScheduleHandler(svc)

	// 管理后台路由（需要管理员认证）
	admin := r.Group("/admin")
	{
		admin.POST("/schedules", h.Create)
		admin.PUT("/schedules/:id", h.Update)
		admin.PUT("/schedules/:id/cancel", h.Cancel)
		admin.GET("/schedules/:id", h.GetByID)
		admin.GET("/schedules", h.List)
	}

	// 小程序端路由（需要 JWT 认证）
	public := r.Group("")
	{
		public.GET("/schedules", h.ListByWeek)
	}
}
