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

// Create 创建订单（含租赁明细 + 名额更新 + 库存扣减，全部在同一事务）
func (r *orderRepository) Create(order *model.Order) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. 锁定团期行（SELECT ... FOR UPDATE 防止并发超卖）
		var schedule model.Schedule
		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			First(&schedule, order.ScheduleID).Error; err != nil {
			return fmt.Errorf("团期不存在: %w", err)
		}

		// 2. 校验名额
		totalPeople := order.Adults + order.Children
		remaining := int(schedule.MaxSlots) - int(schedule.BookedSlots)
		if remaining < 0 {
			remaining = 0
		}
		if int(totalPeople) > remaining {
			return fmt.Errorf("名额不足，剩余 %d 位", remaining)
		}

		// 3. 锁定并扣减租赁项库存
		for i := range order.Rentals {
			var item model.RentalItem
			if err := tx.Set("gorm:query_option", "FOR UPDATE").
				First(&item, order.Rentals[i].RentalItemID).Error; err != nil {
				return fmt.Errorf("租赁项不存在: %w", err)
			}
			if item.Stock < order.Rentals[i].Quantity {
				return fmt.Errorf("「%s」库存不足，剩余 %d", item.Name, item.Stock)
			}
			// 扣减库存
			if err := tx.Model(&model.RentalItem{}).
				Where("id = ?", item.ID).
				Update("stock", gorm.Expr("stock - ?", order.Rentals[i].Quantity)).Error; err != nil {
				return fmt.Errorf("扣减库存失败: %w", err)
			}
		}

		// 4. 创建订单
		if err := tx.Create(order).Error; err != nil {
			return err
		}

		// 5. 创建租赁明细
		for i := range order.Rentals {
			order.Rentals[i].OrderID = order.ID
			if err := tx.Create(&order.Rentals[i]).Error; err != nil {
				return err
			}
		}

		// 6. 更新团期已报名人数
		if err := tx.Model(&model.Schedule{}).
			Where("id = ?", schedule.ID).
			Updates(map[string]interface{}{
				"booked_slots": gorm.Expr("booked_slots + ?", totalPeople),
			}).Error; err != nil {
			return fmt.Errorf("更新名额失败: %w", err)
		}

		// 7. 检查是否已满，自动更新状态
		newBooked := schedule.BookedSlots + totalPeople
		if newBooked >= schedule.MaxSlots {
			if err := tx.Model(&model.Schedule{}).
				Where("id = ?", schedule.ID).
				Update("status", model.ScheduleStatusFull).Error; err != nil {
				return fmt.Errorf("更新团期状态失败: %w", err)
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

// CancelExpiredOrders 取消超时未支付的订单（含库存退还）
func (r *orderRepository) CancelExpiredOrders(expireDuration time.Duration) (int64, error) {
	deadline := time.Now().Add(-expireDuration)

	// 查找超时订单
	var expiredOrders []model.Order
	if err := r.db.
		Where("status = ? AND payment_status = ? AND created_at < ?",
			model.OrderStatusPending, model.PaymentStatusUnpaid, deadline).
		Find(&expiredOrders).Error; err != nil {
		return 0, err
	}

	var count int64
	for _, order := range expiredOrders {
		err := r.db.Transaction(func(tx *gorm.DB) error {
			// 更新订单状态
			if err := tx.Model(&model.Order{}).Where("id = ?", order.ID).
				Updates(map[string]interface{}{
					"status":        model.OrderStatusCancelled,
					"cancel_reason": "超时未支付，系统自动取消",
				}).Error; err != nil {
				return err
			}

			// 释放名额
			if err := tx.Model(&model.Schedule{}).Where("id = ?", order.ScheduleID).
				Update("booked_slots", gorm.Expr("booked_slots - ?", order.Adults+order.Children)).
				Error; err != nil {
				return err
			}

			// 退还租赁库存
			var rentals []model.OrderRental
			if err := tx.Where("order_id = ?", order.ID).Find(&rentals).Error; err == nil {
				for _, rental := range rentals {
					tx.Model(&model.RentalItem{}).Where("id = ?", rental.RentalItemID).
						Update("stock", gorm.Expr("stock + ?", rental.Quantity))
				}
			}

			// 退还余额
			if order.BalanceUsed > 0 {
				tx.Model(&model.User{}).Where("id = ?", order.UserID).
					Update("balance", gorm.Expr("balance + ?", order.BalanceUsed))
			}

			count++
			return nil
		})
		if err != nil {
			fmt.Printf("取消超时订单 %s 失败: %v\n", order.OrderNo, err)
		}
	}

	return count, nil
}

// --- 租赁项 Repository ---

type rentalItemRepository struct {
	db *gorm.DB
}

// RentalItemRepository 租赁项数据访问接口
type RentalItemRepository interface {
	FindAll() ([]model.RentalItem, error)
	FindByID(id uint64) (*model.RentalItem, error)
	RestoreStock(id uint64, quantity uint) error
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

// RestoreStock 退还库存
func (r *rentalItemRepository) RestoreStock(id uint64, quantity uint) error {
	return r.db.Model(&model.RentalItem{}).
		Where("id = ?", id).
		Update("stock", gorm.Expr("stock + ?", quantity)).Error
}
