# 渔乐（yule-go）

以渔具实体店为载体的周末短途垂钓旅行数字化运营系统。

> 依托线下渔具门店，打造"零售 + 短途旅行"双盈利模式。每个门店是一个独立的"超级门店"，用户有主场店但不被锁死。

## 产品定位

```
用户打开小程序
    │
    ├── 有主场店？ ──→ 门店首页（私域体验）
    │                    ├── 老板信息 + 信任背书
    │                    ├── 本周活动（本店线路+团期）
    │                    └── 我的订单
    │
    └── 没有/新用户 ──→ 平台发现页（附近门店、热门活动）
                          └── 进入门店 → 自动记录"去过的店"
```

**核心理念：** 门店是信任单元（老板IP + 实体背书），平台是发现通道。80% 流量来自老客复购，20% 来自平台发现。

## 功能模块

| 模块 | 说明 | 核心能力 |
|------|------|----------|
| 团期管理 | 后台创建/编辑团期，前端展示 | 线路配置、排期、成团人数 |
| 用户预约 | 选线路 → 填信息 → 下单支付 | 微信登录、微信支付 |
| 会员充值 | 三档充值、余额抵扣、折扣 | 会员等级、消费累计 |
| 装备租赁 | 下单时勾选租赁项 | 渔具租赁管理 |
| 老带新裂变 | 邀请码、新客立减、老客返现 | 分享传播、拉新奖励 |
| 管理后台 | 团期/订单/客户/财务统一管理 | PC 端 Vue3 + Element Plus |
| 门店管理 | 多门店独立运营 | 门店详情、老板信息、钓场关联 |

## 技术栈

**后端：** Go + Gin + MySQL 8.0 + Redis

**前端：** Vue3 + uni-app（微信小程序）· Vue3 + Element Plus（管理后台）

**基础设施：** Docker · Nginx 反向代理 · JWT 认证

**外部服务：** 微信支付 · 微信登录 · OSS 对象存储

## 架构概览

```
┌─────────────────────────────────────────────────┐
│  微信小程序 (uni-app + Vue3)  │  管理后台 (PC)   │
└──────────────┬──────────────────────┬────────────┘
               │                      │
               ▼                      ▼
┌─────────────────────────────────────────────────┐
│              Nginx (SSL + 路由分发)              │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│            Go API Server (Gin)                   │
│  用户 │ 团期 │ 订单 │ 支付/会员 │ 裂变 │ 管理    │
└────────┬──────────────────────┬─────────────────┘
         │                      │
         ▼                      ▼
    MySQL 8.0               Redis
    (主数据存储)            (缓存/会话)
```

## 项目结构

```
yule-go/
├── src/server/              # Go 后端
│   ├── main.go              # 入口
│   ├── config/              # 配置管理
│   ├── router/              # 路由定义（用户、团期、订单、裂变、管理等）
│   ├── handler/             # 请求处理
│   ├── repository/          # 数据访问层
│   ├── model/               # 数据模型
│   ├── middleware/           # 中间件（认证、CORS、日志）
│   └── scheduler/           # 定时任务（订单超时等）
├── docs/                    # 项目文档
│   ├── requirements-v4.md   # 需求规格书 v4.0
│   ├── architecture.md      # 技术架构
│   ├── api.md               # API 接口定义
│   ├── database.md          # 数据库设计
│   ├── local-setup.md       # 本地开发环境搭建
│   └── product-intro.md     # 产品介绍
├── migrations/              # SQL 迁移脚本
├── docker/                  # Docker 部署配置
├── Makefile                 # 构建命令
└── .env.example             # 环境变量模板
```

## 快速开始

### 环境要求

- Go 1.21+
- MySQL 8.0+
- Redis 7+

### 1. 克隆与配置

```bash
git clone https://github.com/yongc2025/yule-go.git
cd yule-go
cp .env.example .env
# 编辑 .env，配置数据库密码、JWT 密钥等
```

### 2. 初始化数据库

```bash
mysql -u root -p yule < migrations/001_init.sql
mysql -u root -p yule < migrations/002_admin_must_change_password.sql
mysql -u root -p yule < migrations/003_fishing_spots.sql
```

### 3. 启动后端

```bash
# 查看所有可用命令
make help

# 编译
make build

# 运行
make run

# 运行测试
make test
```

### 4. Docker 部署

```bash
cd docker
cp .env.example .env
# 编辑 .env
docker compose up -d
```

> ⚠️ 首次开发请先阅读：[本地开发环境搭建指南](docs/local-setup.md)（含 Windows 踩坑记录）

## API 接口

基于 RESTful 设计，JWT Bearer Token 认证，统一响应格式 `{ code, message, data }`。

| 模块 | 主要端点 |
|------|----------|
| 认证 | `POST /api/v1/auth/wechat-login` |
| 用户 | `GET/PUT /api/v1/user/profile` |
| 线路 | `GET /api/v1/routes` |
| 团期 | `GET /api/v1/schedules` |
| 订单 | `POST /api/v1/orders` · `GET /api/v1/orders` |
| 门店 | `GET /api/v1/shops` |
| 裂变 | `GET /api/v1/referral` |

完整 API 文档：[docs/api.md](docs/api.md)

## 目标客群

| 客群 | 年龄 | 核心需求 |
|------|------|----------|
| 垂钓爱好者 | 25-60 | 省心垂钓体验，找到好钓场 |
| 亲子家庭 | 28-45 | 安全、亲子互动、自然体验 |
| 退休中老年 | 55+ | 同龄人结伴、低成本、休闲出行 |

## 文档

- [需求规格书 v4.0](docs/requirements-v4.md) — 完整产品需求定义
- [技术架构](docs/architecture.md) — 后端架构设计
- [API 接口定义](docs/api.md) — 全部 API 端点
- [数据库设计](docs/database.md) — 表结构与关系
- [本地开发环境搭建](docs/local-setup.md) — 含 Windows 踩坑记录
- [产品介绍](docs/product-intro.md) — 面向用户的产品说明
- [v2 路线图](docs/v2-roadmap.md) — 未来规划

## 联系方式

- 邮箱：yongc20250401@gmail.com

## License

Private
