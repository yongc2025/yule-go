package handler

import (
	"strconv"

	"yule-go/db"
	"yule-go/model"
	"yule-go/pkg/response"

	"github.com/gin-gonic/gin"
)

// AdminRouteList 管理后台线路列表
// GET /api/v1/admin/routes
func AdminRouteList(c *gin.Context) {
	var routes []model.Route
	if err := db.DB.Order("id ASC").Find(&routes).Error; err != nil {
		response.ServerError(c, "查询失败")
		return
	}
	response.Success(c, routes)
}

// AdminRouteUpdate 管理后台编辑线路
// PUT /api/v1/admin/routes/:id
func AdminRouteUpdate(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的 ID")
		return
	}

	var route model.Route
	if err := db.DB.First(&route, id).Error; err != nil {
		response.NotFound(c)
		return
	}

	var req struct {
		Name        *string  `json:"name"`
		Price       *float64 `json:"price"`
		ChildPrice  *float64 `json:"child_price"`
		Description *string  `json:"description"`
		Itinerary   *string  `json:"itinerary"`
		Includes    *string  `json:"includes"`
		CoverImage  *string  `json:"cover_image"`
		MaxSlots    *uint    `json:"max_slots"`
		Status      *uint8   `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}

	if req.Name != nil {
		route.Name = *req.Name
	}
	if req.Price != nil {
		route.Price = *req.Price
	}
	if req.ChildPrice != nil {
		route.ChildPrice = *req.ChildPrice
	}
	if req.Description != nil {
		route.Description = *req.Description
	}
	if req.Itinerary != nil {
		route.Itinerary = *req.Itinerary
	}
	if req.Includes != nil {
		route.Includes = *req.Includes
	}
	if req.CoverImage != nil {
		route.CoverImage = *req.CoverImage
	}
	if req.MaxSlots != nil {
		route.MaxSlots = *req.MaxSlots
	}
	if req.Status != nil {
		route.Status = *req.Status
	}

	if err := db.DB.Save(&route).Error; err != nil {
		response.ServerError(c, "更新失败")
		return
	}
	response.SuccessWithMessage(c, "更新成功", route)
}
