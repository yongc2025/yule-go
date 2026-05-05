package db

import (
	"fmt"
	"log"

	"yule-go/config"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Init 初始化数据库连接
func Init() {
	dsn := config.C.Database.DSN()
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("❌ 数据库连接失败: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("❌ 获取数据库实例失败: %v", err)
	}

	sqlDB.SetMaxIdleConns(config.C.Database.MaxIdleConns)
	sqlDB.SetMaxOpenConns(config.C.Database.MaxOpenConns)

	DB = db
	fmt.Println("✅ 数据库连接成功")
}
