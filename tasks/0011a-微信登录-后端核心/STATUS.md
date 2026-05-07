# STATUS — 微信登录后端核心

| 字段 | 值 |
|:---|:---|
| 状态 | 🔵 进行中 |
| 当前步骤 | 代码完成，待编译验证 |
| 失败次数 | 0 |
| 上次更新 | 2026-05-07 |

## 完成项

| 步骤 | 文件 | 状态 |
|:---|:---|:---|
| 1. 配置 | config/config.go — 已有 WechatConfig，无需修改 | ✅ |
| 2. 微信 SDK | pkg/wechat/mini.go — Code2Session | ✅ |
| 3. 认证 Service | service/auth.go — WxLogin + JWT 签发 | ✅ |
| 4. 认证 Handler | handler/auth.go — POST /api/v1/auth/wx-login | ✅ |
| 5. 认证路由 | router/auth.go — RegisterAuthRoutes | ✅ |
| 6. 注册路由 | main.go — 添加 RegisterAuthRoutes | ✅ |
| 7. 编译验证 | 待 Go 环境安装后执行 | ⏳ |

## 变更文件清单

- `pkg/wechat/mini.go` — 新增：微信 Code2Session SDK
- `model/user.go` — 修改：新增 LastLoginAt 字段
- `service/auth.go` — 新增：WxLogin 业务逻辑 + JWT 签发
- `handler/auth.go` — 新增：WxLogin HTTP Handler
- `router/auth.go` — 新增：认证路由注册
- `main.go` — 修改：注册认证路由到公开路由组

## 待验证

- [ ] `go build` 编译通过
- [ ] curl 测试 POST /api/v1/auth/wx-login（需要真实微信 code 或 mock）
- [ ] 数据库 users 表新增 last_login_at 列（ALTER TABLE 或重新迁移）
