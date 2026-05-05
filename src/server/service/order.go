package service

import (
	"errors"
	"fmt"
	"time"

	"yule-go/model"
	"yule-go/repository"

	"gorm.io/gorm"
)

type orderService struct {
	orderRepo   repository.OrderRepository
	scheduleRepo repository.ScheduleRepository
	rentalRepo  repository.RentalItemRepository
	userRepo    repository.UserRepository
}

// OrderService 订单业务逻辑接口
type OrderService interface {
	Create(userID uint64, req *model.CreateOrderRequest) (*model.CreateOrderResponse, error)
	GetByOrderNo(orderNo string) (*model.OrderResponse, error)
	ListByUser(userID uint64, query *model.OrderQueryRequest) ([]model.OrderResponse, int64, error)
	Cancel(orderNo string, userID uint64, reason string) error
	PaymentCallback(orderNo string, transactionID string) error
	CancelExpiredOrders() (int64, error)
}

// NewOrderService 创建订单 Service
func NewOrderService(
	orderRepo repository.OrderRepository,
	scheduleRepo repository.ScheduleRepository,
	rentalRepo repository.RentalItemRepository,
	userRepo repository.UserRepository,
) OrderService {
	return &orderService{
		orderRepo:    orderRepo,
		scheduleRepo: scheduleRepo,
		rentalRepo:   rentalRepo,
		userRepo:     userRepo,
	}
}

// Create 创建订单
func (s *orderService) Create(userID uint64, req *model.CreateOrderRequest) (*model.CreateOrderResponse, error) {
	// 1. 查询团期
	schedule, err := s.scheduleRepo.FindByID(req.ScheduleID)
	if err != nil {
		return nil, errors.New("团期不存在")
	}

	// 2. 校验团期状态
	if schedule.Status != model.ScheduleStatusEnrolling {
		return nil, errors.New("该团期不可报名")
	}

	// 3. 校验名额
	totalPeople := req.Adults + req.Children
	remaining := schedule.RemainingSlots()
	if int(totalPeople) > remaining {
		return nil, fmt.Errorf("名额不足，剩余 %d 位", remaining)
	}

	// 4. 校验重复下单
	existing, _ := s.orderRepo.FindByUserAndSchedule(userID, req.ScheduleID)
	if existing != nil {
		return nil, errors.New("您已报名该团期，请勿重复下单")
	}

	// 5. 查询用户
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("用户不存在")
	}

	// 6. 计算团费
	route := schedule.Route
	tripFee := float64(req.Adults)*route.Price
	if req.Children > 0 {
		childPrice := route.ChildPrice
		if childPrice <= 0 || route.Type != "family" {
			childPrice = route.Price // 非亲子团，儿童按成人计
		}
		tripFee += float64(req.Children) * childPrice
	}

	// 7. 计算租赁费
	var rentalFee float64
	var rentals []model.OrderRental
	for _, ri := range req.RentalItems {
		item, err := s.rentalRepo.FindByID(ri.RentalItemID)
		if err != nil {
			return nil, fmt.Errorf("租赁项 %d 不存在", ri.RentalItemID)
		}
		if item.Stock < ri.Quantity {
			return nil, fmt.Errorf("「%s」库存不足，剩余 %d", item.Name, item.Stock)
		}
		subtotal := item.PricePerDay * float64(ri.Quantity)
		rentalFee += subtotal
		rentals = append(rentals, model.OrderRental{
			RentalItemID: ri.RentalItemID,
			Quantity:     ri.Quantity,
			UnitPrice:    item.PricePerDay,
			Subtotal:     subtotal,
		})
	}

	// 8. 计算折扣和余额
	subtotal := tripFee + rentalFee
	var discountAmount float64
	if user.MemberLevel > 0 {
		discount := user.MemberDiscount()
		discountAmount = subtotal * (1 - discount)
	}

	var balanceUsed float64
	if req.UseBalance && user.Balance > 0 {
		afterDiscount := subtotal - discountAmount
		if user.Balance >= afterDiscount {
			balanceUsed = afterDiscount
		} else {
			balanceUsed = user.Balance
		}
	}

	totalAmount := subtotal - discountAmount - balanceUsed
	if totalAmount < 0 {
		totalAmount = 0
	}

	// 9. 生成订单号
	orderNo := generateOrderNo()

	// 10. 创建订单
	order := &model.Order{
		OrderNo:        orderNo,
		UserID:         userID,
		ScheduleID:     req.ScheduleID,
		Adults:         req.Adults,
		Children:       req.Children,
		TripFee:        tripFee,
		RentalFee:      rentalFee,
		DiscountAmount: discountAmount,
		BalanceUsed:    balanceUsed,
		TotalAmount:    totalAmount,
		ContactName:    req.ContactName,
		ContactPhone:   req.ContactPhone,
		PaymentStatus:  model.PaymentStatusUnpaid,
		Status:         model.OrderStatusPending,
		Remark:         req.Remark,
		Rentals:        rentals,
	}

	if err := s.orderRepo.Create(order); err != nil {
		return nil, fmt.Errorf("创建订单失败: %w", err)
	}

	// 11. 更新团期已报名人数
	schedule.BookedSlots += totalPeople
	if schedule.BookedSlots >= schedule.MaxSlots {
		schedule.Status = model.ScheduleStatusFull
	}
	if err := s.scheduleRepo.Update(schedule); err != nil {
		// 日志记录，但不影响订单创建
		fmt.Printf("更新团期名额失败: %v\n", err)
	}

	// 12. 扣减余额
	if balanceUsed > 0 {
		user.Balance -= balanceUsed
		if err := s.userRepo.Update(user); err != nil {
			fmt.Printf("扣减余额失败: %v\n", err)
		}
	}

	// 13. 返回结果（含支付参数占位）
	resp := &model.CreateOrderResponse{
		OrderID:        order.ID,
		OrderNo:        orderNo,
		TripFee:        tripFee,
		RentalFee:      rentalFee,
		DiscountAmount: discountAmount,
		BalanceUsed:    balanceUsed,
		TotalAmount:    totalAmount,
	}

	// TODO: 如果 totalAmount > 0，调用微信支付下单，返回支付参数
	// if totalAmount > 0 { resp.PaymentParams = ... }

	return resp, nil
}

