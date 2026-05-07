# TODO — 微信登录后端核心

- [x] 1. config.go 新增 WechatMini 配置（已有 WechatConfig，无需修改）
- [x] 2. 创建 pkg/wechat/mini.go — Code2Session
- [x] 3. 创建 service/auth.go — WxLogin
- [x] 4. 创建 handler/auth.go — POST /api/v1/auth/wx-login
- [x] 5. 创建 router/auth.go
- [x] 6. 修改 main.go 注册认证路由
- [ ] 7. curl 验证登录接口（需 Go 环境 + 微信 code）
