package repository

import (
	"fmt"
	"time"

	"yule-go/db"
	"yule-go/model"

	"gorm.io/gorm"
)

type orderRepository struct {
	db *gorm.DB
}

// OrderRepository 订单数据访问接口
type OrderRepository interface {
	Create(order *model.Order) error
	FindByID(id uint64) (*model.Order, error)
	FindByOrderNo(orderNo string) (*model.Order, error)
	FindByUserAndSchedule(userID, scheduleID uint64) (*model.Order, error)
	ListByUser(userID uint64, query *model.OrderQueryRequest) ([]model.Order, int64, error)
	Update(order *model.Order) error
	UpdateStatus(id uint64, status model.OrderStatus) error
	CancelExpiredOrders(expireDuration time.Duration) (int64, error)
}

// NewOrderRepository 创建订单 Repository
func NewOrderRepository() OrderRepository {
	return &orderRepository{db: db.DB}
}

// Create 创建订单（含租赁明细，事务）
func (r *orderRepository) Create(order *model.Order) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 创建订单
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		// 创建租赁明细
		for i := range order.Rentals {
			order.Rentals[i].OrderID = order.ID
			if err := tx.Create(&order.Rentals[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// FindByID 根据 ID 查询订单（含关联）
func (r *orderRepository) FindByID(id uint64) (*model.Order, error) {
	var order model.Order
	err := r.db.Preload("Schedule").Preload("Schedule.Route").
		Preload("Rentals").Preload("Rentals.RentalItem").
		First(&order, id).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

// FindByOrderNo 根据订单号查询订单（含关联）
func (r *orderRepository) FindByOrderNo(orderNo string) (*model.Order, error) {
	var order model.Order
	err := r.db.Preload("Schedule").Preload("Schedule.Route").
		Preload("Rentals").Preload("Rentals.RentalItem").
		Where("order_no = ?", orderNo).First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

// FindByUserAndSchedule 查询用户在同一团期的订单（排除已取消）
func (r *orderRepository) FindByUserAndSchedule(userID, scheduleID uint64) (*model.Order, error) {
	var order model.Order
	err := r.db.Where("user_id = ? AND schedule_id = ? AND status != ?",
		userID, scheduleID, model.OrderStatusCancelled).
		First(&order).Error
	if err != nil {
		return nil, err
	}
	return &order, nil
}

// ListByUser 查询用户的订单列表（userID=0 表示查询所有用户）
func (r *orderRepository) ListByUser(userID uint64, query *model.OrderQueryRequest) ([]model.Order, int64, error) {
	var orders []model.Order
	var total int64

	tx := r.db.Model(&model.Order{})

	if userID > 0 {
		tx = tx.Where("user_id = ?", userID)
	}

	if query.Status != nil {
		tx = tx.Where("status = ?", *query.Status)
	}

	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (query.Page - 1) * query.PageSize
	err := tx.Preload("Schedule").Preload("Schedule.Route").
		Order("created_at DESC").
		Offset(offset).Limit(query.PageSize).
		Find(&orders).Error
	if err != nil {
		return nil, 0, err
	}

	return orders, total, nil
}

// Update 更新订单
func (r *orderRepository) Update(order *model.Order) error {
	return r.db.Save(order).Error
}

// UpdateStatus 更新订单状态
func (r *orderRepository) UpdateStatus(id uint64, status model.OrderStatus) error {
	return r.db.Model(&model.Order{}).Where("id = ?", id).Update("status", status).Error
}

// CancelExpiredOrders 取消超时未支付的订单
func (r *orderRepository) CancelExpiredOrders(expireDuration time.Duration) (int64, error) {
	deadline := time.Now().Add(-expireDuration)
	result := r.db.Model(&model.Order{}).
		Where("status = ? AND payment_status = ? AND created_at < ?",
			model.OrderStatusPending, model.PaymentStatusUnpaid, deadline).
		Updates(map[string]interface{}{
			"status":         model.OrderStatusCancelled,
			"cancel_reason":  "超时未支付，系统自动取消",
		})
	return result.RowsAffected, result.Error
}

// --- 租赁项 Repository ---

type rentalItemRepository struct {
	db *gorm.DB
}

// RentalItemRepository 租赁项数据访问接口
type RentalItemRepository interface {
	FindAll() ([]model.RentalItem, error)
	FindByID(id uint64) (*model.RentalItem, error)
}

// NewRentalItemRepository 创建租赁项 Repository
func NewRentalItemRepository() RentalItemRepository {
	return &rentalItemRepository{db: db.DB}
}

// FindAll 查询所有上架的租赁项
func (r *rentalItemRepository) FindAll() ([]model.RentalItem, error) {
	var items []model.RentalItem
	err := r.db.Where("status = 1").Order("id ASC").Find(&items).Error
	return items, err
}

// FindByID 根据 ID 查询租赁项
func (r *rentalItemRepository) FindByID(id uint64) (*model.RentalItem, error) {
	var item model.RentalItem
	err := r.db.First(&item, id).Error
	if err != nil {
		return nil, fmt.Errorf("租赁项不存在: %w", err)
	}
	return &item, nil
}
