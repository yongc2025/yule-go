package router

import (
	"yule-go/handler"

	"github.com/gin-gonic/gin"
)

// RegisterAdminRentalRoutes 注册管理后台装备路由
func RegisterAdminRentalRoutes(r *gin.RouterGroup) {
	r.GET("/rental-items", handler.AdminRentalList)
	r.POST("/rental-items", handler.AdminRentalCreate)
	r.PUT("/rental-items/:id", handler.AdminRentalUpdate)
}
