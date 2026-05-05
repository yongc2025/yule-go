package handler

import (
	"time"

	"yule-go/db"
	"yule-go/model"
	"yule-go/pkg/response"

	"github.com/gin-gonic/gin"
)

// AdminFinanceSummary 财务汇总
// GET /api/v1/admin/finance/summary
func AdminFinanceSummary(c *gin.Context) {
	period := c.DefaultQuery("period", "week")
	now := time.Now()

	var startDate time.Time
	switch period {
	case "today":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)
	case "week":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)
		startDate = startDate.AddDate(0, 0, -int(startDate.Weekday())+1)
		if now.Weekday() == time.Sunday {
			startDate = startDate.AddDate(0, 0, -6)
		}
	case "month":
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)
	default:
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)
	}

	// 总营收
	var totalRevenue float64
	db.DB.Model(&model.Order{}).
		Where("payment_status = 1 AND payment_time >= ?", startDate).
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&totalRevenue)

	// 订单数
	var orderCount int64
	db.DB.Model(&model.Order{}).Where("created_at >= ?", startDate).Count(&orderCount)

	// 充值收入
	var rechargeRevenue float64
	db.DB.Model(&model.Recharge{}).
		Where("payment_status = 1 AND created_at >= ?", startDate).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&rechargeRevenue)

	// 新用户数
	var newUsers int64
	db.DB.Model(&model.User{}).Where("created_at >= ?", startDate).Count(&newUsers)

	response.Success(c, gin.H{
		"period":           period,
		"total_revenue":    totalRevenue,
		"order_count":      orderCount,
		"recharge_revenue": rechargeRevenue,
		"new_users":        newUsers,
		"start_date":       startDate.Format("2006-01-02"),
	})
}

// AdminFinanceByRoute 按线路统计
// GET /api/v1/admin/finance/by-route
func AdminFinanceByRoute(c *gin.Context) {
	type RouteStat struct {
		RouteName string  `json:"route_name"`
		OrderCount int64   `json:"order_count"`
		Revenue    float64 `json:"revenue"`
	}

	var stats []RouteStat
	db.DB.Raw(`
		SELECT r.name AS route_name, COUNT(o.id) AS order_count,
			COALESCE(SUM(o.total_amount), 0) AS revenue
		FROM orders o
		JOIN schedules s ON o.schedule_id = s.id
		JOIN routes r ON s.route_id = r.id
		WHERE o.payment_status = 1
		GROUP BY r.id, r.name
		ORDER BY revenue DESC
	`).Scan(&stats)

	response.Success(c, stats)
}
