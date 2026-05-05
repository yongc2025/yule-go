package config

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/spf13/viper"
)

// Config 全局配置结构
type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Redis    RedisConfig    `mapstructure:"redis"`
	JWT      JWTConfig      `mapstructure:"jwt"`
	Wechat   WechatConfig   `mapstructure:"wechat"`
}

type ServerConfig struct {
	Port string `mapstructure:"port"`
	Mode string `mapstructure:"mode"`
}

type DatabaseConfig struct {
	Host         string `mapstructure:"host"`
	Port         int    `mapstructure:"port"`
	User         string `mapstructure:"user"`
	Password     string `mapstructure:"password"`
	DBName       string `mapstructure:"dbname"`
	Charset      string `mapstructure:"charset"`
	MaxIdleConns int    `mapstructure:"max_idle_conns"`
	MaxOpenConns int    `mapstructure:"max_open_conns"`
}

func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local",
		d.User, d.Password, d.Host, d.Port, d.DBName, d.Charset)
}

type RedisConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

func (r RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%d", r.Host, r.Port)
}

type JWTConfig struct {
	Secret      string `mapstructure:"secret"`
	ExpireHours int    `mapstructure:"expire_hours"`
}

type WechatConfig struct {
	AppID     string `mapstructure:"app_id"`
	AppSecret string `mapstructure:"app_secret"`
	MchID     string `mapstructure:"mch_id"`
	MchKey    string `mapstructure:"mch_key"`
	NotifyURL string `mapstructure:"notify_url"`
}

var C Config

// Load 加载配置（环境变量优先）
func Load() {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./config")
	viper.AddConfigPath(".")

	// 环境变量覆盖：YULE_DATABASE_HOST → database.host
	viper.SetEnvPrefix("YULE")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("⚠️  配置文件未找到，使用默认值: %v", err)
	}

	if err := viper.Unmarshal(&C); err != nil {
		log.Fatalf("❌ 配置解析失败: %v", err)
	}

	// 环境变量直接覆盖（高优先级）
	if host := os.Getenv("DB_HOST"); host != "" {
		C.Database.Host = host
	}
	if pwd := os.Getenv("DB_PASSWORD"); pwd != "" {
		C.Database.Password = pwd
	}
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		C.JWT.Secret = secret
	}

	log.Printf("✅ 配置加载完成: server=:%s, db=%s:%d/%s",
		C.Server.Port, C.Database.Host, C.Database.Port, C.Database.DBName)
}
