# 架构说明 — yule-go

> 本文档记录每个文件/目录的职责，是 AI 理解项目结构的唯一真相源
> 每完成一个里程碑后，必须更新本文档

---

## 项目总览

```
yule-go/
├── AGENTS.md              # Agent 行为准则（会话恢复入口）
├── memory-bank/           # 记忆银行（AI 上下文核心）
│   ├── requirements.md    # 需求规格书
│   ├── tech-stack.md      # 技术栈说明
│   ├── implementation-plan.md  # 实施计划
│   ├── progress.md        # 进度日志
│   └── architecture.md    # 本文件
├── docs/                  # 详细文档（供人类阅读）
│   ├── requirements.md    # 完整需求文档
│   ├── architecture.md    # 技术架构（含架构图）
│   ├── database.md        # 数据库设计（9 张表 DDL）
│   ├── api.md             # API 接口定义
│   └── quotation.md       # 报价文档
├── tasks/                 # 任务管理
│   ├── INDEX.md           # 全局任务看板
│   └── 0001~0006/         # 6 大功能模块任务
├── src/                   # 源代码（待创建）
│   ├── server/            # Go 后端
│   ├── web/               # 管理后台
│   └── miniprogram/       # 小程序
├── migrations/            # 数据库迁移脚本（待创建）
├── scripts/               # 工具脚本（待创建）
├── docker/                # Docker 配置（待创建）
├── Makefile               # 自动化命令（待创建）
└── .gitignore
```

---

## 后端分层架构（src/server/）

```
src/server/
├── main.go               # 程序入口：初始化配置、DB、路由，启动 Gin
├── config/               # 配置管理
│   ├── config.go         # Viper 读取 YAML + 环境变量
│   └── config.yaml       # 默认配置
├── router/               # 路由定义（按模块拆分）
│   ├── router.go         # 路由总入口，注册所有子路由
│   ├── schedule.go       # 团期相关路由
│   ├── order.go          # 订单相关路由
│   └── ...
├── handler/              # HTTP 处理器（入参校验 + 响应封装）
│   ├── schedule.go       # 团期 Handler：调用 Service，返回 JSON
│   └── ...
├── service/              # 业务逻辑层（事务管理 + 核心逻辑）
│   ├── schedule.go       # 团期 Service：创建、查询、状态管理
│   └── ...
├── repository/           # 数据访问层（纯 CRUD，无业务逻辑）
│   ├── schedule.go       # 团期 Repository：GORM 操作
│   └── ...
├── model/                # 数据模型（GORM 标签 + JSON 标签）
│   ├── schedule.go       # Schedule 结构体
│   ├── route.go          # Route 结构体
│   ├── order.go          # Order 结构体
│   └── ...
├── middleware/            # 中间件
│   ├── auth.go           # JWT 认证
│   ├── cors.go           # CORS 跨域
│   └── logger.go         # 请求日志
└── pkg/                  # 公共工具包
    ├── response/         # 统一响应格式
    │   └── response.go   # Success / Error / PageResult
    ├── wechat/           # 微信 SDK 封装（V2 实现）
    └── util/             # 通用工具函数
```

### 调用链路

```
HTTP Request
  → middleware (CORS → Auth → Logger)
  → router (路由匹配)
  → handler (参数校验、绑定 JSON)
  → service (业务逻辑、事务)
  → repository (数据库操作)
  → model (数据结构)
  → 返回 JSON 响应
```

---

## 数据库表（MySQL 8.0）

| 表名 | 职责 | 关键字段 |
|:---|:---|:---|
| users | 用户（微信登录） | openid, phone, member_level, balance, invite_code |
| routes | 线路（四大产品） | name, type, price, child_price, max_slots |
| schedules | 团期（每周出发） | route_id, trip_date, max_slots, booked_slots, status |
| orders | 订单 | order_no, user_id, schedule_id, adults, children, total_amount |
| order_rentals | 订单租赁明细 | order_id, rental_item_id, quantity, subtotal |
| rental_items | 装备租赁项 | name, price_per_day, stock |
| recharges | 充值记录 | user_id, amount, gift_amount, payment_status |
| referrals | 裂变记录 | inviter_id, invitee_id, reward_amount, status |
| admins | 管理员 | username, password_hash, role |

---

## 前端架构

### 小程序端（src/miniprogram/）
- uni-app + Vue3 + Pinia
- 页面：首页、团期列表、线路详情、预约下单、订单列表、会员中心、邀请好友

### 管理后台（src/web/）
- Vue3 + Element Plus + Vite + Pinia
- 页面：看板、团期管理、订单管理、客户管理、线路管理、装备管理、财务统计

---

## 文件职责索引（随开发进度更新）

