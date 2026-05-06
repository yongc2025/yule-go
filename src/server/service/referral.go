package service

import (
	"errors"
	"fmt"
	"math/rand"
	"time"

	"yule-go/model"
	"yule-go/pkg/util"
	"yule-go/repository"
)

type referralService struct {
	referralRepo repository.ReferralRepository
	userRepo     repository.UserRepository
}

// ReferralService 裂变业务逻辑接口
type ReferralService interface {
	GetInviteInfo(userID uint64) (*model.ReferralInfoResponse, error)
	BindInvite(inviteeID uint64, inviteCode string) error
	CheckFirstOrderDiscount(userID uint64) float64
	GrantReward(inviteeID uint64, orderID uint64) error
}

// NewReferralService 创建裂变 Service
func NewReferralService(
	referralRepo repository.ReferralRepository,
	userRepo repository.UserRepository,
) ReferralService {
	return &referralService{
		referralRepo: referralRepo,
		userRepo:     userRepo,
	}
}

// GetInviteInfo 获取邀请信息
func (s *referralService) GetInviteInfo(userID uint64) (*model.ReferralInfoResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("用户不存在")
	}

	referrals, _ := s.referralRepo.ListByInviterID(userID)
	totalInvited, _ := s.referralRepo.CountByInviterID(userID)
	totalReward, _ := s.referralRepo.SumRewardByInviterID(userID)

	invitedList := make([]model.ReferralItemResp, len(referrals))
	for i, r := range referrals {
		statusText := "待触发"
		if r.Status == model.ReferralStatusRewarded {
			statusText = "已奖励"
		} else if r.Status == model.ReferralStatusExpired {
			statusText = "已失效"
		}

		nickname := "用户"
		avatar := ""
		if r.Invitee.ID > 0 {
			nickname = r.Invitee.Nickname
			avatar = r.Invitee.Avatar
		}

		invitedList[i] = model.ReferralItemResp{
			Nickname:     nickname,
			Avatar:       avatar,
			RewardAmount: r.RewardAmount,
			Status:       uint8(r.Status),
			StatusText:   statusText,
			CreatedAt:    r.CreatedAt.Format("2006-01-02"),
		}
	}

	return &model.ReferralInfoResponse{
		InviteCode:   user.InviteCode,
		InviteURL:    fmt.Sprintf("pages/schedule/index?invite=%s", user.InviteCode),
		TotalInvited: totalInvited,
		TotalReward:  totalReward,
		InvitedList:  invitedList,
	}, nil
}

// BindInvite 绑定邀请关系
func (s *referralService) BindInvite(inviteeID uint64, inviteCode string) error {
	// 1. 校验邀请码
	inviter, err := s.userRepo.FindByInviteCode(inviteCode)
	if err != nil {
		return errors.New("邀请码无效")
	}

	// 2. 不能自己邀请自己
	if inviter.ID == inviteeID {
		return errors.New("不能使用自己的邀请码")
	}

	// 3. 检查是否已被邀请
	existing, _ := s.referralRepo.FindByInviteeID(inviteeID)
	if existing != nil {
		return errors.New("您已被邀请过")
	}

	// 4. 更新用户的 invited_by
	invitee, err := s.userRepo.FindByID(inviteeID)
	if err != nil {
		return errors.New("用户不存在")
	}
	invitee.InvitedBy = &inviter.ID
	if err := s.userRepo.Update(invitee); err != nil {
		return fmt.Errorf("更新邀请关系失败: %w", err)
	}

	// 5. 创建裂变记录
	referral := &model.Referral{
		InviterID:       inviter.ID,
		InviteeID:       inviteeID,
		RewardAmount:    20,
		NewUserDiscount: 15,
		Status:          model.ReferralStatusPending,
	}
	if err := s.referralRepo.Create(referral); err != nil {
		return fmt.Errorf("创建裂变记录失败: %w", err)
	}

	return nil
}

// CheckFirstOrderDiscount 检查首单立减
func (s *referralService) CheckFirstOrderDiscount(userID uint64) float64 {
	// 查看该用户是否有待触发的邀请记录
	referral, err := s.referralRepo.FindByInviteeID(userID)
	if err != nil || referral.Status != model.ReferralStatusPending {
		return 0
	}
	return referral.NewUserDiscount
}

// GrantReward 发放邀请奖励
func (s *referralService) GrantReward(inviteeID uint64, orderID uint64) error {
	referral, err := s.referralRepo.FindByInviteeID(inviteeID)
	if err != nil || referral.Status != model.ReferralStatusPending {
		return nil // 无邀请记录或已处理，跳过
	}

	// 1. 更新裂变记录状态
	referral.Status = model.ReferralStatusRewarded
	referral.InviteeOrderID = &orderID
	if err := s.referralRepo.Update(referral); err != nil {
		return fmt.Errorf("更新裂变记录失败: %w", err)
	}

	// 2. 给邀请人发放奖励（增加余额）
	inviter, err := s.userRepo.FindByID(referral.InviterID)
	if err != nil {
		return errors.New("邀请人不存在")
	}
	inviter.Balance += referral.RewardAmount
	inviter.Balance = util.RoundToCent(inviter.Balance)
	if err := s.userRepo.Update(inviter); err != nil {
		return fmt.Errorf("发放奖励失败: %w", err)
	}

	return nil
}

// GenerateInviteCode 生成 6 位邀请码（不校验唯一性，仅供内部使用）
func generateInviteCodeRaw() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	code := make([]byte, 6)
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := range code {
		code[i] = chars[r.Intn(len(chars))]
	}
	return string(code)
}

// GenerateUniqueInviteCode 生成唯一邀请码（查询数据库确认唯一，冲突自动重试，最多 3 次）
func GenerateUniqueInviteCode(userRepo repository.UserRepository) (string, error) {
	const maxRetries = 3
	for i := 0; i < maxRetries; i++ {
		code := generateInviteCodeRaw()
		existing, err := userRepo.FindByInviteCode(code)
		if err != nil {
			// 查询失败（非"未找到"错误）→ 返回错误
			if existing == nil {
				// 未找到记录 = 唯一，可用
				return code, nil
			}
			return "", fmt.Errorf("校验邀请码唯一性失败: %w", err)
		}
		// 找到了记录，说明冲突，继续重试
	}
	return "", errors.New("生成唯一邀请码失败：连续 3 次冲突")
}
