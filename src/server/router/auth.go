package router

import (
	"yule-go/handler"
	"yule-go/repository"
	"yule-go/service"

	"github.com/gin-gonic/gin"
)

// RegisterAuthRoutes 注册认证相关路由（公开，不需要 JWT）
func RegisterAuthRoutes(r *gin.RouterGroup) {
	userRepo := repository.NewUserRepository()
	svc := service.NewAuthService(userRepo)
	h := handler.NewAuthHandler(svc)

	auth := r.Group("/auth")
	{
		auth.POST("/wx-login", h.WxLogin)
	}
}
