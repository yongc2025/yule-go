package handler

import (
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strings"

	"yule-go/config"
	"yule-go/db"
	"yule-go/model"
	"yule-go/pkg/response"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/argon2"
)

// AdminLogin 管理员登录
// POST /api/v1/admin/auth/login
func AdminLogin(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误")
		return
	}

	var admin model.Admin
	if err := db.DB.Where("username = ? AND status = 1", req.Username).First(&admin).Error; err != nil {
		response.Error(c, 40000, "用户名或密码错误")
		return
	}

	// 校验密码（使用 argon2id）
	if !verifyPassword(req.Password, admin.PasswordHash) {
		response.Error(c, 40000, "用户名或密码错误")
		return
	}

	// 生成 JWT
	claims := &jwt.MapClaims{
		"user_id":  admin.ID,
		"username": admin.Username,
		"role":     admin.Role,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(config.C.JWT.Secret))
	if err != nil {
		response.ServerError(c, "生成 token 失败")
		return
	}

	response.Success(c, gin.H{
		"token": tokenStr,
		"admin": gin.H{
			"id":       admin.ID,
			"username": admin.Username,
			"role":     admin.Role,
		},
	})
}

// AdminDashboard 管理后台首页数据
// GET /api/v1/admin/dashboard
func AdminDashboard(c *gin.Context) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)
	weekStart := todayStart.AddDate(0, 0, -int(todayStart.Weekday())+1)
	if todayStart.Weekday() == time.Sunday {
		weekStart = todayStart.AddDate(0, 0, -6)
	}
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.Local)

	// 今日营收
	var todayRevenue float64
	db.DB.Model(&model.Order{}).
		Where("payment_status = 1 AND payment_time >= ?", todayStart).
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&todayRevenue)

	// 本周营收
	var weekRevenue float64
	db.DB.Model(&model.Order{}).
		Where("payment_status = 1 AND payment_time >= ?", weekStart).
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&weekRevenue)

	// 本月营收
	var monthRevenue float64
	db.DB.Model(&model.Order{}).
		Where("payment_status = 1 AND payment_time >= ?", monthStart).
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&monthRevenue)

	// 今日订单数
	var todayOrders int64
	db.DB.Model(&model.Order{}).Where("created_at >= ?", todayStart).Count(&todayOrders)

	// 待处理订单
	var pendingOrders int64
	db.DB.Model(&model.Order{}).Where("status = 0").Count(&pendingOrders)

	// 总用户数
	var totalUsers int64
	db.DB.Model(&model.User{}).Count(&totalUsers)

	// 本周团期数
	var weekSchedules int64
	db.DB.Model(&model.Schedule{}).
		Where("trip_date >= ? AND trip_date <= ?",
			weekStart.Format("2006-01-02"),
			weekStart.AddDate(0, 0, 6).Format("2006-01-02")).
		Count(&weekSchedules)

	response.Success(c, gin.H{
		"today_revenue":  todayRevenue,
		"week_revenue":   weekRevenue,
		"month_revenue":  monthRevenue,
		"today_orders":   todayOrders,
		"pending_orders": pendingOrders,
		"total_users":    totalUsers,
		"week_schedules": weekSchedules,
	})
}

// verifyPassword 校验 argon2id 密码
func verifyPassword(password, encodedHash string) bool {
	// 格式: $argon2id$v=19$m=65536,t=3,p=2$salt$hash
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 {
		return false
	}

	var memory, iterations, parallelism uint32
	_, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism)
	if err != nil {
		return false
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false
	}

	expectedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false
	}

	hash := argon2.IDKey([]byte(password), salt, iterations, memory, parallelism, uint32(len(expectedHash)))

	return subtle.ConstantTimeCompare(hash, expectedHash) == 1
}

// HashPassword 生成 argon2id 密码哈希（用于初始化管理员密码）
func HashPassword(password string) string {
	salt := make([]byte, 16)
	// 生产环境应用 crypto/rand
	hash := argon2.IDKey([]byte(password), salt, 3, 64*1024, 2, 32)
	return fmt.Sprintf("$argon2id$v=19$m=65536,t=3,p=2$%s$%s",
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(hash))
}
