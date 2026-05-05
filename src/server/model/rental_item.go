package model

import "time"

// RentalItem 装备租赁项模型
type RentalItem struct {
	ID          uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name" gorm:"size:100;not null"`
	PricePerDay float64   `json:"price_per_day" gorm:"type:DECIMAL(10,2);not null"`
	Stock       uint      `json:"stock" gorm:"default:10"`
	Status      uint8     `json:"status" gorm:"default:1;index"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TableName 指定表名
func (RentalItem) TableName() string {
	return "rental_items"
}
