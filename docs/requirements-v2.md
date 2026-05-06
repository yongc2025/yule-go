# 需求规格书 v2 — yule-go

> **版本**：v2.0（平台模式）
> **日期**：2026-05-06
> **核心变更**：从"自营渔具店"升级为"垂钓出行平台"，支持多商家入驻

---

## 一、产品定位

**渔乐 = 垂钓领域的 GetYourGuide**

连接钓场（供给）与钓鱼爱好者（需求），由商家（渔具店等）组织出行服务的预约平台。

```
钓场（公共资源）
  │
  ├── 商家 A（如：渔乐渔具店）创建的线路
  ├── 商家 B（如：钓友之家）创建的线路
  └── 商家 C ...
  │
  └── 用户浏览 → 预约 → 支付 → 出行 → 核销
```

**MVP 策略**：架构按平台设计，上线时只开放一个商家（渔乐自己），后续无需重构即可扩展多商家。

---

## 二、用户角色

### 2.1 客户端（小程序）

| 角色 | 年龄 | 核心诉求 | 关键特点 |
|:-----|:-----|:---------|:---------|
| 垂钓爱好者 | 25-60 | 找好钓场、省心出行、选好钓位 | 复购率高，口碑传播主力，对鱼情敏感 |
| 亲子家庭 | 28-45 | 安全、孩子能玩、大人放松 | 价格敏感度低，决策者通常是妈妈 |
| 退休中老年 | 55+ | 有人陪、不累、便宜 | 手机操作弱，可能需子女代下单 |

### 2.2 运营端（管理后台）

| 角色 | 职责 | 核心诉求 |
|:-----|:-----|:---------|
| 平台管理员 | 平台运营、钓场管理、商家审核 | 看全局数据、管控平台质量 |
| 商家（渔具店） | 创建线路、管理团期、处理订单 | 获客、排期、营收 |
| 领队 | 带团出行、核销确认 | 看名单、确认到场 |

> **MVP 说明**：平台管理员和商家是同一个人（渔乐老板），系统预留分离能力即可。

---

## 三、核心业务模型

### 3.1 三方关系

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

### 3.2 数据模型

#### 钓场表（fishing_spots）— 平台公共资源

```sql
CREATE TABLE fishing_spots (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL COMMENT '钓场名称',
  address        VARCHAR(255) NOT NULL COMMENT '详细地址',
  latitude       DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
  longitude      DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
  description    TEXT COMMENT '钓场介绍',
  fish_types     JSON COMMENT '主要鱼种，如["鲫鱼","鲤鱼","草鱼"]',
  facilities     JSON COMMENT '设施，如["停车场","卫生间","遮阳棚","餐饮"]',
  images         JSON COMMENT '图片URL列表',
  cover_image    VARCHAR(512) DEFAULT '' COMMENT '封面图',
  contact_name   VARCHAR(64) DEFAULT '' COMMENT '钓场联系人',
  contact_phone  VARCHAR(20) DEFAULT '' COMMENT '联系电话',
  business_hours VARCHAR(50) DEFAULT '' COMMENT '营业时间，如"06:00-18:00"',
  status         TINYINT DEFAULT 1 COMMENT '0=停用 1=营业中',
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钓场表（平台公共资源）';
```

#### 商家表（merchants）— 入驻的组织方

```sql
CREATE TABLE merchants (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL COMMENT '商家名称，如"渔乐渔具店"',
  logo          VARCHAR(512) DEFAULT '' COMMENT '商家Logo',
  description   TEXT COMMENT '商家介绍',
  address       VARCHAR(255) DEFAULT '' COMMENT '门店地址',
  contact_name  VARCHAR(64) NOT NULL COMMENT '联系人',
  contact_phone VARCHAR(20) NOT NULL COMMENT '联系电话',
  status        TINYINT DEFAULT 1 COMMENT '0=禁用 1=启用',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商家表';
```

