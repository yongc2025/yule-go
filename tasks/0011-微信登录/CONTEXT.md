# Task 0011 — 微信登录

## 用户故事
作为小程序用户，我需要通过微信一键登录，获取身份令牌，才能预约下单、查看订单、使用会员权益。

## 验收标准
- [ ] AC-01: 小程序调用 `wx.login()` 获取 code，后端调用微信 `code2session` 接口换取 openid + session_key
- [ ] AC-02: 新用户自动创建 users 记录（openid、自动生成 invite_code）
- [ ] AC-03: 老用户直接返回，更新最后登录时间
- [ ] AC-04: 后端签发 JWT（包含 user_id + openid），有效期 30 天
- [ ] AC-05: 小程序端存储 token，后续请求通过 `Authorization: Bearer <token>` 传递
- [ ] AC-06: 用户认证中间件校验 JWT，解析 user_id 注入上下文
- [ ] AC-07: `GET /api/v1/user/profile` 返回用户信息（昵称、头像、手机号、会员等级、余额）
- [ ] AC-08: `PUT /api/v1/user/profile` 更新用户信息（昵称、头像）
- [ ] AC-09: 手机号获取（`wx.getPhoneNumber` + 解密 iv/encryptedData 或使用 getPhoneNumber API）

## 依赖：无（是最上游任务）

## 技术要点
- 微信登录凭证校验接口：`https://api.weixin.qq.com/sns/jscode2session`
- JWT 使用项目已有的 `golang-jwt/jwt/v5`
- 手机号获取需后端用 session_key 解密，或使用微信新版 getPhoneNumber API（推荐）
- users 表已有 openid UNIQUE 索引和 invite_code UNIQUE 索引
- 邀请码生成使用已有的 `service/referral.go` 中的 `GenerateUniqueInviteCode`

## 需求来源
- `memory-bank/requirements.md` — 第六章 6.1 微信登录、第十章 10.1 用户认证
