# TODO — 微信登录

- [ ] 1. 配置文件增加微信 appid/appsecret 字段
- [ ] 2. 创建 `pkg/wechat/client.go` — 微信 API 客户端（code2session）
- [ ] 3. 创建 `handler/user.go` — 用户 Handler（wx-login、get-phone、update-profile）
- [ ] 4. 创建 `service/user.go` — 用户 Service（登录逻辑、JWT 签发）
- [ ] 5. 创建 `repository/user.go` 补充（FindByOpenID、CreateIfNotExists）
- [ ] 6. 创建 `router/user.go` — 用户路由
- [ ] 7. 修改 `middleware/auth.go` — 支持 user/admin 双角色 JWT 校验
- [ ] 8. 小程序端：`api/auth.js` — 登录 API 封装
- [ ] 9. 小程序端：登录流程（wx.login → 存 token → 获取用户信息）
- [ ] 10. 小程序端：手机号获取组件