#### 线路表（routes）— 商家创建的出行产品

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
  highlights           JSON COMMENT '亮点标签，如["包午餐","VIP钓位","亲子互动"]',
  itinerary            TEXT COMMENT '行程安排（结构化JSON）',
  includes             JSON COMMENT '包含项目',
  excludes             JSON COMMENT '不包含项目',
  cover_image          VARCHAR(512) DEFAULT '' COMMENT '封面图',
  images               JSON COMMENT '图片列表',
  max_slots            INT UNSIGNED DEFAULT 30 COMMENT '每团最大人数',
  min_participants     INT UNSIGNED DEFAULT 1 COMMENT '最少成团人数',
  duration             VARCHAR(20) DEFAULT '一日游' COMMENT '行程时长',
  departure_point      VARCHAR(255) DEFAULT '' COMMENT '集合地点',
  departure_latitude   DECIMAL(10,7) DEFAULT NULL COMMENT '集合地纬度',
  departure_longitude  DECIMAL(10,7) DEFAULT NULL COMMENT '集合地经度',
  departure_time       VARCHAR(20) DEFAULT '' COMMENT '出发时间，如"08:00"',
  return_time          VARCHAR(20) DEFAULT '' COMMENT '返回时间，如"17:00"',
  insurance_included   TINYINT DEFAULT 1 COMMENT '是否含保险',
  cancel_policy        JSON COMMENT '取消政策，如[{"hours":72,"refund_pct":100},{"hours":24,"refund_pct":50}]',
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

#### 团期表（schedules）— 某日期的出行计划

