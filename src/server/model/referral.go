package model

import "time"

// ReferralStatus 裂变记录状态
type ReferralStatus uint8

const (
	ReferralStatusPending  ReferralStatus = 0 // 待触发
	ReferralStatusRewarded ReferralStatus = 1 // 已奖励
	ReferralStatusExpired  ReferralStatus = 2 // 已失效
)

// Referral 裂变记录模型
type Referral struct {
	ID              uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	InviterID       uint64         `json:"inviter_id" gorm:"not null;index"`
	InviteeID       uint64         `json:"invitee_id" gorm:"not null;uniqueIndex"`
	InviteeOrderID  *uint64        `json:"invitee_order_id"`
	RewardAmount    float64        `json:"reward_amount" gorm:"type:DECIMAL(10,2);default:20"`
	NewUserDiscount float64        `json:"new_user_discount" gorm:"type:DECIMAL(10,2);default:15"`
	Status          ReferralStatus `json:"status" gorm:"default:0"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`

	// 关联
	Inviter User `json:"inviter,omitempty" gorm:"foreignKey:InviterID"`
	Invitee User `json:"invitee,omitempty" gorm:"foreignKey:InviteeID"`
}

// TableName 指定表名
func (Referral) TableName() string {
	return "referrals"
}

// ReferralInfoResponse 邀请信息响应
type ReferralInfoResponse struct {
	InviteCode    string             `json:"invite_code"`
	InviteURL     string             `json:"invite_url"`
	TotalInvited  int                `json:"total_invited"`
	TotalReward   float64            `json:"total_reward"`
	InvitedList   []ReferralItemResp `json:"invited_list"`
}

// ReferralItemResp 邀请列表项
type ReferralItemResp struct {
	Nickname    string  `json:"nickname"`
	Avatar      string  `json:"avatar"`
	RewardAmount float64 `json:"reward_amount"`
	Status      uint8   `json:"status"`
	StatusText  string  `json:"status_text"`
	CreatedAt   string  `json:"created_at"`
}
