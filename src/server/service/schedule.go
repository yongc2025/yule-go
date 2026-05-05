package service

import (
	"errors"
	"fmt"
	"time"

	"yule-go/model"
	"yule-go/repository"

	"gorm.io/gorm"
)

type scheduleService struct {
	repo repository.ScheduleRepository
}

// ScheduleService 团期业务逻辑接口
type ScheduleService interface {
	Create(req *model.CreateScheduleRequest) (*model.Schedule, error)
	Update(id uint64, req *model.UpdateScheduleRequest) (*model.Schedule, error)
	Cancel(id uint64) error
	GetByID(id uint64) (*model.Schedule, error)
	List(query *model.ScheduleQueryRequest) ([]model.ScheduleResponse, int64, error)
	ListByWeek(week string) ([]model.ScheduleResponse, error)
}

// NewScheduleService 创建团期 Service
func NewScheduleService(repo repository.ScheduleRepository) ScheduleService {
	return &scheduleService{repo: repo}
}

// Create 创建团期
func (s *scheduleService) Create(req *model.CreateScheduleRequest) (*model.Schedule, error) {
	// 1. 校验日期是否为周六或周日
	if err := validateWeekday(req.TripDate); err != nil {
		return nil, err
	}

	// 2. 校验日期不能是过去的日期
	if err := validateFutureDate(req.TripDate); err != nil {
		return nil, err
	}

	// 3. 去重校验：同一线路同一天不能重复
	existing, err := s.repo.FindByRouteAndDate(req.RouteID, req.TripDate)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("查询团期失败: %w", err)
	}
	if existing != nil {
		return nil, errors.New("该线路该日期已有团期")
	}

	// 4. 创建团期
	schedule := &model.Schedule{
		RouteID:    req.RouteID,
		TripDate:   req.TripDate,
		MaxSlots:   req.MaxSlots,
		GuideName:  req.GuideName,
		GuidePhone: req.GuidePhone,
		Status:     model.ScheduleStatusEnrolling,
	}

	if err := s.repo.Create(schedule); err != nil {
		return nil, fmt.Errorf("创建团期失败: %w", err)
	}

	return schedule, nil
}

// Update 更新团期
func (s *scheduleService) Update(id uint64, req *model.UpdateScheduleRequest) (*model.Schedule, error) {
	schedule, err := s.repo.FindByID(id)
	if err != nil {
		return nil, fmt.Errorf("团期不存在: %w", err)
	}

	// 只有报名中或已满的团期可以编辑
	if schedule.Status != model.ScheduleStatusEnrolling && schedule.Status != model.ScheduleStatusFull {
		return nil, errors.New("当前状态不允许编辑")
	}

	// 更新字段
	if req.MaxSlots != nil {
		schedule.MaxSlots = *req.MaxSlots
		// 重新计算状态
		if schedule.BookedSlots >= schedule.MaxSlots {
			schedule.Status = model.ScheduleStatusFull
		} else {
			schedule.Status = model.ScheduleStatusEnrolling
		}
	}
	if req.GuideName != nil {
		schedule.GuideName = *req.GuideName
	}
	if req.GuidePhone != nil {
		schedule.GuidePhone = *req.GuidePhone
	}

	if err := s.repo.Update(schedule); err != nil {
		return nil, fmt.Errorf("更新团期失败: %w", err)
	}

	return schedule, nil
}

// Cancel 取消团期
func (s *scheduleService) Cancel(id uint64) error {
	schedule, err := s.repo.FindByID(id)
	if err != nil {
		return fmt.Errorf("团期不存在: %w", err)
	}

	if schedule.Status == model.ScheduleStatusCancelled {
		return errors.New("团期已取消")
	}

	if schedule.Status == model.ScheduleStatusDeparted || schedule.Status == model.ScheduleStatusCompleted {
		return errors.New("已出发或已完成的团期不能取消")
	}

	// TODO: 如果有已支付订单，触发退款流程（Task 0002 实现）

	return s.repo.UpdateStatus(id, model.ScheduleStatusCancelled)
}

// GetByID 查询团期详情
func (s *scheduleService) GetByID(id uint64) (*model.Schedule, error) {
	return s.repo.FindByID(id)
}

// List 分页查询团期列表
func (s *scheduleService) List(query *model.ScheduleQueryRequest) ([]model.ScheduleResponse, int64, error) {
	schedules, total, err := s.repo.List(query)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.ScheduleResponse, len(schedules))
	for i, schedule := range schedules {
		responses[i] = schedule.ToResponse()
	}

	return responses, total, nil
}

// ListByWeek 按周查询团期列表（小程序端）
func (s *scheduleService) ListByWeek(week string) ([]model.ScheduleResponse, error) {
	startDate, endDate := parseWeekRange(week)
	if startDate == "" || endDate == "" {
		return nil, errors.New("无效的周格式，应为 YYYY-WNN")
	}

	schedules, err := s.repo.ListByWeek(startDate, endDate)
	if err != nil {
		return nil, err
	}

	responses := make([]model.ScheduleResponse, len(schedules))
	for i, schedule := range schedules {
		responses[i] = schedule.ToResponse()
	}

	return responses, nil
}

// validateWeekday 校验日期是否为周六或周日
func validateWeekday(dateStr string) error {
	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return errors.New("日期格式无效，应为 YYYY-MM-DD")
	}
	weekday := t.Weekday()
	if weekday != time.Saturday && weekday != time.Sunday {
		return errors.New("团期日期只能是周六或周日")
	}
	return nil
}

// validateFutureDate 校验日期是否为未来日期
func validateFutureDate(dateStr string) error {
	t, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return errors.New("日期格式无效")
	}
	today := time.Now().Truncate(24 * time.Hour)
	if t.Before(today) {
		return errors.New("团期日期不能是过去的日期")
	}
	return nil
}

// parseWeekRange 解析周格式为日期范围
func parseWeekRange(week string) (string, string) {
	if len(week) < 8 || week[4:6] != "-W" {
		return "", ""
	}
	var year, weekNum int
	if _, err := fmt.Sscanf(week, "%d-W%d", &year, &weekNum); err != nil {
		return "", ""
	}
	jan4 := time.Date(year, 1, 4, 0, 0, 0, 0, time.Local)
	weekday := jan4.Weekday()
	if weekday == time.Sunday {
		weekday = 7
	}
	monday := jan4.AddDate(0, 0, -int(weekday-1))
	targetMonday := monday.AddDate(0, 0, (weekNum-1)*7)
	saturday := targetMonday.AddDate(0, 0, 5)
	sunday := targetMonday.AddDate(0, 0, 6)
	return saturday.Format("2006-01-02"), sunday.Format("2006-01-02")
}
