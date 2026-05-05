package repository

import (
	"yule-go/db"
	"yule-go/model"

	"gorm.io/gorm"
)

type referralRepository struct {
	db *gorm.DB
}

// ReferralRepository 裂变记录数据访问接口
type ReferralRepository interface {
	Create(referral *model.Referral) error
	FindByInviteeID(inviteeID uint64) (*model.Referral, error)
	ListByInviterID(inviterID uint64) ([]model.Referral, error)
	CountByInviterID(inviterID uint64) (int, error)
	SumRewardByInviterID(inviterID uint64) (float64, error)
	Update(referral *model.Referral) error
}

// NewReferralRepository 创建裂变记录 Repository
func NewReferralRepository() ReferralRepository {
	return &referralRepository{db: db.DB}
}

// Create 创建裂变记录
func (r *referralRepository) Create(referral *model.Referral) error {
	return r.db.Create(referral).Error
}

// FindByInviteeID 根据被邀请人查询
func (r *referralRepository) FindByInviteeID(inviteeID uint64) (*model.Referral, error) {
	var referral model.Referral
	err := r.db.Where("invitee_id = ?", inviteeID).First(&referral).Error
	if err != nil {
		return nil, err
	}
	return &referral, nil
}

// ListByInviterID 查询邀请人的邀请列表
func (r *referralRepository) ListByInviterID(inviterID uint64) ([]model.Referral, error) {
	var referrals []model.Referral
	err := r.db.Preload("Invitee").
		Where("inviter_id = ?", inviterID).
		Order("created_at DESC").
		Find(&referrals).Error
	return referrals, err
}

// CountByInviterID 统计邀请人数
func (r *referralRepository) CountByInviterID(inviterID uint64) (int, error) {
	var count int64
	err := r.db.Model(&model.Referral{}).Where("inviter_id = ?", inviterID).Count(&count).Error
	return int(count), err
}

// SumRewardByInviterID 统计累计奖励
func (r *referralRepository) SumRewardByInviterID(inviterID uint64) (float64, error) {
	var sum float64
	err := r.db.Model(&model.Referral{}).
		Where("inviter_id = ? AND status = ?", inviterID, model.ReferralStatusRewarded).
		Select("COALESCE(SUM(reward_amount), 0)").
		Scan(&sum).Error
	return sum, err
}

// Update 更新裂变记录
func (r *referralRepository) Update(referral *model.Referral) error {
	return r.db.Save(referral).Error
}
