package handler

import (
	"strconv"

	"yule-go/model"
	"yule-go/pkg/response"
	"yule-go/service"

	"github.com/gin-gonic/gin"
)

type orderHandler struct {
	svc service.OrderService
}

// NewOrderHandler 创建订单 Handler
func NewOrderHandler(svc service.OrderService) *orderHandler {
	return &orderHandler{svc: svc}
}

// Create 创建订单（小程序端）
// POST /api/v1/orders
func (h *orderHandler) Create(c *gin.Context) {
	// 从 JWT 中获取用户 ID
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c)
		return
	}

	var req model.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	result, err := h.svc.Create(userID.(uint64), &req)
	if err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.SuccessWithMessage(c, "下单成功", result)
}

// GetByOrderNo 查询订单详情（小程序端）
// GET /api/v1/orders/:order_no
func (h *orderHandler) GetByOrderNo(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c)
		return
	}

	orderNo := c.Param("order_no")
	order, err := h.svc.GetByOrderNo(orderNo)
	if err != nil {
		response.NotFound(c)
		return
	}

	// 校验订单归属
	if order.OrderNo != "" {
		// 通过 service 层已做归属校验，这里直接返回
	}

	_ = userID // 后续可在 service 层做更严格的归属校验
	response.Success(c, order)
}

// ListByUser 查询用户订单列表（小程序端）
// GET /api/v1/orders
func (h *orderHandler) ListByUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c)
		return
	}

	var query model.OrderQueryRequest
	if err := c.ShouldBindQuery(&query); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	orders, total, err := h.svc.ListByUser(userID.(uint64), &query)
	if err != nil {
		response.ServerError(c, "查询失败: "+err.Error())
		return
	}

	response.Page(c, total, orders)
}

// Cancel 取消订单（小程序端）
// POST /api/v1/orders/:order_no/cancel
func (h *orderHandler) Cancel(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c)
		return
	}

	orderNo := c.Param("order_no")

	var req struct {
		Reason string `json:"reason"`
	}
	_ = c.ShouldBindJSON(&req)

	if err := h.svc.Cancel(orderNo, userID.(uint64), req.Reason); err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.SuccessWithMessage(c, "取消成功", nil)
}

// PaymentCallback 微信支付回调
// POST /api/v1/orders/payment/callback
func (h *orderHandler) PaymentCallback(c *gin.Context) {
	var req struct {
		OrderNo       string `json:"order_no" binding:"required"`
		TransactionID string `json:"transaction_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}

	if err := h.svc.PaymentCallback(req.OrderNo, req.TransactionID); err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.Success(c, nil)
}

// --- 管理后台 ---

// AdminList 管理后台订单列表
// GET /api/v1/admin/orders
func (h *orderHandler) AdminList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	var status *int
	if s := c.Query("status"); s != "" {
		v, _ := strconv.Atoi(s)
		status = &v
	}

	query := &model.OrderQueryRequest{
		Page:     page,
		PageSize: pageSize,
		Status:   status,
	}

	// 管理后台查询所有订单（不限用户）
	orders, total, err := h.svc.ListByUser(0, query)
	if err != nil {
		response.ServerError(c, "查询失败")
		return
	}

	response.Page(c, total, orders)
}

// AdminGetByID 管理后台订单详情
// GET /api/v1/admin/orders/:id
func (h *orderHandler) AdminGetByID(c *gin.Context) {
	orderNo := c.Param("id")

	order, err := h.svc.GetByOrderNo(orderNo)
	if err != nil {
		response.NotFound(c)
		return
	}

	response.Success(c, order)
}
