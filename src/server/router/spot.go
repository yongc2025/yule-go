package router

import (
	"yule-go/handler"
	"yule-go/repository"
	"yule-go/service"

	"github.com/gin-gonic/gin"
}

// RegisterSpotRoutes 注册钓场相关路由
func RegisterSpotRoutes(r *gin.RouterGroup) {
	spotRepo := repository.NewSpotRepository()
	svc := service.NewSpotService(spotRepo)
	h := handler.NewSpotHandler(svc)

	// 管理后台路由（需要管理员认证）
	admin := r.Group("/admin")
	{
		admin.POST("/spots", h.Create)
		admin.PUT("/spots/:id", h.Update)
		admin.DELETE("/spots/:id", h.Delete)
		admin.GET("/spots/:id", h.GetByID)
		admin.GET("/spots", h.List)
	}

	// 小程序端公开路由
	public := r.Group("")
	{
		public.GET("/spots", h.PublicList)
		public.GET("/spots/nearby", h.Nearby)
		public.GET("/spots/:id", h.PublicGetByID)
		public.GET("/spots/:id/routes", h.RoutesBySpot)
	}
}
