package wechat

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

const code2SessionURL = "https://api.weixin.qq.com/sns/jscode2session"

// Code2SessionResponse 微信 code2session 接口响应
type Code2SessionResponse struct {
	OpenID     string `json:"openid"`
	SessionKey string `json:"session_key"`
	UnionID    string `json:"unionid"`
	ErrCode    int    `json:"errcode"`
	ErrMsg     string `json:"errmsg"`
}

// Code2Session 调用微信接口，用 code 换取 openid + session_key
func Code2Session(appID, appSecret, code string) (*Code2SessionResponse, error) {
	if appID == "" || appSecret == "" {
		return nil, errors.New("微信 appid 或 appsecret 未配置")
	}
	if code == "" {
		return nil, errors.New("微信登录 code 不能为空")
	}

	params := url.Values{}
	params.Set("appid", appID)
	params.Set("secret", appSecret)
	params.Set("js_code", code)
	params.Set("grant_type", "authorization_code")

	reqURL := fmt.Sprintf("%s?%s", code2SessionURL, params.Encode())

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(reqURL)
	if err != nil {
		return nil, fmt.Errorf("请求微信接口失败: %w", err)
	}
	defer resp.Body.Close()

	var result Code2SessionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("解析微信响应失败: %w", err)
	}

	if result.ErrCode != 0 {
		return nil, fmt.Errorf("微信接口错误 [%d]: %s", result.ErrCode, result.ErrMsg)
	}

	if result.OpenID == "" {
		return nil, errors.New("微信返回的 openid 为空")
	}

	return &result, nil
}
