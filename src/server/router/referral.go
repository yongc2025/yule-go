package router

import (
	"yule-go/handler"
	"yule-go/repository"
	"yule-go/service"

	"github.com/gin-gonic/gin"
)

// RegisterReferralRoutes 注册裂变相关路由（需要用户 JWT 认证）
func RegisterReferralRoutes(r *gin.RouterGroup) {
	referralRepo := repository.NewReferralRepository()
	userRepo := repository.NewUserRepository()
	referralSvc := service.NewReferralService(referralRepo, userRepo)
	referralH := handler.NewReferralHandler(referralSvc)

	referral := r.Group("/referral")
	{
		referral.GET("/my", referralH.GetInviteInfo)
		referral.POST("/bind", referralH.BindInvite)
	}
}
