# 需求规格书 — yule-go（终版）

> **版本**：v3.0
> **日期**：2026-05-06
> **状态**：需求冻结，可进入开发
> **本文档是项目需求的唯一真相源（Single Source of Truth）**

---

## 一、项目背景

线下渔具门店经营单一，仅靠渔具零售盈利，同质化严重、利润微薄、客户粘性低。
城市居民周末微度假需求爆发，本地缺少钓鱼露营专属组团服务。

**核心机会**：依托现有渔具实体店，打造"零售 + 短途旅行"双盈利模式。

**产品定位**：垂钓领域的 GetYourGuide——连接钓场（供给）与钓鱼爱好者（需求），由商家（渔具店等）组织出行服务的预约平台。

```
钓场（公共资源，平台维护）
  │
  ├── 商家 A（如：渔乐渔具店）创建的线路
  ├── 商家 B（如：钓友之家）创建的线路    ← V2 开放
  └── 商家 C ...                          ← V2 开放
  │
  └── 用户浏览 → 预约 → 支付 → 出行 → 核销
```

**MVP 策略**：架构按平台设计，上线时只开放一个商家（渔乐自己），后续无需重构即可扩展多商家。

---

## 二、目标客群

| 客群 | 年龄 | 特征 | 核心需求 | 决策特点 |
|:-----|:-----|:-----|:---------|:---------|
| 垂钓爱好者 | 25-60 | 男性为主，周末时间充裕 | 省心垂钓体验，找到好钓场 | 对鱼情敏感，复购率高，口碑传播主力 |
| 亲子家庭 | 28-45 | 携带 5-14 岁儿童 | 安全、亲子互动、自然体验 | 价格敏感度低，决策者通常是妈妈 |
| 退休中老年 | 55+ | 时间自由，偏好慢节奏 | 同龄人结伴、低成本、休闲出行 | 手机操作弱，可能需子女代下单 |

---

## 三、用户角色

### 3.1 客户端（小程序）

**① 垂钓爱好者（核心付费群体）**
- **核心诉求**：找到好钓场、知道有什么鱼、省心出行
- **关键功能**：浏览钓场（按距离/鱼种筛选）、查看线路详情、快速复购
- **特点**：有经验，对钓位质量敏感，是口碑传播的主力

**② 亲子家庭**
- **核心诉求**：安全、孩子能玩、大人放松
- **关键功能**：看套餐包含什么、儿童安全说明、亲子活动详情
- **特点**：价格敏感度低但对体验要求高，决策者通常是妈妈

**③ 退休中老年**
- **核心诉求**：有人陪、不累、便宜
- **关键功能**：大字体、简化流程、电话客服
- **特点**：手机操作能力弱，可能需要子女帮忙下单

### 3.2 运营端（管理后台）

**④ 平台管理员**
- **职责**：平台运营、钓场信息维护、全局数据管控
- **核心诉求**：看全局数据、管控平台质量
- **MVP 说明**：与商家是同一个人（渔乐老板），系统预留分离能力

**⑤ 商家（渔具店）**
- **职责**：创建线路、管理团期、处理订单、装备管理
- **核心诉求**：获客、排期、营收
- **关键功能**：线路 CRUD、团期管理、订单处理、退款审核

**⑥ 领队（带团人）**
- **职责**：带团出行、核销确认
- **核心诉求**：看名单、确认谁到了
- **关键功能**：查看本期名单、扫码/手动核销、标记出发/返程
- **特点**：户外用手机，网络可能不好，操作要极简

### 3.3 角色关系

```
                    ┌─────────────┐
                    │  平台管理员   │  ← 看数据、管钓场、审商家
                    └──────┬──────┘
                           │ 管理
                    ┌──────▼──────┐
                    │   商家(渔具店)│  ← 创建线路、排期、处理订单
                    └──────┬──────┘
                           │ 派遣
                    ┌──────▼──────┐
                    │  领队(带团)   │  ← 出行当天：名单、核销
                    └─────────────┘

  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ 垂钓爱好者 │  │ 亲子家庭  │  │ 退休中老年 │  ← 三类客户
  └──────────┘  └──────────┘  └──────────┘
```

---

## 四、核心业务模型

### 4.1 三方关系

