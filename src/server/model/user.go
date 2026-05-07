package model

import "time"

// User 用户模型
type User struct {
	ID             uint64     `json:"id" gorm:"primaryKey;autoIncrement"`
	OpenID         string     `json:"openid" gorm:"size:64;not null;uniqueIndex"`
	UnionID        string     `json:"unionid" gorm:"size:64"`
	Nickname       string     `json:"nickname" gorm:"size:64"`
	Avatar         string     `json:"avatar" gorm:"size:512"`
	Phone          string     `json:"phone" gorm:"size:20;index"`
	MemberLevel    uint8      `json:"member_level" gorm:"default:0"`
	Balance        float64    `json:"balance" gorm:"type:DECIMAL(10,2);default:0"`
	TotalRecharge  float64    `json:"total_recharge" gorm:"type:DECIMAL(10,2);default:0"`
	InviteCode     string     `json:"invite_code" gorm:"size:16;not null;uniqueIndex"`
	InvitedBy      *uint64    `json:"invited_by" gorm:"index"`
	LastLoginAt    *time.Time `json:"last_login_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// MemberDiscount 会员折扣率
func (u *User) MemberDiscount() float64 {
	switch u.MemberLevel {
	case 1: // 银卡
		return 0.95
	case 2: // 金卡
		return 0.90
	case 3: // 钻石
		return 0.85
	default: // 普通
		return 1.0
	}
}
