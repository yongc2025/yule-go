package repository

import (
	"yule-go/db"
	"yule-go/model"

	"gorm.io/gorm"
)

type userRepository struct {
	db *gorm.DB
}

// UserRepository 用户数据访问接口
type UserRepository interface {
	FindByID(id uint64) (*model.User, error)
	FindByOpenID(openid string) (*model.User, error)
	Create(user *model.User) error
	Update(user *model.User) error
}

// NewUserRepository 创建用户 Repository
func NewUserRepository() UserRepository {
	return &userRepository{db: db.DB}
}

// FindByID 根据 ID 查询用户
func (r *userRepository) FindByID(id uint64) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByOpenID 根据 OpenID 查询用户
func (r *userRepository) FindByOpenID(openid string) (*model.User, error) {
	var user model.User
	err := r.db.Where("openid = ?", openid).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Create 创建用户
func (r *userRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

// Update 更新用户
func (r *userRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}
