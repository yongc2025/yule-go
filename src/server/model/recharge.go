package model

import "time"

// RechargeStatus 充值状态
type RechargeStatus uint8

const (
	RechargeStatusUnpaid RechargeStatus = 0 // 未支付
	RechargeStatusPaid   RechargeStatus = 1 // 已支付
)

// Recharge 充值记录模型
type Recharge struct {
	ID              uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID          uint64         `json:"user_id" gorm:"not null;index"`
	Amount          float64        `json:"amount" gorm:"type:DECIMAL(10,2);not null"`
	GiftAmount      float64        `json:"gift_amount" gorm:"type:DECIMAL(10,2);default:0"`
	PaymentStatus   RechargeStatus `json:"payment_status" gorm:"default:0"`
	WxTransactionID string         `json:"wx_transaction_id" gorm:"size:64"`
	CreatedAt       time.Time      `json:"created_at"`

	// 关联
	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

// TableName 指定表名
func (Recharge) TableName() string {
	return "recharges"
}

// RechargePlan 充值方案
type RechargePlan struct {
	Amount    float64 `json:"amount"`
	Gift      float64 `json:"gift"`
	Discount  float64 `json:"discount"`
	Level     uint8   `json:"level"`
	LevelText string  `json:"level_text"`
	Perks     string  `json:"perks"`
}

// RechargePlans 充值方案列表（硬编码配置）
var RechargePlans = []RechargePlan{
	{
		Amount:    200,
		Gift:      0,
		Discount:  0.95,
		Level:     1,
		LevelText: "银卡会员",
		Perks:     "渔具9.5折 · 每次立减10元 · 钓鱼团优惠券1张",
	},
	{
		Amount:    500,
		Gift:      0,
		Discount:  0.90,
		Level:     2,
		LevelText: "金卡会员",
		Perks:     "渔具9折 · 每次立减20元 · 装备免费租赁3次",
	},
	{
		Amount:    1000,
		Gift:      0,
		Discount:  0.85,
		Level:     3,
		LevelText: "钻石会员",
		Perks:     "渔具8.5折 · 每次立减30元 · 免费出行名额1个 · 旺季优先留位",
	},
}

// CreateRechargeRequest 创建充值请求
type CreateRechargeRequest struct {
	Plan float64 `json:"plan" binding:"required"` // 充值金额：200/500/1000
}

// CreateRechargeResponse 创建充值响应
type CreateRechargeResponse struct {
	RechargeID    uint64          `json:"recharge_id"`
	Amount        float64         `json:"amount"`
	LevelText     string          `json:"level_text"`
	PaymentParams *WxPaymentParams `json:"payment_params,omitempty"`
}

// RechargeResponse 充值记录响应
type RechargeResponse struct {
	ID            uint64  `json:"id"`
	Amount        float64 `json:"amount"`
	GiftAmount    float64 `json:"gift_amount"`
	PaymentStatus uint8   `json:"payment_status"`
	StatusText    string  `json:"status_text"`
	CreatedAt     string  `json:"created_at"`
}

// MemberInfoResponse 会员信息响应
type MemberInfoResponse struct {
	MemberLevel   uint8   `json:"member_level"`
	LevelText     string  `json:"level_text"`
	Balance       float64 `json:"balance"`
	TotalRecharge float64 `json:"total_recharge"`
	Discount      float64 `json:"discount"`
	InviteCode    string  `json:"invite_code"`
}
