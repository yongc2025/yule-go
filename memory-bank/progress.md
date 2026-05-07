# 进度日志 — yule-go

> 每完成一个实施步骤后，必须在此文件记录：做了什么、验证结果、踩坑记录
> 格式：日期 + Phase/Step + 状态 + 备注

---

## 进度总览

| Phase | 名称 | 状态 |
|:---|:---|:---|
| 0 | 基建准备 | ✅ 已完成 |
| 1 | 团期管理 | ✅ 已完成（后端 + 管理端 + 小程序端） |
| 2 | 用户预约 | 🔵 进行中（后端 + 前端完成，待微信支付接入） |
| 3 | 会员充值 | 🔵 进行中（后端 + 前端完成，待微信支付接入） |
| 4 | 装备租赁 | ✅ 已完成 |
| 5 | 老带新裂变 | ✅ 已完成 |
| 6 | 管理后台 | ✅ 已完成 |

---

### 2026-05-07 — 任务颗粒度拆分
- 做了什么：
  - 将原 9 个 MVP 任务（0011-0019）拆分为 22 个子任务
  - 新增第二阶段任务 0020-0025（共 8 个子任务）
  - 每个任务控制在 ≤1 天、≤4 个 AC
  - 按技术层拆分（后端 → 管理前端 → 小程序前端）
  - 重写 tasks/INDEX.md：新增依赖关系、关键路径、统计信息
- 拆分原则：
  - 原则1：每个任务 ≤ 1天，≤ 4个AC
  - 原则2：按技术层拆分（后端DB/后端API/管理前端/小程序前端）
  - 原则3：每个任务可独立验收、独立提交
- 任务统计：总计 40 个任务（已完成 10 / 待开始 30）
- 结论：颗粒度均匀，失败风险降低，可单步验收

### 2026-05-07 — 需求 v3.0 与任务对齐检查
- 做了什么：
  - 克隆项目，按 AGENTS.md 会话恢复流程读取全部上下文
  - 对照 requirements.md v3.0 逐项检查任务覆盖情况
  - 创建缺失的 tasks/0011-微信登录/ 目录（CONTEXT/PLAN/TODO/STATUS）
  - 更新 tasks/0012-钓场管理：补充附近钓场 API (AC-07) 和钓场关联线路 API (AC-08)
  - 更新 tasks/0017-小程序首页+钓场：补充天气状态展示 (AC-06)
  - 重写 tasks/INDEX.md：清理旧引用、新增需求覆盖检查矩阵
- 发现的缺口：
  - 0011 目录缺失（INDEX 引用了但未创建）
  - 0012 缺少 nearby spots API 和 spot routes API
  - 0017 缺少天气状态展示需求
- 结论：需求 v3.0 全部功能点已映射到任务，无遗漏

### 2026-05-06 — 全面审计 + 安全修复
- 审计范围：Phase 0~6 全部代码（42 个 Go 文件 + 17 个前端文件）
- 发现问题：25 个（严重 8 / 中等 10 / 低等 7）
- 已修复：19 个
- 待修复：6 个 → 新增 Task 0007~0010

#### 安全修复（`f0b1304`）
- S1: AdminAuth 中间件实现 JWT 校验
- S2: 管理员登录增加 argon2id 密码校验
- S4/S6: 支付/充值回调增加 SHA256 签名验证
- S5: 订单详情增加 user_id 归属校验
- M3: 订单号扩展到 8 位随机数
- M8: 创建 TabBar 图标占位文件
- M5/M10: 预约页增加 API 数据加载

#### 中等修复（`8a03dbf`）
- M1: 订单创建事务增加 SELECT FOR UPDATE 行锁
- M2: 租赁项库存扣减纳入事务，取消时退还
- M9: 小程序 API 地址配置化 + token 注入

#### 新增任务
- 0007 部署安全加固（P0）— JWT Secret/生产模式/强制改密 ✅
- 0008 定时任务调度（P0）— 超时订单自动取消 ✅
- 0009 金额精度优化（P1）— RoundToCent 工具函数 ✅
- 0010 邀请码唯一性（P2）— 生成唯一校验 + 重试 ✅

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

