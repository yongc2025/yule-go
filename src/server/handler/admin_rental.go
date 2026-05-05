package handler

import (
	"strconv"

	"yule-go/db"
	"yule-go/model"
	"yule-go/pkg/response"

	"github.com/gin-gonic/gin"
)

// AdminRentalList 管理后台装备列表
// GET /api/v1/admin/rental-items
func AdminRentalList(c *gin.Context) {
	var items []model.RentalItem
	if err := db.DB.Order("id ASC").Find(&items).Error; err != nil {
		response.ServerError(c, "查询失败")
		return
	}
	response.Success(c, items)
}

// AdminRentalCreate 管理后台创建装备
// POST /api/v1/admin/rental-items
func AdminRentalCreate(c *gin.Context) {
	var req struct {
		Name        string  `json:"name" binding:"required"`
		PricePerDay float64 `json:"price_per_day" binding:"required"`
		Stock       uint    `json:"stock" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	item := &model.RentalItem{
		Name:        req.Name,
		PricePerDay: req.PricePerDay,
		Stock:       req.Stock,
		Status:      1,
	}
	if err := db.DB.Create(item).Error; err != nil {
		response.ServerError(c, "创建失败")
		return
	}
	response.SuccessWithMessage(c, "创建成功", item)
}

// AdminRentalUpdate 管理后台编辑装备
// PUT /api/v1/admin/rental-items/:id
func AdminRentalUpdate(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的 ID")
		return
	}

	var item model.RentalItem
	if err := db.DB.First(&item, id).Error; err != nil {
		response.NotFound(c)
		return
	}

	var req struct {
		Name        *string  `json:"name"`
		PricePerDay *float64 `json:"price_per_day"`
		Stock       *uint    `json:"stock"`
		Status      *uint8   `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}

	if req.Name != nil {
		item.Name = *req.Name
	}
	if req.PricePerDay != nil {
		item.PricePerDay = *req.PricePerDay
	}
	if req.Stock != nil {
		item.Stock = *req.Stock
	}
	if req.Status != nil {
		item.Status = *req.Status
	}

	if err := db.DB.Save(&item).Error; err != nil {
		response.ServerError(c, "更新失败")
		return
	}
	response.SuccessWithMessage(c, "更新成功", item)
}
