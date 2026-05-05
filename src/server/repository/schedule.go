package repository

import (
	"fmt"
	"time"

	"yule-go/db"
	"yule-go/model"

	"gorm.io/gorm"
)

type scheduleRepository struct {
	db *gorm.DB
}

// ScheduleRepository 团期数据访问接口
type ScheduleRepository interface {
	Create(schedule *model.Schedule) error
	Update(schedule *model.Schedule) error
	FindByID(id uint64) (*model.Schedule, error)
	FindByRouteAndDate(routeID uint64, tripDate string) (*model.Schedule, error)
	List(query *model.ScheduleQueryRequest) ([]model.Schedule, int64, error)
	ListByWeek(startDate, endDate string) ([]model.Schedule, error)
	UpdateStatus(id uint64, status model.ScheduleStatus) error
}

// NewScheduleRepository 创建团期 Repository
func NewScheduleRepository() ScheduleRepository {
	return &scheduleRepository{db: db.DB}
}

// Create 创建团期
func (r *scheduleRepository) Create(schedule *model.Schedule) error {
	return r.db.Create(schedule).Error
}

// Update 更新团期
func (r *scheduleRepository) Update(schedule *model.Schedule) error {
	return r.db.Save(schedule).Error
}

// FindByID 根据 ID 查询团期（含线路信息）
func (r *scheduleRepository) FindByID(id uint64) (*model.Schedule, error) {
	var schedule model.Schedule
	err := r.db.Preload("Route").First(&schedule, id).Error
	if err != nil {
		return nil, err
	}
	return &schedule, nil
}

// FindByRouteAndDate 根据线路和日期查询团期（用于去重校验）
func (r *scheduleRepository) FindByRouteAndDate(routeID uint64, tripDate string) (*model.Schedule, error) {
	var schedule model.Schedule
	err := r.db.Where("route_id = ? AND trip_date = ?", routeID, tripDate).First(&schedule).Error
	if err != nil {
		return nil, err
	}
	return &schedule, nil
}

// List 分页查询团期列表（含线路信息）
func (r *scheduleRepository) List(query *model.ScheduleQueryRequest) ([]model.Schedule, int64, error) {
	var schedules []model.Schedule
	var total int64

	tx := r.db.Model(&model.Schedule{}).Preload("Route")

	if query.Status != nil {
		tx = tx.Where("status = ?", *query.Status)
	}

	// 按周筛选
	if query.Week != "" {
		startDate, endDate := weekToRange(query.Week)
		if startDate != "" && endDate != "" {
			tx = tx.Where("trip_date BETWEEN ? AND ?", startDate, endDate)
		}
	}

	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.PageSize
	if err := tx.Order("trip_date ASC").Offset(offset).Limit(query.PageSize).Find(&schedules).Error; err != nil {
		return nil, 0, err
	}

	return schedules, total, nil
}

// ListByWeek 按日期范围查询团期（小程序端用）
func (r *scheduleRepository) ListByWeek(startDate, endDate string) ([]model.Schedule, error) {
	var schedules []model.Schedule
	err := r.db.Preload("Route").
		Where("trip_date BETWEEN ? AND ? AND status IN ?", startDate, endDate, []model.ScheduleStatus{
			model.ScheduleStatusEnrolling,
			model.ScheduleStatusFull,
		}).
		Order("trip_date ASC").
		Find(&schedules).Error
	return schedules, err
}

// UpdateStatus 更新团期状态
func (r *scheduleRepository) UpdateStatus(id uint64, status model.ScheduleStatus) error {
	return r.db.Model(&model.Schedule{}).Where("id = ?", id).Update("status", status).Error
}

// weekToRange 将 "2026-W18" 格式转换为该周的周六和周日日期
// 返回 startDate (周六), endDate (周日)
func weekToRange(week string) (string, string) {
	if len(week) < 8 || week[4:6] != "-W" {
		return "", ""
	}
	var year, weekNum int
	if _, err := fmt.Sscanf(week, "%d-W%d", &year, &weekNum); err != nil {
		return "", ""
	}
	// ISO 8601: 1月4日所在的周一定是第一周
	// 找到该年第一个周四（ISO 周的锚点）
	jan4 := time.Date(year, 1, 4, 0, 0, 0, 0, time.Local)
	// 找到 jan4 所在周的周一
	weekday := jan4.Weekday()
	if weekday == time.Sunday {
		weekday = 7
	}
	monday := jan4.AddDate(0, 0, -int(weekday-1))
	// 目标周的周一
	targetMonday := monday.AddDate(0, 0, (weekNum-1)*7)
	// 该周的周六和周日
	saturday := targetMonday.AddDate(0, 0, 5)
	sunday := targetMonday.AddDate(0, 0, 6)
	return saturday.Format("2006-01-02"), sunday.Format("2006-01-02")
}