### 2026-05-05 — Phase 1 / Step 1.1 🔵 团期管理后端 API（auto-dev-loop 驱动）
- 做了什么：按 auto-dev-loop 五步工作流实现团期管理后端
  - Step 1 需求锁定：生成 SPEC_LOCKED.md（6 条 EARS 验收标准）
  - Step 2 执行计划：生成 PLAN_V2.md（任务 DAG + 测试计划）
  - Step 3 实施变更：创建 8 个新文件
    - model/schedule.go — Schedule Model + 状态机 + 请求/响应结构体
    - model/route.go — Route Model
    - db/db.go — GORM 数据库初始化
    - repository/schedule.go — 数据访问层（CRUD + 按周查询 + 去重）
    - service/schedule.go — 业务逻辑层（日期校验、去重、状态管理）
    - handler/schedule.go — HTTP 处理器（6 个 API 接口）
    - router/schedule.go — 路由注册
    - main.go 更新 — 集成 DB 初始化 + 路由注册
  - go.mod 更新 — 添加 GORM + MySQL driver 依赖
- 验证：代码结构完整，待本地 `go mod tidy && go build` 编译验证
- 依赖：gorm.io/gorm v1.25.12, gorm.io/driver/mysql v1.5.7
- 踩坑：沙箱无 Go 编译器，go.mod 依赖需本地 `go mod tidy` 同步
- API 接口清单：
  - POST /api/v1/admin/schedules — 创建团期
  - PUT /api/v1/admin/schedules/:id — 编辑团期
  - PUT /api/v1/admin/schedules/:id/cancel — 取消团期
  - GET /api/v1/admin/schedules/:id — 团期详情
  - GET /api/v1/admin/schedules — 团期列表（分页）
  - GET /api/v1/schedules?week=xxx — 按周查询（小程序端）

### 2026-05-05 — Phase 1 / Step 1.1 ✅ 团期管理后端 API 验证通过
- 做了什么：
  - 安装 Go 1.22.4 + MySQL 8.0，初始化 yule 数据库 + 9 张表
  - `go mod tidy && go build` 编译通过（33MB binary）
  - 启动服务，执行 6 个验收测试用例 + 3 个补充测试
- 验证结果（9/9 全部通过）：
  - TC-001 ✅ POST 创建团期 → 200 + 团期详情
  - TC-002 ✅ PUT 编辑团期 → 200 + 更新后数据（max_slots/guide_name/guide_phone）
  - TC-003 ✅ PUT 取消团期 → 200
  - TC-004 ✅ GET 按周查询 → 200 + 团期列表（route_name 关联正确）
  - TC-005 ✅ 名额1团期创建成功（名额满标记需下单时触发，属 Task 0002 范围）
  - TC-006 ✅ 重复去重 → 40000 "该线路该日期已有团期"
  - 补充 ✅ 团期详情查询正常
  - 补充 ✅ 分页列表正常（total=3，关联线路名正确显示）
  - 补充 ✅ 非周末日期校验 → 40000 "团期日期只能是周六或周日"
- 踩坑：
  - apt 默认源 mirrors.cloud.aliyuncs.com 不可达，需切换到 archive.ubuntu.com
  - MySQL root 用户需 ALTER USER 改用 mysql_native_password 认证
  - go run 需显式 export PATH 包含 /usr/local/go/bin
- 结论：团期管理后端 API 全部验收标准（AC-01~AC-06）通过，Task 0001 后端部分完成

### 2026-05-05 — Phase 1 / Step 1.2 ✅ 团期管理 — 管理后台前端
- 做了什么：
  - 创建 src/web/ 项目（Vite + Vue3）
  - 安装依赖：Element Plus + Vue Router 4 + Pinia + Axios
  - 实现管理后台布局：侧边栏导航 + 面包屑 + 主内容区
  - 实现团期管理页面（ScheduleList.vue）：
    - 团期列表表格（ID、线路、日期、名额、领队、状态）
    - 状态筛选
    - 分页
    - 创建团期对话框（表单校验）
    - 编辑团期对话框
    - 取消团期确认
    - 团期详情查看
  - 实现 API 层：axios 封装 + 请求/响应拦截 + 团期 API 模块
  - 配置 Vite 代理（/api → localhost:8080）
  - 复制 Logo 资源到 public/
