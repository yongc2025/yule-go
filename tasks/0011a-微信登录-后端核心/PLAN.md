# PLAN — 微信登录后端核心

## Step 1: 配置
- config/config.go 新增 WechatMini 配置（appid, appsecret）

## Step 2: 微信 SDK
- 创建 `pkg/wechat/mini.go` — Code2Session 函数

## Step 3: 认证 Service + Handler
- 创建 `service/auth.go` — WxLogin（查找/创建用户 + JWT 签发）
- 创建 `handler/auth.go` — POST /api/v1/auth/wx-login
- 创建 `router/auth.go`
- 修改 `main.go` 注册路由

## Step 4: 验证
- curl 测试登录接口
