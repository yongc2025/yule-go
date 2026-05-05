package middleware

import (
	"strings"

	"yule-go/config"
	"yule-go/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Claims JWT 声明
type Claims struct {
	UserID   uint64 `json:"user_id"`
	OpenID   string `json:"openid"`
	Nickname string `json:"nickname"`
	jwt.RegisteredClaims
}

// JWTAuth JWT 认证中间件
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		// 提取 Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		tokenStr := parts[1]
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(config.C.JWT.Secret), nil
		})

		if err != nil || !token.Valid {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		// 将用户信息存入上下文
		c.Set("user_id", claims.UserID)
		c.Set("openid", claims.OpenID)
		c.Set("nickname", claims.Nickname)

		c.Next()
	}
}

// AdminAuth 管理员认证中间件（占位，后续实现）
func AdminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: 实现管理员认证
		c.Next()
	}
}