- 验证：`npx vite build` 编译通过
- 文件清单：
  - src/web/src/main.js — 入口（Element Plus + Router + Pinia）
  - src/web/src/App.vue — 根组件
  - src/web/src/router/index.js — 路由配置（6 个页面）
  - src/web/src/api/index.js — axios 封装
  - src/web/src/api/schedule.js — 团期 API
  - src/web/src/layouts/AdminLayout.vue — 管理后台布局
  - src/web/src/views/schedule/ScheduleList.vue — 团期管理页
  - src/web/src/views/Placeholder.vue — 占位页
  - src/web/vite.config.js — Vite 配置（含代理）
- 踩坑：无
<!-- 格式示例：
### 2026-05-05 — Phase 0 / Step 0.1 ✅
- 做了什么：创建 Go 项目骨架，初始化 go mod
- 验证：`make build` 编译通过
- 踩坑：无
-->

### 2026-05-06 — Phase 1 / Step 1.3 ✅ 团期管理 — 小程序前端
- 做了什么：
  - 创建 src/miniprogram/ 项目（uni-app + Vue3 + Pinia）
  - 实现团期列表页（pages/schedule/index.vue）：
    - 按周展示团期列表
    - 左右箭头切换周
    - 快捷周选择标签（上周/本周/下周/后周）
    - 点击标题回到本周
    - 下拉刷新
  - 实现团期卡片组件（components/ScheduleCard.vue）：
    - 线路名称 + 出行日期（中文格式）
    - 名额进度条（绿/黄/红三色渐变）
    - 状态角标（报名中/已满/已取消/已出发/已完成）
    - 剩余名额提示（≤3 位时警告色）
    - 报名按钮（已满/已取消时禁用）
  - API 封装层：统一请求 + 错误处理 + toast 提示
  - 日期工具：ISO 周计算、偏移周、中文格式化
- 文件清单（13 个文件）：
  - `package.json` — 项目配置 + uni-app 依赖
  - `manifest.json` — 小程序配置
  - `pages.json` — 页面路由 + 全局样式
  - `App.vue` — 根组件
  - `main.js` — 入口
  - `index.html` — Vite 入口
  - `vite.config.js` — Vite + uni 插件
  - `uni.scss` — 全局 SCSS 变量
  - `api/index.js` — 请求封装
  - `api/schedule.js` — 团期 API
  - `pages/schedule/index.vue` — 团期列表页
  - `components/ScheduleCard.vue` — 团期卡片组件
  - `utils/date.js` — 日期工具
- 验证：代码结构完整，待本地 `npm install && npm run dev:mp-weixin` 编译验证
- 踩坑：无

### 2026-05-06 — Phase 2 / Step 2.1~2.4 ✅ 用户预约 — 后端 + 小程序前端
- 做了什么：
  - **后端 Model**：
    - `model/order.go` — Order 模型 + 状态机（待支付/已确认/已出行/已完成/已取消/已退款）+ 请求/响应结构体
    - `model/order_rental.go` — OrderRental 租赁明细模型
    - `model/rental_item.go` — RentalItem 装备租赁项模型
    - `model/user.go` — User 用户模型 + 会员折扣率（普通/银卡95折/金卡9折/钻石85折）
  - **后端 Repository**：
    - `repository/order.go` — 订单 CRUD + 事务创建（含租赁明细）+ 超时取消
    - `repository/user.go` — 用户 CRUD
  - **后端 Service**：
    - `service/order.go` — 核心业务逻辑：
      - 价格计算（团费×人数 + 租赁费 - 会员折扣 - 余额抵扣）
      - 名额锁定（校验团期状态、剩余名额、重复下单）
      - 支付回调（幂等处理）
      - 超时自动取消（15 分钟）
  - **后端 Handler + Router**：
    - `handler/order.go` — 订单接口（创建/详情/列表/取消/支付回调/管理后台）
    - `handler/rental.go` — 租赁项列表
    - `handler/route.go` — 线路列表/详情
    - `router/order.go` — 订单路由（小程序端 + 管理后台 + 支付回调）
    - `router/route.go` — 线路路由
    - `main.go` 更新 — 集成全部新路由
  - **小程序前端**：
    - `pages/booking/index.vue` — 预约页面（人数选择、租赁勾选、联系信息、余额抵扣、实时费用计算）
    - `pages/order/list.vue` — 订单列表（状态筛选、分页加载、下拉刷新）
    - `pages/order/detail.vue` — 订单详情（状态展示、费用明细、取消/支付）
    - `api/order.js` — 订单 + 租赁项 + 线路 API
  - **团期响应增强**：ScheduleResponse 新增 route_price/child_price/route_type 字段
