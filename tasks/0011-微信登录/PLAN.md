# PLAN — 微信登录

## Phase 1：后端核心（~1 天）

### Step 1.1 微信登录 API
- 创建 `pkg/wechat/mini.go` — 小程序 SDK（code2session、手机号解密）
- 创建 `service/auth.go` — 登录逻辑（查找/创建用户、签发 JWT）
- 创建 `handler/auth.go` — 登录接口 handler
- 创建 `router/auth.go` — 认证路由
- 修改 `config/config.go` — 新增 wechat mini appid/appsecret 配置
- 修改 `main.go` — 注册认证路由

### Step 1.2 用户接口
- 创建 `handler/user.go` — 用户信息接口（profile GET/PUT）
- 创建 `router/user.go` — 用户路由
- 修改 `middleware/auth.go` — 实现真正的 JWT 校验 + user_id 注入

## Phase 2：小程序端（~0.5 天）

### Step 2.1 登录流程
- 创建 `api/auth.js` — 登录 API
- 修改 `App.vue` — onLaunch 自动登录
- 创建 `utils/auth.js` — token 管理（存储/获取/清除）

### Step 2.2 用户中心
- 创建 `pages/user/profile.vue` — 个人信息页
- 修改已有页面 — 注入用户态判断

## Phase 3：联调验证（~0.5 天）
- 全流程测试：wx.login → code2session → JWT → API 调用
- 新用户/老用户分支测试
- token 过期/刷新测试
