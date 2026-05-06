package handler

import (
	"crypto/sha256"
	"fmt"
	"strconv"

	"yule-go/config"
	"yule-go/model"
	"yule-go/pkg/response"
	"yule-go/service"

	"github.com/gin-gonic/gin"
)

type memberHandler struct {
	svc service.MemberService
}

// NewMemberHandler 创建会员 Handler
func NewMemberHandler(svc service.MemberService) *memberHandler {
	return &memberHandler{svc: svc}
}

// GetPlans 获取充值方案
// GET /api/v1/member/plans
func (h *memberHandler) GetPlans(c *gin.Context) {
	plans := h.svc.GetPlans()
	response.Success(c, plans)
}

// GetMemberInfo 获取会员信息
// GET /api/v1/member/info
func (h *memberHandler) GetMemberInfo(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c)
		return
	}

	info, err := h.svc.GetMemberInfo(userID.(uint64))
	if err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.Success(c, info)
}

// CreateRecharge 发起充值
// POST /api/v1/member/recharge
func (h *memberHandler) CreateRecharge(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c)
		return
	}

	var req model.CreateRechargeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	result, err := h.svc.CreateRecharge(userID.(uint64), &req)
	if err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.SuccessWithMessage(c, "充值订单已创建", result)
}

// RechargeCallback 充值支付回调
// POST /api/v1/member/recharge/callback
func (h *memberHandler) RechargeCallback(c *gin.Context) {
	var req struct {
		RechargeID    uint64 `json:"recharge_id" binding:"required"`
		TransactionID string `json:"transaction_id" binding:"required"`
		Sign          string `json:"sign" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}

	// 校验回调签名
	expectedSign := fmt.Sprintf("%x", sha256.Sum256([]byte(
		fmt.Sprintf("%d%s%s", req.RechargeID, req.TransactionID, config.C.Wechat.MchKey))))
	if req.Sign != expectedSign {
		response.Error(c, 40300, "签名验证失败")
		return
	}

	if err := h.svc.RechargeCallback(req.RechargeID, req.TransactionID); err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.Success(c, nil)
}

// ListRecharges 充值记录
// GET /api/v1/member/recharges
func (h *memberHandler) ListRecharges(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	recharges, total, err := h.svc.ListRecharges(userID.(uint64), page, pageSize)
	if err != nil {
		response.ServerError(c, "查询失败")
		return
	}

	response.Page(c, total, recharges)
}