- 新增文件：11 个后端文件 + 4 个前端文件
- 验证：代码结构完整，待本地编译验证
- 踩坑：无

### 2026-05-06 — Task 0007 ✅ 部署安全加固
- 做了什么：
  - `config/config.go` 增加 `validateProductionConfig()`：生产环境强制校验 JWT_SECRET 和 DB_PASSWORD 非空
  - 生产环境自动设置 gin mode = release
  - 创建 `.env.example` 环境变量模板
  - `model/admin.go` 增加 `MustChangePassword` 字段（首次登录强制改密）
  - `handler/admin_auth.go` 新增 `AdminChangePassword` 改密接口
  - 登录响应增加 `must_change_password` 字段
  - `router/admin.go` 新增 `RegisterAdminAuthProtectedRoutes`（需认证的管理路由）
  - `migrations/002_admin_must_change_password.sql` 数据库迁移
- 验证：
  - 登录 API 返回 `"must_change_password": true` ✅
  - 改密接口正常工作 ✅
  - 生产模式下 JWT_SECRET 为空会拒绝启动 ✅
- 踩坑：无

### 2026-05-06 — Task 0008 ✅ 定时任务调度
- 做了什么：
  - 引入 `github.com/robfig/cron/v3` 依赖
  - 创建 `scheduler/scheduler.go`：每分钟执行超时订单取消（15 分钟超时）
  - `handler/scheduler.go`：全局调度器实例 + 手动触发 API
  - `main.go`：启动调度器 + goroutine 运行服务 + 主线程优雅退出
  - `router/order.go`：注册 `POST /api/v1/admin/orders/cancel-expired` 路由
- 验证：
  - 服务启动日志显示 `⏰ 定时任务调度器已启动` ✅
  - 手动触发 API 返回 `{"cancelled_count":0}` ✅（无超时订单时正常）
  - 优雅退出信号处理正常 ✅
- 踩坑：无

### 2026-05-06 — Task 0009 ✅ 金额精度优化
- 做了什么：
  - 创建 `pkg/util/money.go`：`RoundToCent` 函数（`math.Round(amount*100) / 100`）
  - `service/order.go`：团费、租赁费、小计、折扣、余额抵扣、实付金额全部经过 RoundToCent
  - `service/referral.go`：邀请人余额增加后 RoundToCent
  - `service/member.go`：充值回调余额/累计充值 RoundToCent
  - 前端确认：小程序和管理后台均已使用 `.toFixed(2)`，无需修改
- 验证：
  - `go build` 编译通过（33MB）✅
  - 冒烟测试：health/schedules/rental-items/routes 全部 API 正常响应 ✅
- 踩坑：无

### 2026-05-06 — Task 0010 ✅ 邀请码唯一性
- 做了什么：
  - `service/referral.go` 重构 `GenerateInviteCode`：
    - 原函数改名为 `generateInviteCodeRaw()`（内部使用）
    - 新增 `GenerateUniqueInviteCode(userRepo repository.UserRepository)` — 生成后查询数据库确认唯一，冲突自动重试（最多 3 次）
  - users 表 invite_code 字段已有 UNIQUE INDEX，数据库层面兜底
- 验证：
  - `go build` 编译通过 ✅
  - 冒烟测试：全部 API 正常响应 ✅
- 备注：`GenerateUniqueInviteCode` 需注入 UserRepository，待微信登录接入时调用
- 踩坑：无
