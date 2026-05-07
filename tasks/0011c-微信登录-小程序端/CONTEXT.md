# Task 0011c — 微信登录：小程序端

## 用户故事
用户打开小程序自动登录，无需手动操作即可获得身份。

## 验收标准
- [ ] AC-01: App.vue onLaunch 自动调用 wx.login → 后端换取 token
- [ ] AC-02: token 存储到本地，后续请求自动注入 Authorization header
- [ ] AC-03: 创建 pages/user/profile.vue 个人信息页
- [ ] AC-04: token 过期时自动重新登录

## 依赖：0011a, 0011b

## 技术要点
- uni.setStorageSync / getStorageSync 存储 token
- 请求拦截器统一注入 header
