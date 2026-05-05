package model

import "time"

// ScheduleStatus 团期状态常量
type ScheduleStatus uint8

const (
	ScheduleStatusCancelled ScheduleStatus = 0 // 已取消
	ScheduleStatusEnrolling ScheduleStatus = 1 // 报名中
	ScheduleStatusFull      ScheduleStatus = 2 // 已满
	ScheduleStatusDeparted  ScheduleStatus = 3 // 已出发
	ScheduleStatusCompleted ScheduleStatus = 4 // 已完成
)

// Schedule 团期模型
type Schedule struct {
	ID         uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	RouteID    uint64         `json:"route_id" gorm:"not null;index"`
	TripDate   string         `json:"trip_date" gorm:"type:DATE;not null;index"`
	MaxSlots   uint           `json:"max_slots" gorm:"not null"`
	BookedSlots uint          `json:"booked_slots" gorm:"default:0"`
	GuideName  string         `json:"guide_name" gorm:"size:64"`
	GuidePhone string         `json:"guide_phone" gorm:"size:20"`
	Status     ScheduleStatus `json:"status" gorm:"default:1;index"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`

	// 关联（不在数据库中创建外键约束，仅用于 Preload 查询）
	Route Route `json:"route,omitempty" gorm:"foreignKey:RouteID"`
}

// TableName 指定表名
func (Schedule) TableName() string {
	return "schedules"
}

// IsEnrolling 是否报名中
func (s *Schedule) IsEnrolling() bool {
	return s.Status == ScheduleStatusEnrolling
}

// IsFull 是否已满
func (s *Schedule) IsFull() bool {
	return s.Status == ScheduleStatusFull
}

// RemainingSlots 剩余名额
func (s *Schedule) RemainingSlots() int {
	remaining := int(s.MaxSlots) - int(s.BookedSlots)
	if remaining < 0 {
		return 0
	}
	return remaining
}

// CreateScheduleRequest 创建团期请求
type CreateScheduleRequest struct {
	RouteID    uint64 `json:"route_id" binding:"required"`
	TripDate   string `json:"trip_date" binding:"required"`
	MaxSlots   uint   `json:"max_slots" binding:"required,min=1"`
	GuideName  string `json:"guide_name" binding:"required"`
	GuidePhone string `json:"guide_phone" binding:"required"`
}

// UpdateScheduleRequest 更新团期请求
type UpdateScheduleRequest struct {
	MaxSlots   *uint   `json:"max_slots" binding:"omitempty,min=1"`
	GuideName  *string `json:"guide_name"`
	GuidePhone *string `json:"guide_phone"`
}

// ScheduleQueryRequest 查询团期请求
type ScheduleQueryRequest struct {
	Page     int    `form:"page,default=1" binding:"min=1"`
	PageSize int    `form:"page_size,default=20" binding:"min=1,max=100"`
	Status   *int   `form:"status"`
	Week     string `form:"week"` // 格式: 2026-W18
}

// ScheduleResponse 团期响应（含线路信息）
type ScheduleResponse struct {
	ID             uint64         `json:"id"`
	RouteID        uint64         `json:"route_id"`
	RouteName      string         `json:"route_name"`
	RoutePrice     float64        `json:"route_price"`
	ChildPrice     float64        `json:"child_price"`
	RouteType      string         `json:"route_type"`
	TripDate       string         `json:"trip_date"`
	MaxSlots       uint           `json:"max_slots"`
	BookedSlots    uint           `json:"booked_slots"`
	RemainingSlots int            `json:"remaining_slots"`
	GuideName      string         `json:"guide_name"`
	GuidePhone     string         `json:"guide_phone"`
	Status         ScheduleStatus `json:"status"`
	StatusText     string         `json:"status_text"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}

// ToResponse 转换为响应结构
func (s *Schedule) ToResponse() ScheduleResponse {
	resp := ScheduleResponse{
		ID:             s.ID,
		RouteID:        s.RouteID,
		TripDate:       s.TripDate,
		MaxSlots:       s.MaxSlots,
		BookedSlots:    s.BookedSlots,
		RemainingSlots: s.RemainingSlots(),
		GuideName:      s.GuideName,
		GuidePhone:     s.GuidePhone,
		Status:         s.Status,
		StatusText:     s.StatusText(),
		CreatedAt:      s.CreatedAt,
		UpdatedAt:      s.UpdatedAt,
	}
	if s.Route.ID > 0 {
		resp.RouteName = s.Route.Name
		resp.RoutePrice = s.Route.Price
		resp.ChildPrice = s.Route.ChildPrice
		resp.RouteType = s.Route.Type
	}
	return resp
}

// StatusText 状态文本
func (s *Schedule) StatusText() string {
	switch s.Status {
	case ScheduleStatusCancelled:
		return "已取消"
	case ScheduleStatusEnrolling:
		return "报名中"
	case ScheduleStatusFull:
		return "已满"
	case ScheduleStatusDeparted:
		return "已出发"
	case ScheduleStatusCompleted:
		return "已完成"
	default:
		return "未知"
	}
}