```
钓场（fishing_spots）    公共资源，平台维护
  │
  ├── 商家（merchants）    入驻的渔具店/组织方
  │     │
  │     ├── 线路（routes）    商家创建的出行产品
  │     │     │
  │     │     └── 团期（schedules）  某日期的出行计划
  │     │           │
  │     │           └── 订单（orders）  用户预约记录
  │     │
  │     └── 装备（rental_items）  商家提供的租赁装备
  │
  └── 用户（users）    平台用户，跨商家通用
```

### 4.2 核心产品（MVP）

#### 四大出行线路

| 产品 | 价格 | 包含项目 |
|:-----|:-----|:---------|
| 成人钓友单日垂钓团 | 128 元/人 | 往返车费、专属钓点、基础饵料、领队服务、饮用水、出行保险 |
| 垂钓+露营一日套餐 | 198 元/人 | 交通、钓点、露营天幕桌椅、基础渔具、简餐、保险 |
| 亲子出游套餐 | 238 元/一大一小 | 交通、儿童趣味钓鱼、亲子游戏、露营野餐、全程陪同、保险 |
| 退休专属慢游单日团 | 98 元/人 | 往返接送、休闲观光、轻度垂钓、农家清淡午餐、全程陪同、保险 |

#### 装备租赁

| 装备 | 价格 |
|:-----|:-----|
| 鱼竿套装 | 30 元/套 |
| 帐篷 | 50 元/顶 |
| 天幕 | 40 元/个 |
| 折叠桌椅 | 25 元/套 |

#### 会员充值体系

| 档位 | 渔具折扣 | 旅行立减 | 赠送权益 |
|:-----|:---------|:---------|:---------|
| 200 元 | 9.5 折 | 每次立减 10 元 | 钓鱼团优惠券 1 张 |
| 500 元 | 9 折 | 每次立减 20 元 | 装备免费租赁 3 次 |
| 1000 元（主推） | 8.5 折 | 每次立减 30 元 | 免费单日出行名额 1 个 |

#### 老带新裂变

- 老客户返现/下次参团立减 20 元
- 新客户首单立减 15 元

---

## 五、数据模型

### 5.1 ER 关系

```
users ────────────────────────────────────┐
  │                                       │
  ├── orders ── N:1 ── schedules ── N:1 ── routes ── N:1 ── merchants
  │     │                    │                    │
  │     ├── order_rentals    │                    └── N:1 ── fishing_spots
  │     └── checkins         │
  │                          │
  ├── recharges              └── weather_status
  └── referrals
                                    admins ── N:1 ── merchants
```

### 5.2 钓场表（fishing_spots）— 平台公共资源

```sql
CREATE TABLE fishing_spots (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL COMMENT '钓场名称',
  address        VARCHAR(255) NOT NULL COMMENT '详细地址',
  latitude       DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
  longitude      DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
  description    TEXT COMMENT '钓场介绍',
  fish_types     JSON COMMENT '主要鱼种',
  facilities     JSON COMMENT '设施列表',
  images         JSON COMMENT '图片URL列表',
  cover_image    VARCHAR(512) DEFAULT '' COMMENT '封面图',
  contact_name   VARCHAR(64) DEFAULT '' COMMENT '联系人',
  contact_phone  VARCHAR(20) DEFAULT '' COMMENT '联系电话',
  business_hours VARCHAR(50) DEFAULT '' COMMENT '营业时间',
  status         TINYINT DEFAULT 1 COMMENT '0=停用 1=营业中',
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钓场表';
```

### 5.3 商家表（merchants）

```sql
CREATE TABLE merchants (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL COMMENT '商家名称',
  logo          VARCHAR(512) DEFAULT '' COMMENT 'Logo',
  description   TEXT COMMENT '商家介绍',
  address       VARCHAR(255) DEFAULT '' COMMENT '门店地址',
  contact_name  VARCHAR(64) NOT NULL COMMENT '联系人',
  contact_phone VARCHAR(20) NOT NULL COMMENT '联系电话',
  status        TINYINT DEFAULT 1 COMMENT '0=禁用 1=启用',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商家表';
```

### 5.4 线路表（routes）

