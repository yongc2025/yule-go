package handler

import (
	"yule-go/pkg/response"
	"yule-go/repository"

	"github.com/gin-gonic/gin"
)

type rentalHandler struct {
	repo repository.RentalItemRepository
}

// NewRentalHandler 创建租赁项 Handler
func NewRentalHandler(repo repository.RentalItemRepository) *rentalHandler {
	return &rentalHandler{repo: repo}
}

// List 获取可租赁装备列表（小程序端）
// GET /api/v1/rental-items
func (h *rentalHandler) List(c *gin.Context) {
	items, err := h.repo.FindAll()
	if err != nil {
		response.ServerError(c, "查询失败")
		return
	}
	response.Success(c, items)
}
