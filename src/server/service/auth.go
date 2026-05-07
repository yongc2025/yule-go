package service

import (
	"errors"
	"fmt"
	"time"

	"yule-go/config"
	"yule-go/middleware"
	"yule-go/model"
	"yule-go/pkg/wechat"
	"yule-go/repository"

	"github.com/golang-jwt/jwt/v5"
)

type authService struct {
	userRepo repository.UserRepository
}

// AuthService 认证业务逻辑接口
type AuthService interface {
	WxLogin(code string) (*WxLoginResult, error)
}

// WxLoginResult 微信登录结果
type WxLoginResult struct {
	Token    string      `json:"token"`
	User     *model.User `json:"user"`
	IsNew    bool        `json:"is_new"`
}

// NewAuthService 创建认证 Service
func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

// WxLogin 微信登录：code 换 openid → 查找/创建用户 → 签发 JWT
func (s *authService) WxLogin(code string) (*WxLoginResult, error) {
	// 1. 调用微信 code2session 接口
	wxResp, err := wechat.Code2Session(
		config.C.Wechat.AppID,
		config.C.Wechat.AppSecret,
		code,
	)
	if err != nil {
		return nil, fmt.Errorf("微信登录失败: %w", err)
	}

	// 2. 查找已有用户
	user, err := s.userRepo.FindByOpenID(wxResp.OpenID)
	if err != nil {
		// 新用户 → 自动创建
		user, err = s.createUser(wxResp.OpenID, wxResp.UnionID)
		if err != nil {
			return nil, fmt.Errorf("创建用户失败: %w", err)
		}

		// 3. 签发 JWT
		token, err := s.generateToken(user)
		if err != nil {
			return nil, fmt.Errorf("生成 token 失败: %w", err)
		}

		return &WxLoginResult{
			Token: token,
			User:  user,
			IsNew: true,
		}, nil
	}

	// 老用户 → 更新 last_login_at
	now := time.Now()
	user.LastLoginAt = &now
	if err := s.userRepo.Update(user); err != nil {
		// 更新失败不阻塞登录，仅记录
		fmt.Printf("⚠️ 更新用户 last_login_at 失败: %v\n", err)
	}

	// 3. 签发 JWT
	token, err := s.generateToken(user)
	if err != nil {
		return nil, fmt.Errorf("生成 token 失败: %w", err)
	}

	return &WxLoginResult{
		Token: token,
		User:  user,
		IsNew: false,
	}, nil
}

// createUser 创建新用户（自动生成唯一邀请码）
func (s *authService) createUser(openID, unionID string) (*model.User, error) {
	inviteCode, err := GenerateUniqueInviteCode(s.userRepo)
	if err != nil {
		return nil, fmt.Errorf("生成邀请码失败: %w", err)
	}

	now := time.Now()
	user := &model.User{
		OpenID:      openID,
		UnionID:     unionID,
		Nickname:    "用户", // 默认昵称，后续可通过微信授权更新
		InviteCode:  inviteCode,
		LastLoginAt: &now,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, fmt.Errorf("创建用户记录失败: %w", err)
	}

	return user, nil
}

// generateToken 签发 JWT（user_id + openid，有效期 30 天）
func (s *authService) generateToken(user *model.User) (string, error) {
	if config.C.JWT.Secret == "" {
		return "", errors.New("JWT_SECRET 未配置")
	}

	claims := &middleware.Claims{
		UserID:   user.ID,
		OpenID:   user.OpenID,
		Nickname: user.Nickname,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "yule-go",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(config.C.JWT.Secret))
	if err != nil {
		return "", fmt.Errorf("签名 token 失败: %w", err)
	}

	return tokenStr, nil
}
