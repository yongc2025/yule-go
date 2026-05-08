# 进度日志 — yule-go

> 每完成一个实施步骤后，必须在此文件记录：做了什么、验证结果、踩坑记录
> 格式：日期 + Phase/Step + 状态 + 备注

---

## 进度总览

> ⚠️ **2026-05-07 需求升级至 v4.0（超级门店模式）**：v3.0 已完成的后端基建代码（Phase 0-6）大部分可复用，
> 但需求方向从"GetYourGuide 平台"调整为"平台+超级门店"。详见 `docs/requirements-v4.md`。

| Phase | 名称 | 状态 | 备注 |
|:---|:---|:---|:---|
| 0 | 基建准备 | ✅ 已完成 | 可复用 |
| 1 | 团期管理 | ✅ 已完成 | 后端可复用，小程序前端需按门店首页重做 |
| 2 | 用户预约 | ✅ 已完成 | 后端可复用，前端需适配门店上下文 |
| 3 | 会员充值 | ✅ 已完成 | 可复用 |
| 4 | 装备租赁 | ✅ 已完成 | 可复用 |
| 5 | 老带新裂变 | ✅ 已完成 | 可复用 |
| 6 | 管理后台 | ✅ 已完成 | 可复用，需增强 |
| v4 | 需求升级至 v4.0 | ✅ 已完成 | 超级门店模式，需求文档+任务清单已更新 |

---

### 2026-05-08 — 任务文档双分支澄清
- 做了什么：
  - 明确 cloud-mvp（微信云开发）与 yule-go（自研版）是两个独立分支
  - 更新 `memory-bank/implementation-plan.md`：新增"双分支说明"章节 + cloud-mvp 任务（0035-0039）纳入路线图
  - 更新 `tasks/INDEX.md`：0035-0039 区域标注分支归属和需求源
  - 修复 0035-0039 的 CONTEXT.md：
    - 每个文件顶部新增分支标注和需求源指向
    - 0036：补充需求定义的完整时间梯度退款规则（72h+/24-72h/24h内），标注 MVP 简化处理
    - 0037：补充订单状态机引用（cloud-mvp/REQUIREMENTS.md §5.1）
    - 0038：标注 users 集合基础字段来源
    - 0039：补充费用计算规则引用
- 关键区分：
  - 自研版术语：表 (table)、字段 (column)、MySQL
  - cloud-mvp 术语：集合 (collection)、文档 (document)、云数据库
  - 两者需求文档独立，不可混淆引用

### 2026-05-07 — 需求升级至 v4.0（超级门店模式）
- 做了什么：
  - 分析商业计划书原始定位 vs v3.0 平台模式的偏差
  - 确定"平台+超级门店"混合模式：门店为信任单元，平台为发现通道
  - 创建 `docs/requirements-v4.md`：完整 v4 需求文档
  - 更新 `memory-bank/requirements.md` 同步 v4
  - 重写 `tasks/INDEX.md`：v4 任务清单（20 个任务替代原 40 个）
  - 更新 `memory-bank/progress.md`：记录 v4 升级
- 核心变化：
  - 首页从"平台级"改为"门店级"（老板卡片+本周活动+信任标签）
  - 新增"去过的店"（user_shops 表）+ 主场店概念
  - 新增门店详情页（GetYourGuide 结构）
  - 新增平台发现页（附近门店列表）
  - 商家表新增 12 个字段（老板信息、评分、位置等）
  - 批量创建团期、数据看板、分享海报等新功能
- 与 v3.0 关系：后端基建代码（Phase 0-6）大部分可复用，主要是前端和产品形态调整
- 踩坑：无

### 2026-05-07 — 野钓线路设计决策
- 做了什么：
  - 确认野钓场作为特殊线路类型（wild_fishing），而非钓场
  - 线路不关联 fishing_spot_id（NULL），目的地描述在线路 description 中填写
  - 新增第五条产品线"野钓探险团"（158 元/人，12 人/团）
  - 更新需求文档（memory-bank + docs）、路由模型注释、初始数据
- 设计依据：经营性钓场有管理方，野钓场是自然水域，信息结构不同，不宜混为一谈
- 影响范围：routes.type 枚举新增 wild_fishing，初始数据新增 1 条线路

### 2026-05-07 — Task 0011a ✅ 微信登录 — 后端核心
- 做了什么：
  - 创建 `pkg/wechat/mini.go`：微信 Code2Session SDK（调用 jscode2session 接口换取 openid + session_key）
  - 创建 `service/auth.go`：WxLogin 业务逻辑（查找/创建用户 + JWT 签发 30 天）
  - 创建 `handler/auth.go`：POST /api/v1/auth/wx-login
  - 创建 `router/auth.go`：公开认证路由
  - 修改 `model/user.go`：新增 LastLoginAt 字段
  - 修改 `main.go`：注册认证路由到公开路由组
- 验证：代码完成，待 Go 环境编译验证
- 踩坑：无

### 2026-05-07 — Task 0011b ✅ 微信登录 — 用户接口与中间件
- 做了什么：
  - 创建 `handler/user.go`：GET/PUT /api/v1/user/profile + PUT /user/phone（占位）
  - 创建 `router/user.go`：JWT 保护的用户路由
  - 修改 `model/user.go`：新增 ToProfileResponse() 方法
  - 修改 `main.go`：注册用户路由到 JWT 认证组
- 说明：JWT 中间件（middleware/auth.go）在 0011a 前已存在，AC-01 无需额外开发
- 验证：代码完成，待 Go 环境编译验证
- 踩坑：无