```sql
CREATE TABLE schedules (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id       BIGINT UNSIGNED NOT NULL COMMENT '线路ID',
  merchant_id    BIGINT UNSIGNED NOT NULL COMMENT '商家ID（冗余，方便查询）',
  trip_date      DATE NOT NULL COMMENT '出行日期',
  max_slots      INT UNSIGNED NOT NULL COMMENT '本团最大人数',
  booked_slots   INT UNSIGNED DEFAULT 0 COMMENT '已报名人数',
  guide_name     VARCHAR(64) DEFAULT '' COMMENT '领队姓名',
  guide_phone    VARCHAR(20) DEFAULT '' COMMENT '领队电话',
  weather_status TINYINT DEFAULT 0 COMMENT '天气状态：0=未确认 1=正常 2=改期 3=取消',
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

#### 订单表（orders）

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
  contact_name      VARCHAR(64) NOT NULL COMMENT '联系人姓名',
  contact_phone     VARCHAR(20) NOT NULL COMMENT '联系人电话',
  checkin_code      VARCHAR(16) DEFAULT NULL COMMENT '核销码',
  payment_status    TINYINT DEFAULT 0 COMMENT '0=未支付 1=已支付 2=已退款',
  payment_time      DATETIME DEFAULT NULL,
  wx_transaction_id VARCHAR(64) DEFAULT NULL COMMENT '微信支付交易号',
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

#### 核销表（checkins）

```sql
CREATE TABLE checkins (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id        BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  user_id         BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  schedule_id     BIGINT UNSIGNED NOT NULL COMMENT '团期ID',
  checkin_code    VARCHAR(16) NOT NULL COMMENT '核销码',
  status          TINYINT DEFAULT 0 COMMENT '0=未核销 1=已核销 2=已过期',
  checked_in_at   DATETIME DEFAULT NULL COMMENT '核销时间',
  checked_by      BIGINT UNSIGNED DEFAULT NULL COMMENT '核销人（admin_id）',
  checkin_method  TINYINT DEFAULT 1 COMMENT '1=扫码 2=手动',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_code (checkin_code),
  INDEX idx_order (order_id),
  INDEX idx_schedule (schedule_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='核销表';
```

#### 现有表保留（不变）

- `users` — 用户表（不变）
- `order_rentals` — 订单租赁明细（不变）
- `rental_items` — 装备租赁项（新增 merchant_id 字段）
- `recharges` — 充值记录（不变）
- `referrals` — 裂变记录（不变）
- `admins` — 管理员表（新增 merchant_id 字段，区分平台管理员和商家管理员）

---

## 四、功能需求

### 4.1 小程序端（客户）

| 模块 | 功能 | 优先级 | 说明 |
|:-----|:-----|:-------|:-----|
| 微信登录 | 一键登录、获取手机号 | P0 | 整个小程序的入口 |
| 首页 | 附近钓场、本周团期、热门线路 | P0 | GetYourGuide 信息架构 |
| 钓场列表 | 按距离排序、按鱼种/设施筛选 | P0 | 钓场是发现入口 |
| 钓场详情 | 地址、鱼种、设施、图片、关联线路 | P0 | 决策关键页 |
| 线路详情 | 行程安排、费用包含/不包含、集合地点、取消政策 | P0 | 抄 GetYourGuide 结构 |
| 在线预约 | 选日期 → 填人数 → 勾选装备 → 支付 | P0 | 核心转化流程 |
| 支付 | 微信支付 | P0 | 交易闭环 |
| 我的订单 | 订单列表、详情、核销码展示 | P0 | 订单管理 |
| 核销码 | 展示 QR 码，出行当天出示 | P0 | 服务交付凭证 |
| 会员中心 | 余额查询、会员等级、充值 | P0 | 锁客 |
| 装备租赁 | 下单时勾选，费用合并 | P0 | 已有 |
| 邀请好友 | 邀请码、返现 | P0 | 已有 |
| 取消/退款 | 申请取消、查看退款状态 | P0 | 闭环 |
| 出行须知 | 免责声明、天气政策、保险说明 | P1 | 合规 |

### 4.2 管理后台（平台管理 + 商家运营）

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
| 商家管理 | 商家入驻审核（V2） | P2 | MVP 不开放 |

### 4.3 订单状态机

```
         支付成功           出行当天           核销完成
PENDING ───────→ PAID ───────→ EN_ROUTE ───────→ COMPLETED
  │                │                                    ↑
  │ 超时/取消       │ 申请退款                            │ 团期结束自动完成
  ↓                ↓                                    │
CANCELLED    REFUNDING ───→ REFUNDED              ─────┘
```

| 状态 | 说明 | 触发 |
|:-----|:-----|:-----|
| PENDING(0) | 待支付 | 下单创建 |
| PAID(1) | 已支付 | 微信支付回调 |
| CANCELLED(2) | 已取消 | 用户取消 / 超时 |
| REFUNDING(3) | 退款中 | 用户申请退款 |
| REFUNDED(4) | 已退款 | 退款到账 |
| EN_ROUTE(5) | 出行中 | 领队标记出发 |
| COMPLETED(6) | 已完成 | 核销完成 / 团期结束自动 |

### 4.4 取消退款政策

线路级别可配置，默认策略：

| 取消时间 | 退款比例 |
|:---------|:---------|
| 出行前 72 小时+ | 100% 全退 |
| 出行前 24-72 小时 | 50% |
| 出行前 24 小时内 | 不退 |
| 天气/不可抗力 | 100% 全退 |

---

## 五、产品信息架构（GetYourGuide 模式）

### 5.1 线路详情页结构

```
① 标题 + 钓场名 + 价格
② 精选图片轮播
③ 亮点 Highlights（3-5 个标签）
④ 行程安排 Itinerary（时间线）
⑤ 费用包含 / 不包含
⑥ 集合地点 Meeting point（含地图 + 导航）
⑦ 取消政策 Cancellation policy
⑧ 出行须知 Know before you go
⑨ 钓场信息（关联钓场的简介、鱼种、设施）
```

### 5.2 预约流程

```
选线路 → 选日期 → 选人数 → 勾选装备 → 填联系信息 → 支付 → 获得核销码
```

---

## 六、砍掉的内容（相比 v1 分析）

| 砍掉的 | 理由 |
|:-------|:-----|
| ~~fishing_positions（钓位表）~~ | 钓位由领队现场分配，不需要系统管理 |
| ~~spot_grades（钓位等级）~~ | 同上 |
| ~~schedule_positions（团期钓位库存）~~ | 用名额控制（max_slots）就够了 |
| ~~钓位选择流程~~ | 不存在的场景 |
| ~~钓位管理页面~~ | 不需要 |
| ~~钓位热力图~~ | 没有钓位数据 |
| ~~用户位置表~~ | 用 Redis GEO 即可 |

---

## 七、MVP 任务清单（修订版）

### 第一阶段：核心链路（约 18 天）

| # | 任务 | 估时 | 说明 |
|:--|:-----|:-----|:-----|
| 1 | 微信登录 + JWT | 2 天 | 小程序用户身份 |
| 2 | 钓场 CRUD（管理后台） | 1.5 天 | 平台维护钓场信息 |
| 3 | 商家表 + 线路改造 | 1 天 | 加 merchant_id，线路关联钓场 |
| 4 | 线路管理 CRUD（管理后台） | 1.5 天 | 商家创建/编辑线路 |
| 5 | 微信支付 | 3 天 | 统一下单 + 回调 + 充值支付 |
| 6 | 核销流程 | 2 天 | 核销码 + 扫码核销 |
| 7 | 订单状态机 + 退款 | 2 天 | 完整状态 + 退款审核 + 微信退款 |
| 8 | 小程序首页 + 钓场列表 | 2 天 | 首页、附近钓场、线路详情 |
| 9 | 小程序预约流程改造 | 1.5 天 | 对接新数据模型 |
| 10 | 管理后台订单/核销页面 | 1.5 天 | 增强 + 核销页 |

### 第二阶段：体验完善（约 10 天）

| # | 任务 | 估时 |
|:--|:-----|:-----|
| 11 | 消息通知（订阅消息） | 2 天 |
| 12 | 团期批量创建 | 1 天 |
| 13 | 订单导出 Excel | 1 天 |
| 14 | 集合地导航 | 0.5 天 |
| 15 | Dashboard + 财务报表 | 3 天 |
| 16 | 客户管理增强 | 1.5 天 |
| 17 | 天气/改期流程 | 1 天 |

---

## 八、API 接口清单

### 8.1 钓场（新增）

```
GET    /api/v1/spots                  # 钓场列表
GET    /api/v1/spots/:id              # 钓场详情
GET    /api/v1/spots/nearby           # 附近钓场（lat, lng, radius）
GET    /api/v1/spots/:id/routes       # 钓场关联的线路

POST   /api/v1/admin/spots            # 创建钓场
PUT    /api/v1/admin/spots/:id        # 编辑钓场
DELETE /api/v1/admin/spots/:id        # 删除钓场
```

### 8.2 线路（修改）

```
GET    /api/v1/routes                 # 线路列表（可按钓场、类型筛选）
GET    /api/v1/routes/:id             # 线路详情（含钓场信息、取消政策）

POST   /api/v1/admin/routes           # 创建线路（新增 merchant_id、fishing_spot_id）
PUT    /api/v1/admin/routes/:id       # 编辑线路
```

### 8.3 订单（修改）

```
POST   /api/v1/orders                 # 创建订单
GET    /api/v1/orders                 # 用户订单列表
GET    /api/v1/orders/:order_no       # 订单详情（含核销码）
POST   /api/v1/orders/:order_no/cancel # 取消订单

GET    /api/v1/orders/:order_no/checkin-code  # 获取核销码/二维码

GET    /api/v1/admin/orders           # 管理后台订单列表
POST   /api/v1/admin/orders/:id/refund # 退款审核
POST   /api/v1/admin/checkin/scan     # 扫码核销
POST   /api/v1/admin/checkin/manual   # 手动核销
GET    /api/v1/admin/schedules/:id/checkins # 核销统计
```

### 8.4 用户（新增）

```
POST   /api/v1/auth/wx-login          # 微信登录
POST   /api/v1/auth/get-phone         # 获取手机号
PUT    /api/v1/user/profile           # 更新用户信息
```

---

## 九、非功能需求

| 维度 | 要求 |
|:-----|:-----|
| 性能 | API 响应 < 500ms，支持 100 并发 |
| 可用性 | 预约流程不超过 5 步 |
| 安全 | 微信支付 V3 RSA 签名、敏感数据加密 |
| 兼容性 | 微信小程序基础库 2.20+ |
| 可维护性 | 代码注释 > 30%，关键接口有文档 |
| 可扩展性 | 数据模型支持多商家，MVP 只开一个 |

---

## 十、MVP 不做（明确排除）

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

---

*文档结束。本文档替代 v1 版本及 docs/requirements-gap-analysis.md 中关于钓位体系的部分。*
