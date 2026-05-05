package model

import "time"

// OrderRental 订单租赁明细模型
type OrderRental struct {
	ID           uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	OrderID      uint64    `json:"order_id" gorm:"not null;index"`
	RentalItemID uint64    `json:"rental_item_id" gorm:"not null"`
	Quantity     uint      `json:"quantity" gorm:"default:1"`
	UnitPrice    float64   `json:"unit_price" gorm:"type:DECIMAL(10,2);not null"`
	Subtotal     float64   `json:"subtotal" gorm:"type:DECIMAL(10,2);not null"`
	CreatedAt    time.Time `json:"created_at"`

	// 关联
	RentalItem RentalItem `json:"rental_item,omitempty" gorm:"foreignKey:RentalItemID"`
}

// TableName 指定表名
func (OrderRental) TableName() string {
	return "order_rentals"
}
