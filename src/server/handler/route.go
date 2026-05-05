package handler

import (
	"strconv"

	"yule-go/db"
	"yule-go/model"
	"yule-go/pkg/response"

	"github.com/gin-gonic/gin"
)

// RouteList 获取线路列表（小程序端）
// GET /api/v1/routes
func RouteList(c *gin.Context) {
	var routes []model.Route
	if err := db.DB.Where("status = 1").Order("id ASC").Find(&routes).Error; err != nil {
		response.ServerError(c, "查询失败")
		return
	}
	response.Success(c, routes)
}

// RouteDetail 获取线路详情（小程序端）
// GET /api/v1/routes/:id
func RouteDetail(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的线路 ID")
		return
	}

	var route model.Route
	if err := db.DB.First(&route, id).Error; err != nil {
		response.NotFound(c)
		return
	}

	response.Success(c, route)
}
