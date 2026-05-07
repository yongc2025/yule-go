package router

import (
	"yule-go/handler"
	"yule-go/repository"

	"github.com/gin-gonic/gin"
)

// RegisterUserRoutes 注册用户相关路由（需 JWT 认证）
func RegisterUserRoutes(r *gin.RouterGroup) {
	userRepo := repository.NewUserRepository()
	h := handler.NewUserHandler(userRepo)

	user := r.Group("/user")
	{
		user.GET("/profile", h.GetProfile)
		user.PUT("/profile", h.UpdateProfile)
		user.PUT("/phone", h.UpdatePhone)
	}
}
