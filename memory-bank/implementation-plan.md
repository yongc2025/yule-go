# 实施计划 — yule-go

> 本文档是全局路线图，从 tasks/ 汇总而来
> 每一步要小而具体，每一步都必须包含验证正确性的测试
> 严禁在本文件中写代码——只写清晰、具体的指令

---

## 前置条件（阶段 0：基建准备）

### Step 0.1：Go 项目骨架
- 在 `src/server/` 下执行 `go mod init yule-go`
- 按 `memory-bank/architecture.md` 的目录结构创建所有子目录
- 创建 `src/server/main.go` 入口文件（空壳，只启动 Gin 默认路由）
- 创建 `Makefile`（build / run / test / lint 目标）
- **验证：** `make build` 编译通过

### Step 0.2：数据库迁移
- 将 `docs/database.md` 的 DDL 转为 `migrations/001_init.sql`
- 包含 9 张表 + 初始数据（4 条线路 + 4 个租赁项 + 1 个管理员）
- **验证：** 在本地 MySQL 执行无报错

### Step 0.3：配置管理
- 创建 `src/server/config/config.go` + `config.yaml`
- 支持环境变量覆盖
- **验证：** 读取配置文件并打印到日志

### Step 0.4：中间件
- 实现 CORS 中间件
- 实现 JWT 认证中间件（占位）
- 实现统一响应格式 `pkg/response/response.go`
- **验证：** 启动服务，访问健康检查接口返回 200

---

## Phase 1：团期管理（Task 0001）

> 依赖：阶段 0 全部完成

### Step 1.1：Model 层
- 创建 `src/server/model/schedule.go`
- 创建 `src/server/model/route.go`
- **验证：** `go build` 通过

### Step 1.2：Repository 层
- 实现 `ScheduleRepository`：Create / GetByID / List / Update / Delete
- 实现 `RouteRepository`：GetByID / List
- **验证：** 单元测试通过（mock DB 或 SQLite）

### Step 1.3：Service 层
- 实现 `ScheduleService`：创建团期（含日期校验、去重、线路存在性检查）
- 实现状态机：报名中 → 已满 → 已出发 → 已完成
- **验证：** 单元测试覆盖正常流程 + 异常流程

### Step 1.4：Handler + Router
- 实现管理后台 API：`POST/GET/PUT/DELETE /api/v1/admin/schedules`
- 实现小程序端 API：`GET /api/v1/schedules?week=xxx`
- 注册路由
- **验证：** 用 curl 或 Postman 测试全部 CRUD 接口

---

## Phase 2：用户预约（Task 0002）

> 依赖：Phase 1 完成

### Step 2.1：用户模块
- 微信登录 → openid → JWT Token
- 用户信息 CRUD

### Step 2.2：订单创建
- 选团期 → 填人数 → 填联系方式 → 计算费用 → 创建订单
- 含装备租赁选项

### Step 2.3：微信支付
- 发起支付 → 回调验签 → 更新订单状态

---

## Phase 3：会员充值（Task 0003）

> 依赖：用户模块（Phase 2.1）

### Step 3.1：充值方案管理
- 三档充值配置

### Step 3.2：充值 + 余额
- 充值 → 微信支付 → 到账
- 下单时余额抵扣

---

## Phase 4：装备租赁（Task 0004）

> 依赖：订单模块（Phase 2.2）

### Step 4.1：租赁项 CRUD
- 管理后台维护装备列表

### Step 4.2：租赁下单
- 下单时勾选 → 费用合并 → 库存扣减

---

## Phase 5：老带新裂变（Task 0005）

> 依赖：用户模块 + 订单模块

### Step 5.1：邀请码系统
- 生成邀请码 → 分享链接

### Step 5.2：奖励机制
- 新客首单立减 → 老客返现

---

## Phase 6：管理后台（Task 0006）

> 依赖：所有后端 API 完成

### Step 6.1：后台前端搭建
- Vue3 + Element Plus 项目初始化

### Step 6.2：各管理页面
- 团期管理、订单管理、客户管理、线路管理、财务统计

---

## 执行原则

1. **每个 Step 完成后必须：** 更新 `memory-bank/progress.md` + `tasks/000X/STATUS.md`
2. **每个 Phase 完成后必须：** 更新 `memory-bank/architecture.md`
3. **失败时：** 记录失败原因到 STATUS.md，回退到当前 Phase 的 Step 1 重试
4. **连续 3 次失败：** 标记为 🔴 致命错误，暂停并等待人工介入
