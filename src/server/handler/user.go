package handler

import (
	"yule-go/model"
	"yule-go/pkg/response"
	"yule-go/repository"

	"github.com/gin-gonic/gin"
)

type userHandler struct {
	userRepo repository.UserRepository
}

// NewUserHandler 创建用户 Handler
func NewUserHandler(userRepo repository.UserRepository) *userHandler {
	return &userHandler{userRepo: userRepo}
}

// GetProfile 获取当前用户信息
// GET /api/v1/user/profile
func (h *userHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c)
		return
	}

	user, err := h.userRepo.FindByID(userID.(uint64))
	if err != nil {
		response.NotFound(c)
		return
	}

	response.Success(c, user.ToProfileResponse())
}

// UpdateProfileRequest 更新用户信息请求
type UpdateProfileRequest struct {
	Nickname string `json:"nickname" binding:"max=64"`
	Avatar   string `json:"avatar" binding:"max=512"`
}

// UpdateProfile 更新当前用户信息
// PUT /api/v1/user/profile
func (h *userHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c)
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	user, err := h.userRepo.FindByID(userID.(uint64))
	if err != nil {
		response.NotFound(c)
		return
	}

	if req.Nickname != "" {
		user.Nickname = req.Nickname
	}
	if req.Avatar != "" {
		user.Avatar = req.Avatar
	}

	if err := h.userRepo.Update(user); err != nil {
		response.ServerError(c, "更新失败: "+err.Error())
		return
	}

	response.SuccessWithMessage(c, "更新成功", user.ToProfileResponse())
}

// UpdatePhoneRequest 更新手机号请求（微信手机号快速验证）
type UpdatePhoneRequest struct {
	Code string `json:"code" binding:"required"`
}

// UpdatePhone 通过微信 code 获取手机号
// PUT /api/v1/user/phone
func (h *userHandler) UpdatePhone(c *gin.Context) {
	// TODO: 接入微信手机号快速验证组件（需要 appid + access_token 调用微信接口）
	// 当前返回占位响应，待 0014 微信支付接入时一并实现
	response.Error(c, 50100, "手机号获取功能待接入微信手机号快速验证组件")
}
