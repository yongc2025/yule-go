package handler

import (
	"strconv"

	"yule-go/model"
	"yule-go/pkg/response"
	"yule-go/service"

	"github.com/gin-gonic/gin"
)

type spotHandler struct {
	svc service.SpotService
}

// NewSpotHandler 创建钓场 Handler
func NewSpotHandler(svc service.SpotService) *spotHandler {
	return &spotHandler{svc: svc}
}

// Create 创建钓场（管理员）
// POST /api/v1/admin/spots
func (h *spotHandler) Create(c *gin.Context) {
	var req model.CreateSpotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	spot, err := h.svc.Create(&req)
	if err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.SuccessWithMessage(c, "创建成功", spot)
}

// Update 更新钓场（管理员）
// PUT /api/v1/admin/spots/:id
func (h *spotHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的钓场 ID")
		return
	}

	var req model.UpdateSpotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	spot, err := h.svc.Update(id, &req)
	if err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.SuccessWithMessage(c, "更新成功", spot)
}

// Delete 删除钓场（管理员）
// DELETE /api/v1/admin/spots/:id
func (h *spotHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的钓场 ID")
		return
	}

	if err := h.svc.Delete(id); err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.SuccessWithMessage(c, "删除成功", nil)
}

// GetByID 钓场详情（管理员）
// GET /api/v1/admin/spots/:id
func (h *spotHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的钓场 ID")
		return
	}

	spot, err := h.svc.GetByID(id)
	if err != nil {
		response.NotFound(c)
		return
	}

	response.Success(c, spot)
}

// List 钓场列表（管理员，分页）
// GET /api/v1/admin/spots
func (h *spotHandler) List(c *gin.Context) {
	var query model.SpotQueryRequest
	if err := c.ShouldBindQuery(&query); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	spots, total, err := h.svc.List(&query)
	if err != nil {
		response.ServerError(c, "查询失败: "+err.Error())
		return
	}

	response.Page(c, total, spots)
}

// ---------- 小程序端公开接口 ----------

// PublicList 钓场列表（小程序端）
// GET /api/v1/spots
func (h *spotHandler) PublicList(c *gin.Context) {
	var query model.SpotQueryRequest
	if err := c.ShouldBindQuery(&query); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	// 小程序端只显示营业中的钓场
	active := uint8(model.SpotStatusActive)
	query.Status = &active

	spots, total, err := h.svc.List(&query)
	if err != nil {
		response.ServerError(c, "查询失败: "+err.Error())
		return
	}

	response.Page(c, total, spots)
}

// PublicGetByID 钓场详情（小程序端）
// GET /api/v1/spots/:id
func (h *spotHandler) PublicGetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的钓场 ID")
		return
	}

	spot, err := h.svc.GetByID(id)
	if err != nil {
		response.NotFound(c)
		return
	}

	response.Success(c, spot)
}

// Nearby 附近钓场
// GET /api/v1/spots/nearby?lat=&lng=&radius=
func (h *spotHandler) Nearby(c *gin.Context) {
	var req model.NearbySpotRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	results, total, err := h.svc.Nearby(&req)
	if err != nil {
		response.ServerError(c, "查询失败: "+err.Error())
		return
	}

	response.Success(c, response.PageResult{
		Total: total,
		List:  results,
	})
}

// RoutesBySpot 钓场关联线路
// GET /api/v1/spots/:id/routes
func (h *spotHandler) RoutesBySpot(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的钓场 ID")
		return
	}

	result, err := h.svc.GetRoutesBySpotID(id)
	if err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.Success(c, result)
}