// GetByOrderNo 查询订单详情
func (s *orderService) GetByOrderNo(orderNo string) (*model.OrderResponse, error) {
	order, err := s.orderRepo.FindByOrderNo(orderNo)
	if err != nil {
		return nil, errors.New("订单不存在")
	}
	resp := order.ToResponse()
	return &resp, nil
}

// ListByUser 查询用户订单列表
func (s *orderService) ListByUser(userID uint64, query *model.OrderQueryRequest) ([]model.OrderResponse, int64, error) {
	orders, total, err := s.orderRepo.ListByUser(userID, query)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.OrderResponse, len(orders))
	for i, order := range orders {
		responses[i] = order.ToResponse()
	}
	return responses, total, nil
}

// Cancel 取消订单
func (s *orderService) Cancel(orderNo string, userID uint64, reason string) error {
	order, err := s.orderRepo.FindByOrderNo(orderNo)
	if err != nil {
		return errors.New("订单不存在")
	}

	if order.UserID != userID {
		return errors.New("无权操作此订单")
	}

	if order.Status != model.OrderStatusPending {
		return errors.New("当前状态不允许取消")
	}

	// 释放名额
	schedule, err := s.scheduleRepo.FindByID(order.ScheduleID)
	if err == nil {
		totalPeople := order.Adults + order.Children
		schedule.BookedSlots -= totalPeople
		if schedule.BookedSlots < schedule.MaxSlots && schedule.Status == model.ScheduleStatusFull {
			schedule.Status = model.ScheduleStatusEnrolling
		}
		scheduleRepoErr := s.scheduleRepo.Update(schedule)
		if scheduleRepoErr != nil {
			fmt.Printf("释放名额失败: %v\n", scheduleRepoErr)
		}
	}

	// 退还余额
	if order.BalanceUsed > 0 {
		user, err := s.userRepo.FindByID(userID)
		if err == nil {
			user.Balance += order.BalanceUsed
			if err := s.userRepo.Update(user); err != nil {
				fmt.Printf("退还余额失败: %v\n", err)
			}
		}
	}

	// 更新订单状态
	order.Status = model.OrderStatusCancelled
	order.CancelReason = reason
	return s.orderRepo.Update(order)
}

// PaymentCallback 微信支付回调
func (s *orderService) PaymentCallback(orderNo string, transactionID string) error {
	order, err := s.orderRepo.FindByOrderNo(orderNo)
	if err != nil {
		return errors.New("订单不存在")
	}

	if order.PaymentStatus == model.PaymentStatusPaid {
		return nil // 幂等处理
	}

	now := time.Now()
	order.PaymentStatus = model.PaymentStatusPaid
	order.PaymentTime = &now
	order.WxTransactionID = transactionID
	order.Status = model.OrderStatusConfirmed

	return s.orderRepo.Update(order)
}

// CancelExpiredOrders 取消超时订单
func (s *orderService) CancelExpiredOrders() (int64, error) {
	return s.orderRepo.CancelExpiredOrders(15 * time.Minute)
}

// generateOrderNo 生成订单号：日期 + 6位随机
func generateOrderNo() string {
	now := time.Now()
	return now.Format("20060102150405") + fmt.Sprintf("%06d", now.UnixNano()%1000000)
}
