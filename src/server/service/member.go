package service

import (
	"errors"
	"fmt"
	"time"

	"yule-go/model"
	"yule-go/repository"
)

type memberService struct {
	rechargeRepo repository.RechargeRepository
	userRepo     repository.UserRepository
}

// MemberService 会员业务逻辑接口
type MemberService interface {
	GetPlans() []model.RechargePlan
	GetMemberInfo(userID uint64) (*model.MemberInfoResponse, error)
	CreateRecharge(userID uint64, req *model.CreateRechargeRequest) (*model.CreateRechargeResponse, error)
	RechargeCallback(rechargeID uint64, transactionID string) error
	ListRecharges(userID uint64, page, pageSize int) ([]model.RechargeResponse, int64, error)
}

// NewMemberService 创建会员 Service
func NewMemberService(
	rechargeRepo repository.RechargeRepository,
	userRepo repository.UserRepository,
) MemberService {
	return &memberService{
		rechargeRepo: rechargeRepo,
		userRepo:     userRepo,
	}
}

// GetPlans 获取充值方案列表
func (s *memberService) GetPlans() []model.RechargePlan {
	return model.RechargePlans
}

// GetMemberInfo 获取会员信息
func (s *memberService) GetMemberInfo(userID uint64) (*model.MemberInfoResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("用户不存在")
	}

	levelText := "普通用户"
	switch user.MemberLevel {
	case 1:
		levelText = "银卡会员"
	case 2:
		levelText = "金卡会员"
	case 3:
		levelText = "钻石会员"
	}

	return &model.MemberInfoResponse{
		MemberLevel:   user.MemberLevel,
		LevelText:     levelText,
		Balance:       user.Balance,
		TotalRecharge: user.TotalRecharge,
		Discount:      user.MemberDiscount(),
		InviteCode:    user.InviteCode,
	}, nil
}

// CreateRecharge 创建充值订单
func (s *memberService) CreateRecharge(userID uint64, req *model.CreateRechargeRequest) (*model.CreateRechargeResponse, error) {
	// 1. 校验充值方案
	var plan *model.RechargePlan
	for _, p := range model.RechargePlans {
		if p.Amount == req.Plan {
			plan = &p
			break
		}
	}
	if plan == nil {
		return nil, errors.New("无效的充值方案")
	}

	// 2. 查询用户
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("用户不存在")
	}

	// 3. 创建充值记录
	recharge := &model.Recharge{
		UserID:        userID,
		Amount:        plan.Amount,
		GiftAmount:    plan.Gift,
		PaymentStatus: model.RechargeStatusUnpaid,
	}
	if err := s.rechargeRepo.Create(recharge); err != nil {
		return nil, fmt.Errorf("创建充值记录失败: %w", err)
	}

	// 4. 返回结果（含支付参数占位）
	resp := &model.CreateRechargeResponse{
		RechargeID: recharge.ID,
		Amount:     plan.Amount,
		LevelText:  plan.LevelText,
	}

	// TODO: 调用微信支付下单，返回支付参数
	// if plan.Amount > 0 { resp.PaymentParams = ... }

	return resp, nil
}

// RechargeCallback 充值支付回调
func (s *memberService) RechargeCallback(rechargeID uint64, transactionID string) error {
	recharge, err := s.rechargeRepo.FindByID(rechargeID)
	if err != nil {
		return errors.New("充值记录不存在")
	}

	if recharge.PaymentStatus == model.RechargeStatusPaid {
		return nil // 幂等处理
	}

	// 1. 更新充值记录状态
	recharge.PaymentStatus = model.RechargeStatusPaid
	recharge.WxTransactionID = transactionID
	if err := s.rechargeRepo.Update(recharge); err != nil {
		return fmt.Errorf("更新充值记录失败: %w", err)
	}

	// 2. 更新用户余额和等级
	user, err := s.userRepo.FindByID(recharge.UserID)
	if err != nil {
		return errors.New("用户不存在")
	}

	user.Balance += recharge.Amount + recharge.GiftAmount
	user.TotalRecharge += recharge.Amount

	// 升级会员等级（取最高等级）
	var planLevel uint8
	for _, p := range model.RechargePlans {
		if p.Amount == recharge.Amount {
			planLevel = p.Level
			break
		}
	}
	if planLevel > user.MemberLevel {
		user.MemberLevel = planLevel
	}

	if err := s.userRepo.Update(user); err != nil {
		return fmt.Errorf("更新用户信息失败: %w", err)
	}

	return nil
}

// ListRecharges 查询充值记录
func (s *memberService) ListRecharges(userID uint64, page, pageSize int) ([]model.RechargeResponse, int64, error) {
	recharges, total, err := s.rechargeRepo.ListByUser(userID, page, pageSize)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]model.RechargeResponse, len(recharges))
	for i, r := range recharges {
		statusText := "未支付"
		if r.PaymentStatus == model.RechargeStatusPaid {
			statusText = "已到账"
		}
		responses[i] = model.RechargeResponse{
			ID:            r.ID,
			Amount:        r.Amount,
			GiftAmount:    r.GiftAmount,
			PaymentStatus: uint8(r.PaymentStatus),
			StatusText:    statusText,
			CreatedAt:     r.CreatedAt.Format("2006-01-02 15:04"),
		}
	}

	return responses, total, nil
}

// GetTravelDiscount 获取旅行立减金额（按会员等级）
func GetTravelDiscount(level uint8) float64 {
	switch level {
	case 1:
		return 10
	case 2:
		return 20
	case 3:
		return 30
	default:
		return 0
	}
}

// GetMemberLevelText 获取会员等级文本
func GetMemberLevelText(level uint8) string {
	switch level {
	case 1:
		return "银卡会员"
	case 2:
		return "金卡会员"
	case 3:
		return "钻石会员"
	default:
		return "普通用户"
	}
}
