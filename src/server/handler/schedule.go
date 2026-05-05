package handler

import (
	"net/http"
	"strconv"

	"yule-go/model"
	"yule-go/pkg/response"
	"yule-go/service"

	"github.com/gin-gonic/gin"
)

type scheduleHandler struct {
	svc service.ScheduleService
}

// NewScheduleHandler 创建团期 Handler
func NewScheduleHandler(svc service.ScheduleService) *scheduleHandler {
	return &scheduleHandler{svc: svc}
}

// Create 创建团期（管理员）
// POST /api/v1/admin/schedules
func (h *scheduleHandler) Create(c *gin.Context) {
	var req model.CreateScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	schedule, err := h.svc.Create(&req)
	if err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.SuccessWithMessage(c, "创建成功", schedule.ToResponse())
}

// Update 更新团期（管理员）
// PUT /api/v1/admin/schedules/:id
func (h *scheduleHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的团期 ID")
		return
	}

	var req model.UpdateScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	schedule, err := h.svc.Update(id, &req)
	if err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.SuccessWithMessage(c, "更新成功", schedule.ToResponse())
}

// Cancel 取消团期（管理员）
// PUT /api/v1/admin/schedules/:id/cancel
func (h *scheduleHandler) Cancel(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的团期 ID")
		return
	}

	if err := h.svc.Cancel(id); err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.SuccessWithMessage(c, "取消成功", nil)
}

// GetByID 查询团期详情（管理员）
// GET /api/v1/admin/schedules/:id
func (h *scheduleHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的团期 ID")
		return
	}

	schedule, err := h.svc.GetByID(id)
	if err != nil {
		response.NotFound(c)
		return
	}

	response.Success(c, schedule.ToResponse())
}

// List 查询团期列表（管理员，分页）
// GET /api/v1/admin/schedules
func (h *scheduleHandler) List(c *gin.Context) {
	var query model.ScheduleQueryRequest
	if err := c.ShouldBindQuery(&query); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	schedules, total, err := h.svc.List(&query)
	if err != nil {
		response.ServerError(c, "查询失败: "+err.Error())
		return
	}

	response.Page(c, total, schedules)
}

// ListByWeek 按周查询团期列表（小程序端）
// GET /api/v1/schedules?week=2026-W18
func (h *scheduleHandler) ListByWeek(c *gin.Context) {
	week := c.Query("week")
	if week == "" {
		response.BadRequest(c, "缺少 week 参数")
		return
	}

	schedules, err := h.svc.ListByWeek(week)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"week":      week,
			"schedules": schedules,
		},
	})
}
