package router

import (
	"yule-go/handler"

	"github.com/gin-gonic/gin"
)

// RegisterAdminAuthRoutes 注册管理员认证路由（无需认证）
func RegisterAdminAuthRoutes(r *gin.RouterGroup) {
	r.POST("/auth/login", handler.AdminLogin)
}

// RegisterAdminAuthProtectedRoutes 注册管理员认证保护路由（需登录）
func RegisterAdminAuthProtectedRoutes(r *gin.RouterGroup) {
	r.POST("/auth/change-password", handler.AdminChangePassword)
}

// RegisterAdminDashboardRoutes 注册管理后台仪表盘路由
func RegisterAdminDashboardRoutes(r *gin.RouterGroup) {
	r.GET("/dashboard", handler.AdminDashboard)
}

// RegisterAdminCustomerRoutes 注册管理后台客户路由
func RegisterAdminCustomerRoutes(r *gin.RouterGroup) {
	r.GET("/customers", handler.AdminCustomerList)
	r.GET("/customers/:id", handler.AdminCustomerDetail)
}

// RegisterAdminRouteRoutes 注册管理后台线路路由
func RegisterAdminRouteRoutes(r *gin.RouterGroup) {
	r.GET("/routes", handler.AdminRouteList)
	r.PUT("/routes/:id", handler.AdminRouteUpdate)
}

// RegisterAdminFinanceRoutes 注册管理后台财务路由
func RegisterAdminFinanceRoutes(r *gin.RouterGroup) {
	r.GET("/finance/summary", handler.AdminFinanceSummary)
	r.GET("/finance/by-route", handler.AdminFinanceByRoute)
}
