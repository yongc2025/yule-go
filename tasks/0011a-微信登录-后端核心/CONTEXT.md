# Task 0011a — 微信登录：后端核心

## 用户故事
作为小程序用户，我需要通过微信 code 换取身份令牌，系统自动创建或识别我的账号。

## 验收标准
- [ ] AC-01: 创建 `pkg/wechat/mini.go`，实现 `Code2Session(appid, secret, code)` 调用微信接口换取 openid + session_key
- [ ] AC-02: 新用户自动创建 users 记录（openid、自动生成 invite_code）
- [ ] AC-03: 老用户直接返回，更新 last_login_at
- [ ] AC-04: 签发 JWT（包含 user_id + openid），有效期 30 天

## 依赖：无

## 技术要点
- 微信接口：`https://api.weixin.qq.com/sns/jscode2session`
- JWT 使用 `golang-jwt/jwt/v5`
- 邀请码使用已有的 `service/referral.go` 中的 `GenerateUniqueInviteCode`
- users 表已有 openid UNIQUE 索引