```sql
CREATE TABLE routes (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id          BIGINT UNSIGNED NOT NULL COMMENT '所属商家',
  fishing_spot_id      BIGINT UNSIGNED DEFAULT NULL COMMENT '关联钓场',
  name                 VARCHAR(100) NOT NULL COMMENT '线路名称',
  type                 VARCHAR(20) NOT NULL COMMENT '类型：fishing/camping/family/senior',
  price                DECIMAL(10,2) NOT NULL COMMENT '成人价格',
  child_price          DECIMAL(10,2) DEFAULT 0.00 COMMENT '儿童价格',
  description          TEXT COMMENT '线路描述',
  highlights           JSON COMMENT '亮点标签',
  itinerary            TEXT COMMENT '行程安排（JSON）',
  includes             JSON COMMENT '包含项目',
  excludes             JSON COMMENT '不包含项目',
  cover_image          VARCHAR(512) DEFAULT '' COMMENT '封面图',
  images               JSON COMMENT '图片列表',
  max_slots            INT UNSIGNED DEFAULT 30 COMMENT '每团最大人数',
  min_participants     INT UNSIGNED DEFAULT 1 COMMENT '最少成团人数',
  duration             VARCHAR(20) DEFAULT '一日游' COMMENT '行程时长',
  departure_point      VARCHAR(255) DEFAULT '' COMMENT '集合地点',
  departure_latitude   DECIMAL(10,7) DEFAULT NULL,
  departure_longitude  DECIMAL(10,7) DEFAULT NULL,
  departure_time       VARCHAR(20) DEFAULT '' COMMENT '出发时间',
  return_time          VARCHAR(20) DEFAULT '' COMMENT '返回时间',
  insurance_included   TINYINT DEFAULT 1 COMMENT '是否含保险',
  cancel_policy        JSON COMMENT '取消政策',
  status               TINYINT DEFAULT 1 COMMENT '0=下架 1=上架',
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_merchant (merchant_id),
  INDEX idx_spot (fishing_spot_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id),
  FOREIGN KEY (fishing_spot_id) REFERENCES fishing_spots(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线路表';
```

### 5.5 团期表（schedules）

```sql
CREATE TABLE schedules (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id       BIGINT UNSIGNED NOT NULL COMMENT '线路ID',
  merchant_id    BIGINT UNSIGNED NOT NULL COMMENT '商家ID（冗余）',
  trip_date      DATE NOT NULL COMMENT '出行日期',
  max_slots      INT UNSIGNED NOT NULL COMMENT '本团最大人数',
  booked_slots   INT UNSIGNED DEFAULT 0 COMMENT '已报名人数',
  guide_name     VARCHAR(64) DEFAULT '' COMMENT '领队姓名',
  guide_phone    VARCHAR(20) DEFAULT '' COMMENT '领队电话',
  weather_status TINYINT DEFAULT 0 COMMENT '0=未确认 1=正常 2=改期 3=取消',
  weather_note   VARCHAR(255) DEFAULT '' COMMENT '天气备注',
  status         TINYINT DEFAULT 1 COMMENT '0=取消 1=报名中 2=已满 3=已出发 4=已完成',
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_route_date (route_id, trip_date),
  INDEX idx_merchant (merchant_id),
  INDEX idx_trip_date (trip_date),
  INDEX idx_status (status),
  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团期表';
```

### 5.6 用户表（users）

