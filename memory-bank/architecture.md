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

<!-- 每创建一个新文件，在此记录其职责 -->
<!-- 格式示例：
| src/server/main.go | 程序入口，初始化 Gin + DB + 路由 |
| src/server/model/schedule.go | Schedule 数据模型，GORM 标签 |
-->