| 文件 | 职责 |
|:---|:---|
| src/server/main.go | 程序入口：加载配置 → 初始化 Gin → 注册中间件 → 注册路由 → 启动服务 |
| src/server/config/config.go | 配置管理：Viper 读取 YAML + 环境变量覆盖，全局 Config 结构体 |
| src/server/config/config.yaml | 默认配置：server/database/redis/jwt/wechat |
| src/server/middleware/cors.go | CORS 跨域中间件 |
| src/server/middleware/auth.go | JWT 认证中间件 + 管理员认证占位 |
| src/server/middleware/logger.go | 请求日志中间件（IP、方法、路径、状态码、耗时） |
| src/server/pkg/response/response.go | 统一响应格式：Success/Error/Page/Unauthorized 等 |
| src/server/db/db.go | 数据库初始化：GORM 连接 MySQL，连接池配置 |
| src/server/model/schedule.go | 团期 Model：Schedule 结构体、状态机常量、请求/响应结构体 |
| src/server/model/route.go | 线路 Model：Route 结构体 |
| src/server/repository/schedule.go | 团期 Repository：GORM CRUD、按周查询、去重校验 |
| src/server/service/schedule.go | 团期 Service：创建/编辑/取消、日期校验（周六/周日）、去重校验、状态自动计算 |
| src/server/handler/schedule.go | 团期 Handler：6 个 API 接口（CRUD + 按周查询） |
| src/server/router/schedule.go | 团期路由注册：admin 路由 + 小程序端路由 |
| migrations/001_init.sql | 数据库初始化：9 张表 + 初始数据 |
| assets/logos/ | 品牌 Logo 资源（App/小程序/管理端/宣传用，SVG 源 + 多尺寸 PNG） |
| src/web/ | 管理后台前端（Vue3 + Element Plus + Vite） |
| src/web/src/main.js | 前端入口：Element Plus + Router + Pinia |
| src/web/src/router/index.js | 路由配置：团期/订单/客户/线路/装备/财务 |
| src/web/src/api/index.js | axios 封装：拦截器 + 统一错误处理 |
| src/web/src/api/schedule.js | 团期 API：CRUD + 按周查询 |
| src/web/src/layouts/AdminLayout.vue | 管理后台布局：侧边栏 + 面包屑 |
| src/web/src/views/schedule/ScheduleList.vue | 团期管理页：列表 + 筛选 + 创建/编辑/取消/详情 |
| src/miniprogram/ | 小程序前端（uni-app + Vue3） |
| src/miniprogram/main.js | 小程序入口：createSSRApp |
| src/miniprogram/App.vue | 根组件：全局样式 |
| src/miniprogram/pages.json | 页面路由配置：团期列表页 |
| src/miniprogram/manifest.json | 小程序配置：appid、权限、优化 |
| src/miniprogram/api/index.js | 请求封装：统一错误处理 + toast |
| src/miniprogram/api/schedule.js | 团期 API：listByWeek |
| src/miniprogram/pages/schedule/index.vue | 团期列表页：按周展示 + 周切换 + 下拉刷新 |
| src/miniprogram/components/ScheduleCard.vue | 团期卡片：线路名 + 日期 + 名额进度条 + 状态角标 |
| src/miniprogram/utils/date.js | 日期工具：ISO 周计算、偏移、中文格式化 |
| src/miniprogram/uni.scss | 全局 SCSS 变量 |
| src/miniprogram/vite.config.js | Vite 构建配置（uni 插件） |
| src/server/model/order.go | 订单 Model：Order 结构体、状态机、请求/响应结构体 |
| src/server/model/order_rental.go | 订单租赁明细 Model：OrderRental 结构体 |
| src/server/model/rental_item.go | 装备租赁项 Model：RentalItem 结构体 |
| src/server/model/user.go | 用户 Model：User 结构体、会员折扣率 |
| src/server/repository/order.go | 订单 Repository：事务创建、查询、超时取消 |
| src/server/repository/user.go | 用户 Repository：CRUD |
| src/server/service/order.go | 订单 Service：价格计算、名额锁定、支付回调、超时取消 |
| src/server/handler/order.go | 订单 Handler：创建/详情/列表/取消/支付回调/管理后台 |
| src/server/handler/rental.go | 租赁项 Handler：列表 |
| src/server/handler/route.go | 线路 Handler：列表/详情 |
| src/server/router/order.go | 订单路由：小程序端 + 管理后台 + 支付回调 |
| src/server/router/route.go | 线路路由 |
| src/miniprogram/api/order.js | 订单 + 租赁项 + 线路 API |
| src/miniprogram/pages/booking/index.vue | 预约页面：人数选择、租赁勾选、联系信息、余额抵扣 |
| src/miniprogram/pages/order/list.vue | 订单列表：状态筛选、分页加载、下拉刷新 |
| src/miniprogram/pages/order/detail.vue | 订单详情：状态展示、费用明细、取消/支付 |
| src/server/model/recharge.go | 充值 Model：Recharge 结构体 + 充值方案配置 + 会员信息响应 |
| src/server/repository/recharge.go | 充值 Repository：创建、查询、分页 |
| src/server/service/member.go | 会员 Service：充值方案、创建充值、回调（余额+等级）、记录查询 |
| src/server/handler/member.go | 会员 Handler：充值方案、会员信息、发起充值、记录 |
| src/server/router/member.go | 会员路由：小程序端 + 充值回调 |
| src/miniprogram/api/member.js | 会员 API |
| src/miniprogram/pages/member/index.vue | 会员中心：等级卡片、余额、权益、充值方案 |
| src/miniprogram/pages/member/recharge-records.vue | 充值记录：列表 + 下拉刷新 |

<!-- 每创建一个新文件，在此追加记录 -->
