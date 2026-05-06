# Task 0011 — 微信登录

## 用户故事
作为小程序用户，我需要通过微信一键登录，以便预约下单、查看订单。

## 验收标准
- [ ] AC-01: 小程序调用 `wx.login()` 获取 code，发送到后端
- [ ] AC-02: 后端 `/api/v1/auth/wx-login` 接收 code，调用微信 `code2session` API
- [ ] AC-03: 新用户自动创建（自动生成 invite_code），老用户直接返回
- [ ] AC-04: 签发 JWT token（有效期 7 天），返回 token + 用户信息
- [ ] AC-05: 小程序存储 token，后续请求自动携带 Authorization header
- [ ] AC-06: 手机号获取（微信 getPhoneNumber 组件 → 后端解密）
- [ ] AC-07: 用户信息更新接口（昵称、头像）

## 技术要点
- 需要微信小程序 appid + appsecret（配置到 config.yaml）
- JWT 需区分 user/admin 角色
- openid 是用户唯一标识，不可变
- unionid 可选（关联开放平台时需要）
- 手机号获取需要用户主动授权

## 依赖
- 无前置依赖
