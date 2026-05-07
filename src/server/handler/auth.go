package handler

import (
	"yule-go/pkg/response"
	"yule-go/service"

	"github.com/gin-gonic/gin"
)

type authHandler struct {
	svc service.AuthService
}

// NewAuthHandler 创建认证 Handler
func NewAuthHandler(svc service.AuthService) *authHandler {
	return &authHandler{svc: svc}
}

// WxLoginRequest 微信登录请求
type WxLoginRequest struct {
	Code string `json:"code" binding:"required"`
}

// WxLogin 微信登录
// POST /api/v1/auth/wx-login
func (h *authHandler) WxLogin(c *gin.Context) {
	var req WxLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	result, err := h.svc.WxLogin(req.Code)
	if err != nil {
		response.Error(c, 40000, err.Error())
		return
	}

	response.SuccessWithMessage(c, "登录成功", result)
}
