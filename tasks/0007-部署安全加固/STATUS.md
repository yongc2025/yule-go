# STATUS — 0007 部署安全加固

**当前状态：** ✅ 已完成
**优先级：** P0
**完成时间：** 2026-05-06

## 完成项
- [x] config.go 启动时校验 JWT_SECRET 非空（生产环境）
- [x] config.go 启动时校验数据库密码非空（生产环境）
- [x] 生产环境 gin mode 自动设为 release
- [x] 提供 .env.example 模板
- [x] 管理后台首次登录强制修改密码（Admin.MustChangePassword 字段）
- [x] 新增 POST /api/v1/admin/auth/change-password 接口
- [x] 数据库迁移 002_admin_must_change_password.sql
- [x] 登录响应增加 must_change_password 字段
