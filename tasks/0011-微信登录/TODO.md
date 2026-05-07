# TODO — 微信登录

## 后端
- [ ] 1. 配置：config.go 新增 wechat mini appid/appsecret
- [ ] 2. 创建 pkg/wechat/mini.go — code2session + 手机号解密
- [ ] 3. 创建 service/auth.go — Login（查找/创建用户 + JWT 签发）
- [ ] 4. 创建 handler/auth.go — POST /api/v1/auth/wx-login
- [ ] 5. 创建 handler/user.go — GET/PUT /api/v1/user/profile
- [ ] 6. 修改 middleware/auth.go — JWT 校验 + user_id 注入
- [ ] 7. 创建 router/auth.go + router/user.go
- [ ] 8. 修改 main.go — 注册新路由
- [ ] 9. 数据库迁移（如需）— users 表确认 openid/invite_code 索引

## 小程序端
- [ ] 10. 创建 api/auth.js — wx-login API
- [ ] 11. 创建 utils/auth.js — token 管理
- [ ] 12. 修改 App.vue — onLaunch 自动登录
- [ ] 13. 创建 pages/user/profile.vue — 个人信息

## 验证
- [ ] 14. 端到端测试：登录 → 获取 token → 调用受保护 API
