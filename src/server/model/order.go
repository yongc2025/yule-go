package model

import "time"

// OrderStatus 订单状态常量
type OrderStatus uint8

const (
	OrderStatusPending   OrderStatus = 0 // 待支付
	OrderStatusConfirmed OrderStatus = 1 // 已确认
	OrderStatusDeparted  OrderStatus = 2 // 已出行
	OrderStatusCompleted OrderStatus = 3 // 已完成
	OrderStatusCancelled OrderStatus = 4 // 已取消
	OrderStatusRefunded  OrderStatus = 5 // 已退款
)

// PaymentStatus 支付状态常量
type PaymentStatus uint8

const (
	PaymentStatusUnpaid  PaymentStatus = 0 // 未支付
	PaymentStatusPaid    PaymentStatus = 1 // 已支付
	PaymentStatusRefunded PaymentStatus = 2 // 已退款
)

// Order 订单模型
type Order struct {
	ID              uint64        `json:"id" gorm:"primaryKey;autoIncrement"`
	OrderNo         string        `json:"order_no" gorm:"size:32;not null;uniqueIndex"`
	UserID          uint64        `json:"user_id" gorm:"not null;index"`
	ScheduleID      uint64        `json:"schedule_id" gorm:"not null;index"`
	Adults          uint          `json:"adults" gorm:"default:1"`
	Children        uint          `json:"children" gorm:"default:0"`
	TripFee         float64       `json:"trip_fee" gorm:"type:DECIMAL(10,2);not null"`
	RentalFee       float64       `json:"rental_fee" gorm:"type:DECIMAL(10,2);default:0"`
	DiscountAmount  float64       `json:"discount_amount" gorm:"type:DECIMAL(10,2);default:0"`
	BalanceUsed     float64       `json:"balance_used" gorm:"type:DECIMAL(10,2);default:0"`
	TotalAmount     float64       `json:"total_amount" gorm:"type:DECIMAL(10,2);not null"`
	ContactName     string        `json:"contact_name" gorm:"size:64;not null"`
	ContactPhone    string        `json:"contact_phone" gorm:"size:20;not null"`
	PaymentStatus   PaymentStatus `json:"payment_status" gorm:"default:0"`
	PaymentTime     *time.Time    `json:"payment_time"`
	WxTransactionID string        `json:"wx_transaction_id" gorm:"size:64"`
	Status          OrderStatus   `json:"status" gorm:"default:0;index"`
	CancelReason    string        `json:"cancel_reason" gorm:"size:255"`
	Remark          string        `json:"remark" gorm:"size:500"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`

	// 关联
	User       User          `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Schedule   Schedule      `json:"schedule,omitempty" gorm:"foreignKey:ScheduleID"`
	Rentals    []OrderRental `json:"rentals,omitempty" gorm:"foreignKey:OrderID"`
}

// TableName 指定表名
func (Order) TableName() string {
	return "orders"
}

// StatusText 订单状态文本
func (o *Order) StatusText() string {
	switch o.Status {
	case OrderStatusPending:
		return "待支付"
	case OrderStatusConfirmed:
		return "已确认"
	case OrderStatusDeparted:
		return "已出行"
	case OrderStatusCompleted:
		return "已完成"
	case OrderStatusCancelled:
		return "已取消"
	case OrderStatusRefunded:
		return "已退款"
	default:
		return "未知"
	}
}

// CreateOrderRequest 创建订单请求
type CreateOrderRequest struct {
	ScheduleID   uint64              `json:"schedule_id" binding:"required"`
	Adults       uint                `json:"adults" binding:"required,min=1"`
	Children     uint                `json:"children"`
	RentalItems  []OrderRentalItem   `json:"rental_items"`
	ContactName  string              `json:"contact_name" binding:"required"`
	ContactPhone string              `json:"contact_phone" binding:"required"`
	UseBalance   bool                `json:"use_balance"`
	Remark       string              `json:"remark"`
}

// OrderRentalItem 租赁项请求
type OrderRentalItem struct {
	RentalItemID uint64 `json:"rental_item_id" binding:"required"`
	Quantity     uint   `json:"quantity" binding:"required,min=1"`
}

// CreateOrderResponse 创建订单响应
type CreateOrderResponse struct {
	OrderID       uint64  `json:"order_id"`
	OrderNo       string  `json:"order_no"`
	TripFee       float64 `json:"trip_fee"`
	RentalFee     float64 `json:"rental_fee"`
	DiscountAmount float64 `json:"discount_amount"`
	BalanceUsed   float64 `json:"balance_used"`
	TotalAmount   float64 `json:"total_amount"`
	PaymentParams *WxPaymentParams `json:"payment_params,omitempty"`
}

// WxPaymentParams 微信支付参数
type WxPaymentParams struct {
	TimeStamp string `json:"timeStamp"`
	NonceStr  string `json:"nonceStr"`
	Package   string `json:"package"`
	SignType  string `json:"signType"`
	PaySign   string `json:"paySign"`
}

// OrderQueryRequest 订单查询请求
type OrderQueryRequest struct {
	Page      int    `form:"page,default=1" binding:"min=1"`
	PageSize  int    `form:"page_size,default=10" binding:"min=1,max=100"`
	Status    *int   `form:"status"`
	StatusAll bool   `form:"status_all"`
}

// OrderResponse 订单响应（含关联信息）
type OrderResponse struct {
	ID             uint64            `json:"id"`
	OrderNo        string            `json:"order_no"`
	UserID         uint64            `json:"user_id"`
	ScheduleID     uint64            `json:"schedule_id"`
	RouteName      string            `json:"route_name"`
	TripDate       string            `json:"trip_date"`
	Adults         uint              `json:"adults"`
	Children       uint              `json:"children"`
	TripFee        float64           `json:"trip_fee"`
	RentalFee      float64           `json:"rental_fee"`
	DiscountAmount float64           `json:"discount_amount"`
	BalanceUsed    float64           `json:"balance_used"`
	TotalAmount    float64           `json:"total_amount"`
	ContactName    string            `json:"contact_name"`
	ContactPhone   string            `json:"contact_phone"`
	RentalItems    []OrderRentalResp `json:"rental_items,omitempty"`
	Status         OrderStatus       `json:"status"`
	StatusText     string            `json:"status_text"`
	PaymentStatus  PaymentStatus     `json:"payment_status"`
	Remark         string            `json:"remark"`
	CreatedAt      time.Time         `json:"created_at"`
}

// OrderRentalResp 租赁项响应
type OrderRentalResp struct {
	RentalItemID uint64  `json:"rental_item_id"`
	Name         string  `json:"name"`
	Quantity     uint    `json:"quantity"`
	UnitPrice    float64 `json:"unit_price"`
	Subtotal     float64 `json:"subtotal"`
}

// ToResponse 转换为响应结构
func (o *Order) ToResponse() OrderResponse {
	resp := OrderResponse{
		ID:             o.ID,
		OrderNo:        o.OrderNo,
		UserID:         o.UserID,
		ScheduleID:     o.ScheduleID,
		Adults:         o.Adults,
		Children:       o.Children,
		TripFee:        o.TripFee,
		RentalFee:      o.RentalFee,
		DiscountAmount: o.DiscountAmount,
		BalanceUsed:    o.BalanceUsed,
		TotalAmount:    o.TotalAmount,
		ContactName:    o.ContactName,
		ContactPhone:   o.ContactPhone,
		Status:         o.Status,
		StatusText:     o.StatusText(),
		PaymentStatus:  o.PaymentStatus,
		Remark:         o.Remark,
		CreatedAt:      o.CreatedAt,
	}

	if o.Schedule.ID > 0 {
		resp.TripDate = o.Schedule.TripDate
		if o.Schedule.Route.ID > 0 {
			resp.RouteName = o.Schedule.Route.Name
		}
	}

	if len(o.Rentals) > 0 {
		resp.RentalItems = make([]OrderRentalResp, len(o.Rentals))
		for i, r := range o.Rentals {
			resp.RentalItems[i] = OrderRentalResp{
				RentalItemID: r.RentalItemID,
				Quantity:     r.Quantity,
				UnitPrice:    r.UnitPrice,
				Subtotal:     r.Subtotal,
			}
			if r.RentalItem.ID > 0 {
				resp.RentalItems[i].Name = r.RentalItem.Name
			}
		}
	}

	return resp
}
