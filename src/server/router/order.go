package router

import (
	"yule-go/handler"
	"yule-go/repository"
	"yule-go/service"

	"github.com/gin-gonic/gin"
)

// RegisterOrderRoutes 注册订单相关路由（小程序端，需要用户 JWT 认证）
func RegisterOrderRoutes(r *gin.RouterGroup) {
	// 初始化依赖链
	orderRepo := repository.NewOrderRepository()
	scheduleRepo := repository.NewScheduleRepository()
	rentalRepo := repository.NewRentalItemRepository()
	userRepo := repository.NewUserRepository()
	orderSvc := service.NewOrderService(orderRepo, scheduleRepo, rentalRepo, userRepo)
	orderH := handler.NewOrderHandler(orderSvc)

	// 小程序端订单路由
	orders := r.Group("/orders")
	{
		orders.POST("", orderH.Create)
		orders.GET("", orderH.ListByUser)
		orders.GET("/:order_no", orderH.GetByOrderNo)
		orders.POST("/:order_no/cancel", orderH.Cancel)
	}
}

// RegisterAdminOrderRoutes 注册管理后台订单路由（需要管理员认证）
func RegisterAdminOrderRoutes(r *gin.RouterGroup) {
	orderRepo := repository.NewOrderRepository()
	scheduleRepo := repository.NewScheduleRepository()
	rentalRepo := repository.NewRentalItemRepository()
	userRepo := repository.NewUserRepository()
	orderSvc := service.NewOrderService(orderRepo, scheduleRepo, rentalRepo, userRepo)
	orderH := handler.NewOrderHandler(orderSvc)

	r.GET("/orders", orderH.AdminList)
	r.GET("/orders/:id", orderH.AdminGetByID)
	r.POST("/orders/cancel-expired", handler.AdminCancelExpiredOrders)
}

// RegisterPaymentRoutes 注册支付回调路由（无需认证）
func RegisterPaymentRoutes(r *gin.RouterGroup) {
	orderRepo := repository.NewOrderRepository()
	scheduleRepo := repository.NewScheduleRepository()
	rentalRepo := repository.NewRentalItemRepository()
	userRepo := repository.NewUserRepository()
	orderSvc := service.NewOrderService(orderRepo, scheduleRepo, rentalRepo, userRepo)
	orderH := handler.NewOrderHandler(orderSvc)

	r.POST("/orders/payment/callback", orderH.PaymentCallback)
}

// RegisterRentalRoutes 注册租赁项相关路由
func RegisterRentalRoutes(r *gin.RouterGroup) {
	rentalRepo := repository.NewRentalItemRepository()
	rentalH := handler.NewRentalHandler(rentalRepo)

	r.GET("/rental-items", rentalH.List)
}
