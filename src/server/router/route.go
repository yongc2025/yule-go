package router

import (
	"yule-go/handler"

	"github.com/gin-gonic/gin"
)

// RegisterRouteRoutes 注册线路相关路由
func RegisterRouteRoutes(r *gin.RouterGroup) {
	r.GET("/routes", handler.RouteList)
	r.GET("/routes/:id", handler.RouteDetail)
}