```sql
CREATE TABLE users (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  openid         VARCHAR(64) NOT NULL UNIQUE COMMENT '微信openid',
  unionid        VARCHAR(64) DEFAULT NULL COMMENT '微信unionid',
  nickname       VARCHAR(64) DEFAULT '' COMMENT '昵称',
  avatar         VARCHAR(512) DEFAULT '' COMMENT '头像URL',
  phone          VARCHAR(20) DEFAULT NULL COMMENT '手机号（加密存储）',
  member_level   TINYINT UNSIGNED DEFAULT 0 COMMENT '0=普通 1=银卡 2=金卡 3=钻石',
  balance        DECIMAL(10,2) DEFAULT 0.00 COMMENT '账户余额',
  total_recharge DECIMAL(10,2) DEFAULT 0.00 COMMENT '累计充值',
  invite_code    VARCHAR(16) NOT NULL UNIQUE COMMENT '邀请码',
  invited_by     BIGINT UNSIGNED DEFAULT NULL COMMENT '邀请人ID',
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_invite_code (invite_code),
  INDEX idx_invited_by (invited_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### 5.7 订单表（orders）

```sql
CREATE TABLE orders (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_no          VARCHAR(32) NOT NULL UNIQUE COMMENT '订单编号',
  user_id           BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  schedule_id       BIGINT UNSIGNED NOT NULL COMMENT '团期ID',
  merchant_id       BIGINT UNSIGNED NOT NULL COMMENT '商家ID（冗余）',
  route_id          BIGINT UNSIGNED NOT NULL COMMENT '线路ID（冗余）',
  fishing_spot_id   BIGINT UNSIGNED DEFAULT NULL COMMENT '钓场ID（冗余）',
  adults            INT UNSIGNED DEFAULT 1 COMMENT '成人数',
  children          INT UNSIGNED DEFAULT 0 COMMENT '儿童数',
  trip_fee          DECIMAL(10,2) NOT NULL COMMENT '团费小计',
  rental_fee        DECIMAL(10,2) DEFAULT 0.00 COMMENT '租赁费小计',
  discount_amount   DECIMAL(10,2) DEFAULT 0.00 COMMENT '折扣金额',
  balance_used      DECIMAL(10,2) DEFAULT 0.00 COMMENT '余额抵扣',
  total_amount      DECIMAL(10,2) NOT NULL COMMENT '实付金额',
  contact_name      VARCHAR(64) NOT NULL COMMENT '联系人',
  contact_phone     VARCHAR(20) NOT NULL COMMENT '联系电话',
  checkin_code      VARCHAR(16) DEFAULT NULL COMMENT '核销码',
  payment_status    TINYINT DEFAULT 0 COMMENT '0=未支付 1=已支付 2=已退款',
  payment_time      DATETIME DEFAULT NULL,
  wx_transaction_id VARCHAR(64) DEFAULT NULL,
  status            TINYINT DEFAULT 0 COMMENT '0=待支付 1=已支付 2=已取消 3=退款中 4=已退款 5=已核销 6=已完成',
  cancel_reason     VARCHAR(255) DEFAULT '',
  refund_amount     DECIMAL(10,2) DEFAULT 0.00,
  refund_time       DATETIME DEFAULT NULL,
  expire_at         DATETIME DEFAULT NULL COMMENT '支付过期时间',
  remark            VARCHAR(500) DEFAULT '',
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_schedule (schedule_id),
  INDEX idx_merchant (merchant_id),
  INDEX idx_order_no (order_no),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';
```

### 5.8 订单租赁明细表（order_rentals）

```sql
CREATE TABLE order_rentals (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id       BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  rental_item_id BIGINT UNSIGNED NOT NULL COMMENT '租赁项ID',
  quantity       INT UNSIGNED DEFAULT 1,
  unit_price     DECIMAL(10,2) NOT NULL,
  subtotal       DECIMAL(10,2) NOT NULL,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (rental_item_id) REFERENCES rental_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单租赁明细';
```

### 5.9 装备租赁项表（rental_items）

```sql
CREATE TABLE rental_items (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id  BIGINT UNSIGNED NOT NULL COMMENT '所属商家',
  name         VARCHAR(100) NOT NULL COMMENT '装备名称',
  price_per_day DECIMAL(10,2) NOT NULL COMMENT '每日租金',
  stock        INT UNSIGNED DEFAULT 10 COMMENT '库存数量',
  status       TINYINT DEFAULT 1 COMMENT '0=下架 1=上架',
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_merchant (merchant_id),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='装备租赁项';
```

### 5.10 核销表（checkins）

```sql
CREATE TABLE checkins (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id       BIGINT UNSIGNED NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  schedule_id    BIGINT UNSIGNED NOT NULL,
  checkin_code   VARCHAR(16) NOT NULL,
  status         TINYINT DEFAULT 0 COMMENT '0=未核销 1=已核销 2=已过期',
  checked_in_at  DATETIME DEFAULT NULL,
  checked_by     BIGINT UNSIGNED DEFAULT NULL COMMENT '核销人（admin_id）',
  checkin_method TINYINT DEFAULT 1 COMMENT '1=扫码 2=手动',
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_code (checkin_code),
  INDEX idx_order (order_id),
  INDEX idx_schedule (schedule_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='核销表';
```

### 5.11 充值记录表（recharges）

```sql
CREATE TABLE recharges (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id           BIGINT UNSIGNED NOT NULL,
  amount            DECIMAL(10,2) NOT NULL COMMENT '充值金额',
  gift_amount       DECIMAL(10,2) DEFAULT 0.00 COMMENT '赠送金额',
  payment_status    TINYINT DEFAULT 0 COMMENT '0=未支付 1=已支付',
  wx_transaction_id VARCHAR(64) DEFAULT NULL,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='充值记录';
```

### 5.12 裂变记录表（referrals）

```sql
CREATE TABLE referrals (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inviter_id       BIGINT UNSIGNED NOT NULL COMMENT '邀请人',
  invitee_id       BIGINT UNSIGNED NOT NULL COMMENT '被邀请人',
  invitee_order_id BIGINT UNSIGNED DEFAULT NULL COMMENT '触发奖励的订单',
  reward_amount    DECIMAL(10,2) DEFAULT 20.00 COMMENT '邀请人奖励',
  new_user_discount DECIMAL(10,2) DEFAULT 15.00 COMMENT '新用户立减',
  status           TINYINT DEFAULT 0 COMMENT '0=待触发 1=已奖励 2=已失效',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_invitee (invitee_id),
  INDEX idx_inviter (inviter_id),
  FOREIGN KEY (inviter_id) REFERENCES users(id),
  FOREIGN KEY (invitee_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='裂变记录';
```

### 5.13 管理员表（admins）

```sql
CREATE TABLE admins (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id   BIGINT UNSIGNED DEFAULT NULL COMMENT '所属商家（NULL=平台管理员）',
  username      VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone         VARCHAR(20) DEFAULT '',
  real_name     VARCHAR(64) DEFAULT '',
  role          VARCHAR(20) DEFAULT 'admin' COMMENT 'super_admin/admin/staff',
  status        TINYINT DEFAULT 1 COMMENT '0=禁用 1=启用',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_merchant (merchant_id),
  FOREIGN KEY (merchant_id) REFERENCES merchants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';
```

---

## 六、功能需求

### 6.1 小程序端（客户）

| 模块 | 功能 | 优先级 | 说明 |
|:-----|:-----|:-------|:-----|
| 微信登录 | 一键登录、获取手机号 | P0 | 整个小程序的入口 |
| 首页 | 附近钓场、本周团期、热门线路 | P0 | GetYourGuide 信息架构 |
| 钓场列表 | 按距离排序、按鱼种/设施筛选 | P0 | 钓场是发现入口 |
| 钓场详情 | 地址、鱼种、设施、图片、关联线路 | P0 | 决策关键页 |
| 线路详情 | 行程安排、费用包含/不包含、集合地点、取消政策 | P0 | GetYourGuide 结构 |
| 在线预约 | 选日期 → 填人数 → 勾选装备 → 支付 | P0 | 核心转化流程 |
| 支付 | 微信支付 | P0 | 交易闭环 |
| 我的订单 | 订单列表、详情、核销码展示 | P0 | 订单管理 |
| 核销码 | 展示 QR 码，出行当天出示 | P0 | 服务交付凭证 |
| 会员中心 | 余额查询、会员等级、充值 | P0 | 锁客 |
| 装备租赁 | 下单时勾选，费用合并 | P0 | 已有 |
| 邀请好友 | 邀请码、返现 | P0 | 已有 |
| 取消/退款 | 申请取消、查看退款状态 | P0 | 闭环 |
| 出行须知 | 免责声明、天气政策、保险说明 | P1 | 合规 |

### 6.2 管理后台（平台管理 + 商家运营）

| 模块 | 功能 | 优先级 | 说明 |
|:-----|:-----|:-------|:-----|
| 登录 | 管理员登录、首次改密 | P0 | 已有 |
| 钓场管理 | CRUD、图片上传 | P0 | 平台维护公共资源 |
| 线路管理 | CRUD、关联钓场、设置取消政策 | P0 | 商家核心操作 |
| 团期管理 | 创建/编辑/取消/批量创建 | P0 | 已有，需增强 |
| 订单管理 | 列表、详情、退款审核、导出 | P0 | 需增强 |
| 核销 | 扫码/手动输入核销码、实时统计 | P0 | 新增 |
| 装备管理 | CRUD、库存 | P0 | 需增强 |
| 客户管理 | 列表、详情、会员等级 | P1 | 需增强 |
| 财务统计 | 日/周/月营收、按线路/钓场统计 | P1 | 需增强 |
| 数据看板 | 今日数据、趋势图 | P1 | 新增 |
| 商家管理 | 商家入驻审核 | P2 | MVP 不开放 |

---

## 七、预约流程

### 7.1 用户端完整旅程

```
① 打开小程序 → 微信登录授权
② 首页浏览 → 附近钓场 / 本周团期 / 热门线路
③ 点击钓场 → 钓场详情（鱼种、设施、图片）
④ 点击线路 → 线路详情（行程、包含、集合地、取消政策）
⑤ 点击预约 → 选日期 → 选人数 → 勾选装备 → 填联系信息
⑥ 确认支付 → 微信支付 → 获得核销码
⑦ 出行当天 → 打开核销码 → 领队扫码确认
⑧ 出行结束 → 订单自动完成 → 邀请好友返现
```

### 7.2 线路详情页结构（GetYourGuide 模式）

```
① 标题 + 钓场名 + 价格
② 精选图片轮播
③ 亮点 Highlights（3-5 个标签）
④ 行程安排 Itinerary（时间线形式）
⑤ 费用包含 / 不包含 Includes & Excludes
⑥ 集合地点 Meeting point（含地图 + 导航跳转）
⑦ 取消政策 Cancellation policy
⑧ 出行须知 Know before you go
⑨ 钓场信息（关联钓场的简介、鱼种、设施）
```

---

## 八、订单状态机

### 8.1 状态定义

```
         支付成功           出行当天           核销完成
PENDING ───────→ PAID ───────→ EN_ROUTE ───────→ COMPLETED
  │                │                                    ↑
  │ 超时/取消       │ 申请退款                            │ 团期结束自动完成
  ↓                ↓                                    │
CANCELLED    REFUNDING ───→ REFUNDED              ─────┘
```

| 状态码 | 状态名 | 说明 | 触发条件 |
|:-------|:-------|:-----|:---------|
| 0 | PENDING | 待支付 | 下单创建 |
| 1 | PAID | 已支付 | 微信支付回调成功 |
| 2 | CANCELLED | 已取消 | 用户主动取消 / 超时未支付（15分钟） |
| 3 | REFUNDING | 退款中 | 用户申请退款，待审核 |
| 4 | REFUNDED | 已退款 | 退款到账 |
| 5 | EN_ROUTE | 出行中 | 领队标记出发 |
| 6 | COMPLETED | 已完成 | 核销完成 / 团期结束自动完成 |

### 8.2 状态流转规则

| 当前状态 | 可转到 | 触发方 | 说明 |
|:---------|:-------|:-------|:-----|
| PENDING | PAID | 系统 | 支付成功回调 |
| PENDING | CANCELLED | 用户/系统 | 用户取消或超时（15分钟） |
| PAID | EN_ROUTE | 管理员 | 领队标记出发 |
| PAID | REFUNDING | 用户 | 出行前申请退款 |
| PAID | CANCELLED | 管理员 | 管理员取消团期 |
| EN_ROUTE | COMPLETED | 系统/管理员 | 核销完成 |
| REFUNDING | REFUNDED | 管理员 | 审核通过，退款到账 |
| REFUNDING | PAID | 管理员 | 审核驳回，恢复已支付 |

### 8.3 取消退款政策

线路级别可配置，默认策略：

| 取消时间 | 退款比例 | 说明 |
|:---------|:---------|:-----|
| 出行前 72 小时+ | 100% 全退 | 提前充分 |
| 出行前 24-72 小时 | 50% | 扣一半作为占位费 |
| 出行前 24 小时内 | 不退 | 已产生成本 |
| 天气/不可抗力 | 100% 全退 | 非用户原因 |

---

## 九、核销流程

### 9.1 核销码生成

- 支付成功后自动生成 6-8 位数字核销码
- 存入 checkins 表 + orders 表冗余字段
- 小程序"我的订单"展示 QR 二维码

### 9.2 核销操作

```
领队端（管理后台）：
① 选择本期团期 → 进入核销页面
② 扫描用户二维码 / 手动输入核销码
③ 系统校验（订单状态、是否已核销、是否在有效期内）
④ 确认核销 → 订单状态更新 → 实时到场统计
```

### 9.3 核销码生命周期

- 生成时机：支付成功时
- 有效期：团期当天
- 过期处理：团期次日自动失效
- 幂等性：同一订单多次核销只生效一次

---

## 十、API 接口清单

### 10.1 用户认证

```
POST   /api/v1/auth/wx-login          # 微信登录
POST   /api/v1/auth/get-phone         # 获取手机号
PUT    /api/v1/user/profile           # 更新用户信息
```

### 10.2 钓场

```
GET    /api/v1/spots                  # 钓场列表
GET    /api/v1/spots/:id              # 钓场详情
GET    /api/v1/spots/nearby           # 附近钓场（lat, lng, radius）
GET    /api/v1/spots/:id/routes       # 钓场关联的线路
```

### 10.3 线路

```
GET    /api/v1/routes                 # 线路列表（可按钓场、类型筛选）
GET    /api/v1/routes/:id             # 线路详情（含钓场、取消政策）
```

### 10.4 团期

```
GET    /api/v1/schedules?week=xxx     # 按周查询团期
GET    /api/v1/schedules/:id          # 团期详情
```

### 10.5 订单

```
POST   /api/v1/orders                 # 创建订单
GET    /api/v1/orders                 # 用户订单列表
GET    /api/v1/orders/:order_no       # 订单详情（含核销码）
POST   /api/v1/orders/:order_no/cancel # 取消订单
GET    /api/v1/orders/:order_no/checkin-code  # 获取核销码/二维码
```

### 10.6 装备租赁

```
GET    /api/v1/rental-items           # 租赁项列表
```

### 10.7 会员

```
POST   /api/v1/member/recharge        # 充值
GET    /api/v1/member/info            # 会员信息
GET    /api/v1/member/recharge-records # 充值记录
```

### 10.8 裂变

```
GET    /api/v1/referral/info          # 邀请信息
GET    /api/v1/referral/records       # 邀请记录
```

### 10.9 管理后台

```
# 钓场管理
POST   /api/v1/admin/spots            # 创建钓场
GET    /api/v1/admin/spots            # 钓场列表
PUT    /api/v1/admin/spots/:id        # 编辑钓场
DELETE /api/v1/admin/spots/:id        # 删除钓场

# 线路管理
POST   /api/v1/admin/routes           # 创建线路
GET    /api/v1/admin/routes           # 线路列表
PUT    /api/v1/admin/routes/:id       # 编辑线路

# 团期管理
POST   /api/v1/admin/schedules        # 创建团期
PUT    /api/v1/admin/schedules/:id    # 编辑团期
PUT    /api/v1/admin/schedules/:id/cancel # 取消团期

# 订单管理
GET    /api/v1/admin/orders           # 订单列表
GET    /api/v1/admin/orders/:id       # 订单详情
POST   /api/v1/admin/orders/:id/refund # 退款审核

# 核销
POST   /api/v1/admin/checkin/scan     # 扫码核销
POST   /api/v1/admin/checkin/manual   # 手动核销
GET    /api/v1/admin/schedules/:id/checkins # 核销统计

# 装备管理
POST   /api/v1/admin/rental-items     # 创建租赁项
PUT    /api/v1/admin/rental-items/:id # 编辑租赁项

# 管理员认证
POST   /api/v1/admin/login            # 管理员登录
POST   /api/v1/admin/change-password  # 修改密码

# 定时任务
POST   /api/v1/admin/orders/cancel-expired # 手动触发超时取消
```

---

## 十一、非功能需求

| 维度 | 要求 |
|:-----|:-----|
| 性能 | API 响应 < 500ms，支持 100 并发 |
| 可用性 | 预约流程不超过 5 步 |
| 安全 | 微信支付 V3 RSA 签名、敏感数据加密、JWT 认证 |
| 兼容性 | 微信小程序基础库 2.20+ |
| 可维护性 | 代码注释 > 30%，关键接口有文档 |
| 可扩展性 | 数据模型支持多商家，MVP 只开一个 |

---

## 十二、技术架构

```
┌─────────────────────────────────────────────────────┐
│                     客户端                            │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │  微信小程序        │  │  管理后台 (PC)            │ │
│  │  uni-app + Vue3   │  │  Vue3 + Element Plus     │ │
│  └────────┬─────────┘  └──────────────┬───────────┘ │
└───────────┼───────────────────────────┼─────────────┘
            │                           │
            ▼                           ▼
┌─────────────────────────────────────────────────────┐
│                   Go API Server (Gin)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 用户模块  │ │ 钓场模块  │ │ 商家模块  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 线路模块  │ │ 团期模块  │ │ 订单模块  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ 支付模块  │ │ 核销模块  │ │ 装备模块  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└────────┬──────────────────────┬─────────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│   MySQL 8.0     │    │     Redis       │
│   (主数据存储)    │    │  (缓存/会话/GEO) │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│           外部服务                        │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ 微信支付  │ │ 微信登录  │ │  OSS    │ │
│  └──────────┘ └──────────┘ └─────────┘ │
└─────────────────────────────────────────┘
```

### 分层架构

```
Handler（入参校验 + 响应封装）
    ↓ 调用
Service（业务逻辑 + 事务管理）
    ↓ 调用
Repository（数据库 CRUD + SQL 构建）
    ↓ 依赖
Model（数据结构定义 + GORM 标签）
```

---

## 十三、MVP 任务清单

### 第一阶段：核心链路（约 18 天）

| # | 任务 | 估时 | 说明 |
|:--|:-----|:-----|:-----|
| 1 | 微信登录 + JWT | 2 天 | 小程序用户身份 |
| 2 | 钓场 CRUD（管理后台） | 1.5 天 | 平台维护钓场信息 |
| 3 | 商家表 + 线路改造 | 2.5 天 | 加 merchant_id，线路关联钓场，线路 CRUD |
| 4 | 微信支付 | 3 天 | 统一下单 + 回调 + 充值 + 退款 |
| 5 | 核销流程 | 2 天 | 核销码 + 扫码核销 + 统计 |
| 6 | 订单状态机 + 退款 | 2 天 | 完整状态 + 退款审核 + 微信退款 |
| 7 | 小程序首页 + 钓场 | 2 天 | 首页、附近钓场、线路详情 |
| 8 | 预约流程改造 | 1.5 天 | 对接新数据模型 + 核销码展示 |
| 9 | 管理后台增强 | 1.5 天 | 订单详情/退款审核/核销页/导出 |

### 第二阶段：体验完善（约 10 天）

| # | 任务 | 估时 |
|:--|:-----|:-----|
| 10 | 消息通知（订阅消息） | 2 天 |
| 11 | 团期批量创建 | 1 天 |
| 12 | 订单导出 Excel | 1 天 |
| 13 | 集合地导航 | 0.5 天 |
| 14 | Dashboard + 财务报表 | 3 天 |
| 15 | 客户管理增强 | 1.5 天 |
| 16 | 天气/改期流程 | 1 天 |

---

## 十四、MVP 不做（明确排除）

- ❌ 商家入驻流程（V2）
- ❌ 结算分成（V2）
- ❌ 钓位选择（到了现场分配）
- ❌ 评价体系（V2）
- ❌ 数据看板（V1.5）
- ❌ 多城市连锁（先做单城）
- ❌ APP 原生（先做小程序）
- ❌ 赛事活动（V2）
- ❌ 水下监控（V2 考虑）
- ❌ 领队排班（线下先做）
- ❌ 同行优惠梯度（V2）
- ❌ 会员赠送权益（V2）

---

*文档结束。本文档是项目需求的唯一真相源，替代以下旧文档：*
- ~~docs/requirements.md（v1 原始需求）~~
- ~~docs/requirements-v2.md（v2 平台模式）~~
- ~~docs/requirements-gap-analysis.md（差距分析）~~
- ~~docs/missing-entities-analysis.md（实体缺失分析）~~
- ~~memory-bank/requirements.md（v1 副本）~~
