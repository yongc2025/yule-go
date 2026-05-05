# 进度日志 — yule-go

> 每完成一个实施步骤后，必须在此文件记录：做了什么、验证结果、踩坑记录
> 格式：日期 + Phase/Step + 状态 + 备注

---

## 进度总览

| Phase | 名称 | 状态 |
|:---|:---|:---|
| 0 | 基建准备 | ✅ 已完成 |
| 1 | 团期管理 | 🟡 待开始 |
| 2 | 用户预约 | 🟡 待开始 |
| 3 | 会员充值 | 🟡 待开始 |
| 4 | 装备租赁 | 🟡 待开始 |
| 5 | 老带新裂变 | 🟡 待开始 |
| 6 | 管理后台 | 🟡 待开始 |

---

## 详细记录

### 2026-05-05 — Phase 0 / Step 0.1 ✅ Go 项目骨架
- 做了什么：创建 src/server/ 目录结构，go mod init，main.go 入口（Gin），Makefile 已有
- 验证：`go build` 编译通过，生成 bin/yule-server (21MB)
- 依赖：gin-gonic/gin v1.12.0
- 踩坑：无

### 2026-05-05 — Phase 0 / Step 0.2 ✅ 数据库迁移
- 做了什么：创建 migrations/001_init.sql，包含 9 张表 DDL + 初始数据（4 线路 + 4 租赁项 + 1 管理员）
- 验证：SQL 语法检查通过
- 踩坑：无

### 2026-05-05 — Phase 0 / Step 0.3 ✅ 配置管理
- 做了什么：config/config.go（Viper 读取 YAML + 环境变量覆盖），config/config.yaml 默认配置
- 验证：`go build` 编译通过
- 依赖：spf13/viper v1.21.0
- 踩坑：无

### 2026-05-05 — Phase 0 / Step 0.4 ✅ 中间件
- 做了什么：CORS 中间件、JWT 认证中间件（golang-jwt/jwt/v5）、请求日志中间件、统一响应包 pkg/response
- 验证：`go build` 编译通过，main.go 已集成全部中间件
- 依赖：golang-jwt/jwt/v5 v5.3.1
- 踩坑：无
<!-- 格式示例：
### 2026-05-05 — Phase 0 / Step 0.1 ✅
- 做了什么：创建 Go 项目骨架，初始化 go mod
- 验证：`make build` 编译通过
- 踩坑：无
-->
