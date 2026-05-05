package handler

import (
	"strconv"

	"yule-go/db"
	"yule-go/model"
	"yule-go/pkg/response"

	"github.com/gin-gonic/gin"
)

// AdminCustomerList 管理后台客户列表
// GET /api/v1/admin/customers
func AdminCustomerList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	keyword := c.Query("keyword")

	tx := db.DB.Model(&model.User{})
	if keyword != "" {
		tx = tx.Where("nickname LIKE ? OR phone LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	tx.Count(&total)

	var users []model.User
	offset := (page - 1) * pageSize
	tx.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&users)

	response.Page(c, total, users)
}

// AdminCustomerDetail 管理后台客户详情
// GET /api/v1/admin/customers/:id
func AdminCustomerDetail(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "无效的 ID")
		return
	}

	var user model.User
	if err := db.DB.First(&user, id).Error; err != nil {
		response.NotFound(c)
		return
	}

	// 查询订单数
	var orderCount int64
	db.DB.Model(&model.Order{}).Where("user_id = ?", id).Count(&orderCount)

	// 查询充值记录
	var recharges []model.Recharge
	db.DB.Where("user_id = ? AND payment_status = 1", id).Order("created_at DESC").Limit(10).Find(&recharges)

	response.Success(c, gin.H{
		"user":      user,
		"orders":    orderCount,
		"recharges": recharges,
	})
}
