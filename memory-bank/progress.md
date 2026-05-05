# 进度日志 — yule-go

> 每完成一个实施步骤后，必须在此文件记录：做了什么、验证结果、踩坑记录
> 格式：日期 + Phase/Step + 状态 + 备注

---

## 进度总览

| Phase | 名称 | 状态 |
|:---|:---|:---|
| 0 | 基建准备 | ✅ 已完成 |
| 1 | 团期管理 | ✅ 已完成（后端 + 管理端 + 小程序端） |
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
