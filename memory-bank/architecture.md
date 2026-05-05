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

<!-- 每创建一个新文件，在此追加记录 -->
