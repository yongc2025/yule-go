package model

import "time"

// Admin 管理员模型
type Admin struct {
	ID                  uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	Username            string    `json:"username" gorm:"size:64;not null;uniqueIndex"`
	PasswordHash        string    `json:"-" gorm:"size:255;not null"`
	MustChangePassword  bool      `json:"must_change_password" gorm:"default:1"`
	Role                string    `json:"role" gorm:"size:20;default:admin"`
	Status              uint8     `json:"status" gorm:"default:1"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// TableName 指定表名
func (Admin) TableName() string {
	return "admins"
}
