package handler

import (
	"yule-go/pkg/response"
	"yule-go/service"

	"github.com/gin-gonic/gin"
)

type referralHandler struct {
	svc service.ReferralService
}

// NewReferralHandler 创建裂变 Handler
func NewReferralHandler(svc service.ReferralService) *referralHandler {
	return &referralHandler{svc: svc}
}

// GetInviteInfo 获取邀请信息
// GET /api/v1/referral/my
func (h *referralHandler) GetInviteInfo(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c)
		return
	}

	info, err := h.svc.GetInviteInfo(userID.(uint64))
	if err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.Success(c, info)
}

// BindInvite 绑定邀请关系
// POST /api/v1/referral/bind
func (h *referralHandler) BindInvite(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c)
		return
	}

	var req struct {
		InviteCode string `json:"invite_code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}

	if err := h.svc.BindInvite(userID.(uint64), req.InviteCode); err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.SuccessWithMessage(c, "绑定成功", nil)
}
