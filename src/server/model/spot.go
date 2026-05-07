package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// StringArray JSON 字符串数组（用于 fish_types、facilities、images）
type StringArray []string

func (a StringArray) Value() (driver.Value, error) {
	if a == nil {
		return "[]", nil
	}
	return json.Marshal(a)
}

func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = []string{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("StringArray.Scan: expected []byte, got %T", value)
	}
	return json.Unmarshal(bytes, a)
}

// FishingSpot 钓场模型
type FishingSpot struct {
	ID            uint64      `json:"id" gorm:"primaryKey;autoIncrement"`
	Name          string      `json:"name" gorm:"size:100;not null"`
	Address       string      `json:"address" gorm:"size:255;not null"`
	Latitude      *float64    `json:"latitude" gorm:"type:DECIMAL(10,7)"`
	Longitude     *float64    `json:"longitude" gorm:"type:DECIMAL(10,7)"`
	Description   string      `json:"description" gorm:"type:TEXT"`
	FishTypes     StringArray `json:"fish_types" gorm:"type:JSON"`
	Facilities    StringArray `json:"facilities" gorm:"type:JSON"`
	Images        StringArray `json:"images" gorm:"type:JSON"`
	CoverImage    string      `json:"cover_image" gorm:"size:512"`
	ContactName   string      `json:"contact_name" gorm:"size:64"`
	ContactPhone  string      `json:"contact_phone" gorm:"size:20"`
	BusinessHours string      `json:"business_hours" gorm:"size:50"`
	Status        uint8       `json:"status" gorm:"default:1;index"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
}

// TableName 指定表名
func (FishingSpot) TableName() string {
	return "fishing_spots"
}

// SpotStatus 钓场状态常量
const (
	SpotStatusDisabled = 0 // 停用
	SpotStatusActive   = 1 // 营业中
)

// ---------- 请求/响应结构体 ----------

// CreateSpotRequest 创建钓场请求
type CreateSpotRequest struct {
	Name          string   `json:"name" binding:"required,max=100"`
	Address       string   `json:"address" binding:"required,max=255"`
	Latitude      *float64 `json:"latitude"`
	Longitude     *float64 `json:"longitude"`
	Description   string   `json:"description"`
	FishTypes     []string `json:"fish_types"`
	Facilities    []string `json:"facilities"`
	Images        []string `json:"images"`
	CoverImage    string   `json:"cover_image"`
	ContactName   string   `json:"contact_name"`
	ContactPhone  string   `json:"contact_phone"`
	BusinessHours string   `json:"business_hours"`
}

// UpdateSpotRequest 更新钓场请求
type UpdateSpotRequest struct {
	Name          *string  `json:"name"`
	Address       *string  `json:"address"`
	Latitude      *float64 `json:"latitude"`
	Longitude     *float64 `json:"longitude"`
	Description   *string  `json:"description"`
	FishTypes     []string `json:"fish_types"`
	Facilities    []string `json:"facilities"`
	Images        []string `json:"images"`
	CoverImage    *string  `json:"cover_image"`
	ContactName   *string  `json:"contact_name"`
	ContactPhone  *string  `json:"contact_phone"`
	BusinessHours *string  `json:"business_hours"`
	Status        *uint8   `json:"status"`
}

// SpotQueryRequest 钓场列表查询请求
type SpotQueryRequest struct {
	Page     int    `form:"page" binding:"min=1"`
	PageSize int    `form:"page_size" binding:"min=1,max=100"`
	Keyword  string `form:"keyword"`
	Status   *uint8 `form:"status"`
}

// NearbySpotRequest 附近钓场查询请求
type NearbySpotRequest struct {
	Latitude  float64 `form:"lat" binding:"required"`
	Longitude float64 `form:"lng" binding:"required"`
	Radius    float64 `form:"radius"` // 公里，默认 50
	Page      int     `form:"page" binding:"min=1"`
	PageSize  int     `form:"page_size" binding:"min=1,max=100"`
}

// SpotResponse 钓场响应（含距离）
type SpotResponse struct {
	FishingSpot
	Distance *float64 `json:"distance,omitempty"` // 公里，仅 nearby 接口返回
}

// SpotWithRoutes 钓场 + 关联线路
type SpotWithRoutes struct {
	FishingSpot
	Routes []Route `json:"routes"`
}

// ToResponse 转换为响应结构
func (s *FishingSpot) ToResponse() SpotResponse {
	return SpotResponse{FishingSpot: *s}
}
