package repository

import (
	"yule-go/db"
	"yule-go/model"

	"gorm.io/gorm"
)

type rechargeRepository struct {
	db *gorm.DB
}

// RechargeRepository 充值记录数据访问接口
type RechargeRepository interface {
	Create(recharge *model.Recharge) error
	FindByID(id uint64) (*model.Recharge, error)
	ListByUser(userID uint64, page, pageSize int) ([]model.Recharge, int64, error)
	Update(recharge *model.Recharge) error
}

// NewRechargeRepository 创建充值记录 Repository
func NewRechargeRepository() RechargeRepository {
	return &rechargeRepository{db: db.DB}
}

// Create 创建充值记录
func (r *rechargeRepository) Create(recharge *model.Recharge) error {
	return r.db.Create(recharge).Error
}

// FindByID 根据 ID 查询充值记录
func (r *rechargeRepository) FindByID(id uint64) (*model.Recharge, error) {
	var recharge model.Recharge
	err := r.db.First(&recharge, id).Error
	if err != nil {
		return nil, err
	}
	return &recharge, nil
}

// ListByUser 查询用户充值记录
func (r *rechargeRepository) ListByUser(userID uint64, page, pageSize int) ([]model.Recharge, int64, error) {
	var recharges []model.Recharge
	var total int64

	tx := r.db.Model(&model.Recharge{}).Where("user_id = ?", userID)

	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	err := tx.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&recharges).Error
	if err != nil {
		return nil, 0, err
	}

	return recharges, total, nil
}

// Update 更新充值记录
func (r *rechargeRepository) Update(recharge *model.Recharge) error {
	return r.db.Save(recharge).Error
}
