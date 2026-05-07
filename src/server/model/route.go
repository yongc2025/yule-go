package model

import "time"

// Route 线路模型
type Route struct {
	ID             uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name           string    `json:"name" gorm:"size:100;not null"`
	FishingSpotID  *uint64   `json:"fishing_spot_id" gorm:"index"`
	Type           string    `json:"type" gorm:"size:20;not null;index"` // fishing/camping/family/senior/wild_fishing
	Price          float64   `json:"price" gorm:"type:DECIMAL(10,2);not null"`
	ChildPrice     float64   `json:"child_price" gorm:"type:DECIMAL(10,2);default:0"`
	Description    string    `json:"description" gorm:"type:TEXT"`
	Itinerary      string    `json:"itinerary" gorm:"type:TEXT"`
	Includes       string    `json:"includes" gorm:"type:TEXT"`
	CoverImage     string    `json:"cover_image" gorm:"size:512"`
	MaxSlots       uint      `json:"max_slots" gorm:"default:30"`
	Status         uint8     `json:"status" gorm:"default:1;index"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// TableName 指定表名
func (Route) TableName() string {
	return "routes"
}
