package router

import (
	"yule-go/handler"
	"yule-go/repository"
	"yule-go/service"

	"github.com/gin-gonic/gin"
)

// RegisterMemberRoutes 注册会员相关路由（需要用户 JWT 认证）
func RegisterMemberRoutes(r *gin.RouterGroup) {
	rechargeRepo := repository.NewRechargeRepository()
	userRepo := repository.NewUserRepository()
	memberSvc := service.NewMemberService(rechargeRepo, userRepo)
	memberH := handler.NewMemberHandler(memberSvc)

	member := r.Group("/member")
	{
		member.GET("/plans", memberH.GetPlans)
		member.GET("/info", memberH.GetMemberInfo)
		member.POST("/recharge", memberH.CreateRecharge)
		member.GET("/recharges", memberH.ListRecharges)
	}
}

// RegisterMemberCallbackRoutes 注册充值回调路由（无需认证）
func RegisterMemberCallbackRoutes(r *gin.RouterGroup) {
	rechargeRepo := repository.NewRechargeRepository()
	userRepo := repository.NewUserRepository()
	memberSvc := service.NewMemberService(rechargeRepo, userRepo)
	memberH := handler.NewMemberHandler(memberSvc)

	r.POST("/member/recharge/callback", memberH.RechargeCallback)
}
