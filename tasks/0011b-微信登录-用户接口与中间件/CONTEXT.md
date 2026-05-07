# Task 0011b — 微信登录：用户接口与中间件

## 用户故事
系统需要认证中间件保护私有接口，用户需要查看和编辑个人信息。

## 验收标准
- [ ] AC-01: 中间件校验 JWT，解析 user_id 注入 gin.Context
- [ ] AC-02: `GET /api/v1/user/profile` 返回用户信息（昵称、头像、手机号、会员等级、余额）
- [ ] AC-03: `PUT /api/v1/user/profile` 更新用户信息（昵称、头像）
- [ ] AC-04: 手机号获取接口（wx.getPhoneNumber 解密或新版 API）

## 依赖：0011a

## 技术要点
- 修改现有 `middleware/auth.go`，实现真正的 JWT 校验
- 创建 handler/user.go + router/user.go