### 2026-05-07 — Task 0011c ✅ 微信登录 — 小程序端
- 做了什么：
  - 创建 `api/auth.js`：wx-login API
  - 创建 `utils/auth.js`：token 存储/获取/清除 + wxLogin 流程封装
  - 修改 `api/index.js`：401 自动重新登录 + 请求队列防并发
  - 修改 `App.vue`：onLaunch 自动调用 wx.login
  - 创建 `pages/user/profile.vue`：个人信息页（昵称、头像、手机号、会员等级、余额、邀请码）
  - 修改 `pages.json`：新增 profile 页路由
- 验证：代码完成，待 npm 编译验证
- 踩坑：无

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

### 2026-05-08 — Task 0037 ✅ 团期变更通知
- 做了什么：
  - 创建 `cloudfunctions/schedules/index.js`：团期 update/cancel action
    - update：编辑日期/名额/集合地点，记录变更日志，异步通知已报名用户
    - cancel：取消团期，自动查询已支付订单并退款，退还名额，发送取消通知
  - 创建 `cloudfunctions/notify/index.js`：订阅消息授权管理
    - saveSubscription：保存用户订阅授权状态
    - getMySubscriptions：查询授权状态
    - sendTest：管理员测试发送通知
  - 增强 `pages/admin/schedules.js`：
    - 编辑弹窗新增「集合地点」字段
    - 取消团期二次确认（显示已报名人数 + 退款提示）
    - 变更记录弹窗（查看所有团期变更历史）
  - 增强 `pages/admin/schedules.wxml/wxss`：
    - 卡片显示集合地点
    - 取消原因展示
    - 变更记录弹窗 UI
  - 增强 `pages/booking/booking.js`：
    - 下单时自动请求订阅消息授权
    - 授权状态保存到云端 subscriptions 集合
    - 通知提醒卡片 UI
  - 新增文件：4 个（2 个云函数 × 2 文件）
  - 修改文件：6 个（admin/schedules × 3 + booking × 3）
  - 数据库新增集合：schedule_changelogs（变更记录）、subscriptions（订阅授权）
- 验证：代码结构完整，待部署到微信云开发环境验证
- 踩坑：无

### 2026-05-08 — Task 0038 ✅ 用户个人信息
- 做了什么：
  - 扩展 `cloudfunctions/login/index.js`：返回完整用户信息，首次登录自动填充昵称/头像
  - 创建 `cloudfunctions/users/index.js`：用户信息管理云函数
    - getProfile：查询完整用户资料
    - updateProfile：更新昵称/头像/简介
    - updatePhone：绑定/更新手机号
    - uploadAlbum：添加相册照片（最多9张）
    - deleteAlbum：删除相册照片
  - 创建 `pages/profile/edit.js/wxml/wxss`：用户资料编辑页
    - 头像上传（云存储）
    - 昵称编辑（20字限制）
    - 个人简介（200字限制）
    - 手机号绑定（getPhoneNumber + 手动输入双模式）
    - 相册管理（上传/删除/预览，最多9张）
  - 升级 `pages/profile/profile.js/wxml/wxss`：
    - 从云端加载用户信息（替代本地缓存降级）
    - 展示个人简介
    - 相册横向滚动预览
    - 点击头像区域跳转编辑页
  - 更新 `app.json`：注册 profile/edit 页面路由
  - 新增文件：4 个（users 云函数 × 2 + edit 页 × 3）
  - 修改文件：5 个（login + profile × 3 + app.json）
- 验证：代码结构完整，待部署验证
- 踩坑：无

### 2026-05-08 — Task 0041 ✅ 会员充值（cloud-mvp）
- 做了什么：
  - wallet 云函数已有 8 个 action（getWallet/getWallets/recharge/rechargeList/walletLogs/getTiers/refundBalance/adminRefund）
  - 充值中心页面：三档充值卡片（银卡¥200/金卡¥500/钻石¥1000）+ 权益展示 + 钱包状态
  - 充值记录页面（新增）：充值历史列表 + 下拉刷新 + 触底加载 + 空状态
  - 我的页集成：每店余额/等级展示 + 充值入口 + 记录入口
  - app.json 注册 records 路由，recharge/profile 页增加导航
- 新增文件：4 个（records.js/wxml/wxss/json）
- 修改文件：5 个（app.json + recharge.js/wxml/wxss + profile.js/wxml/wxss）
- 验收标准：AC-01/02/04/05/06 ✅，AC-03 属于 0045 下单流程改造
- 踩坑：无

### 2026-05-08 — Task 0039 ✅ 退款资金对账
- 做了什么：
  - 扩展 `cloudfunctions/orders/index.js`：
    - 新增 `stats` action：按日/周/月统计支付收入、退款支出、净收入，支持按团期维度拆分
    - 新增 `refundList` action：退款订单分页查询（管理员权限）
  - 创建 `pages/admin/finance.js/wxml/wxss`：财务统计页
    - 时间范围切换（今日/本周/本月）
    - 收支概览卡片（支付收入 vs 退款支出 vs 净收入）
    - 按团期对账明细（每个团期的收入/退款/净收入）
    - 退款订单列表（展开/收起 + 分页加载）
  - 更新 `pages/admin/admin.js/wxml`：
    - 面板新增「💰 财务统计」入口
    - 新增 goFinance 跳转方法
  - 更新 `app.json`：注册 finance 页面路由
  - 新增文件：4 个（finance 页 × 4）
  - 修改文件：3 个（orders 云函数 + admin 面板 × 2 + app.json）
- 验证：代码结构完整，待部署验证
- 踩坑：无
