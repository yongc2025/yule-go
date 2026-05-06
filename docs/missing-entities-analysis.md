# 业务实体缺失分析 — yule-go

> 专家团队：钓场运营专家 × 旅游产品专家 × 系统架构专家
> 日期：2026-05-06
> 状态：初版

---

## 一、现状分析

### 1.1 当前数据模型

```
users ──────────┐
                 │
routes ── schedules ── orders ── order_rentals ── rental_items
                                            │
                                         recharges
                                         referrals
                                          admins
```

### 1.2 已覆盖的业务

| 业务 | 覆盖程度 | 说明 |
|:---|:---|:---|
| 用户/会员 | ✅ 较完整 | 微信登录、等级、余额、邀请码 |
| 线路产品 | ⚠️ 部分 | 有线路表，但缺少地点、行程结构化 |
| 团期排期 | ⚠️ 部分 | 按线路+日期，但无钓场、无钓位 |
| 预约下单 | ⚠️ 部分 | 能下单，但无法选择具体钓位 |
| 装备租赁 | ✅ 较完整 | 租赁项、订单关联 |
| 充值/裂变 | ✅ 较完整 | 充值记录、裂变返现 |

### 1.3 核心问题

**系统隐含假设：所有线路去同一个地方、所有钓位等价。**

这与实际业务严重不符：
- 一个渔具店通常对接 **多个钓场**（不同水库、不同鱼塘）
- 同一个钓场内有 **不同等级的钓位**（VIP 近水位、普通位、远岸位）
- 不同钓位 **价格差异显著**（VIP 位可能是普通位的 2-3 倍）
- 用户预约时需要 **选择具体钓位**，而不是到了再分配

---

## 二、缺失实体清单

### 2.1 钓场（fishing_spots）🔴 MVP 必须

**业务含义：** 实体钓鱼场地，如"XX水库"、"YY鱼塘"。

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | BIGINT PK | 主键 |
| name | VARCHAR(100) | 钓场名称 |
| address | VARCHAR(255) | 详细地址 |
| latitude | DECIMAL(10,7) | 纬度（导航用） |
| longitude | DECIMAL(10,7) | 经度（导航用） |
| description | TEXT | 钓场介绍 |
| facilities | JSON | 设施列表：停车场/卫生间/遮阳棚/餐饮等 |
| cover_image | VARCHAR(512) | 封面图 |
| images | JSON | 图片集（多张） |
| contact_name | VARCHAR(64) | 钓场联系人 |
| contact_phone | VARCHAR(20) | 联系电话 |
| total_spots | INT | 总钓位数 |
| status | TINYINT | 0=停用 1=营业中 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**与其他实体关系：**
- 一个钓场 → 多条线路
- 一个钓场 → 多个钓位
- 一个钓场 → 多个团期

---

### 2.2 钓位等级（spot_grades）🔴 MVP 必须

**业务含义：** 钓位的质量分级，决定价格差异。

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | BIGINT PK | 主键 |
| fishing_spot_id | BIGINT FK | 所属钓场 |
| name | VARCHAR(50) | 等级名称：VIP近水位/标准位/远岸位 |
| description | TEXT | 等级说明 |
| price_multiplier | DECIMAL(3,2) | 价格系数（1.00=基础价，1.50=加50%） |
| daily_price | DECIMAL(10,2) | 每日固定价格（与系数二选一） |
| features | JSON | 特色说明：近水3米内/有遮阳棚/独立区域等 |
| sort_order | INT | 排序（高等级在前） |
| status | TINYINT | 0=停用 1=启用 |

**与其他实体关系：**
- 一个钓场 → 多个钓位等级
- 一个等级 → 多个具体钓位

---

### 2.3 钓位（fishing_positions）🔴 MVP 必须

**业务含义：** 钓场内的具体钓位编号，用户预约时选择的最小单元。

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | BIGINT PK | 主键 |
| fishing_spot_id | BIGINT FK | 所属钓场 |
| grade_id | BIGINT FK | 钓位等级 |
| position_no | VARCHAR(20) | 钓位编号（如 A-01、B-12） |
| description | VARCHAR(255) | 备注（如"靠近进水口"） |
| status | TINYINT | 0=不可用 1=可预约 2=维护中 |

**与其他实体关系：**
- 一个钓位属于一个钓场、一个等级
- 一个钓位在某个团期日期可被一个订单预约

---

### 2.4 团期钓位库存（schedule_positions）🔴 MVP 必须

**业务含义：** 每个团期日期下，每个钓位的预约状态。这是库存管理的核心。

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | BIGINT PK | 主键 |
| schedule_id | BIGINT FK | 团期 ID |
| position_id | BIGINT FK | 钓位 ID |
| order_id | BIGINT FK | 预约该钓位的订单（NULL=可预约） |
| status | TINYINT | 0=可预约 1=已预约 2=已锁定（待支付） |
| locked_at | DATETIME | 锁定时间（超时自动释放） |
| created_at | DATETIME | 创建时间 |

**关键逻辑：**
- 创建团期时，自动生成该钓场所有钓位的库存记录
- 用户预约时选择钓位 → 状态变为"锁定" → 支付成功变为"已预约"
- 锁定超时（如15分钟）自动释放

---

### 2.5 线路-钓场关联（route_spots）🟡 MVP 建议

**业务含义：** 一条线路可以去哪些钓场（多对多关系）。

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | BIGINT PK | 主键 |
| route_id | BIGINT FK | 线路 ID |
| fishing_spot_id | BIGINT FK | 钓场 ID |
| is_primary | TINYINT | 是否主钓场（一条线路可能途经多个钓场） |
| visit_order | INT | 访问顺序 |

**说明：** 如果业务初期一条线路只去一个钓场，可以直接在 `routes` 表加 `fishing_spot_id` 外键，简化设计。

---

### 2.6 钓场设施表（spot_facilities）🟢 后续迭代

**业务含义：** 标准化的设施标签，用于筛选和展示。

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | BIGINT PK | 主键 |
| name | VARCHAR(50) | 设施名称 |
| icon | VARCHAR(50) | 图标标识 |

**预设数据：** 停车场、卫生间、遮阳棚、餐饮、WiFi、充电、淋浴、儿童游乐区

---

## 三、现有实体需补充的字段

### 3.1 routes（线路表）需新增

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| fishing_spot_id | BIGINT FK | 默认关联钓场（简化版） |
| duration | VARCHAR(20) | 行程时长（如"一日游"、"半日游"） |
| departure_time | TIME | 默认出发时间 |
| return_time | TIME | 默认返回时间 |
| min_participants | INT | 最少成团人数 |
| highlights | JSON | 亮点标签（如["免费停车","包午餐"]） |

### 3.2 schedules（团期表）需新增

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| fishing_spot_id | BIGINT FK | 本期钓场（可与线路默认不同） |
| departure_time | DATETIME | 本期出发时间（可覆盖线路默认） |
| weather_status | TINYINT | 天气状态：0=未确认 1=正常 2=改期 3=取消 |
| weather_note | VARCHAR(255) | 天气备注 |

### 3.3 orders（订单表）需新增

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| fishing_spot_id | BIGINT FK | 钓场（冗余，方便查询） |
| position_ids | JSON | 预约的钓位 ID 列表 |
| spot_fee | DECIMAL(10,2) | 钓位费用小计 |

---

## 四、业务流程补充

### 4.1 当前未覆盖的关键流程

#### 流程 1：创建团期（管理后台）

```
当前：选线路 → 选日期 → 填领队 → 完成
缺失：选线路 → 选钓场 → 确认可用钓位 → 选日期 → 填领队 → 完成
```

创建团期时应自动关联钓场，并生成该日期的钓位库存。

#### 流程 2：用户预约（小程序）

```
当前：选团期 → 填人数 → 填联系人 → 下单
缺失：选团期 → 选钓位等级 → 选具体钓位 → 填人数 → 填联系人 → 下单
```

用户应能看到钓位平面图或列表，选择心仪的钓位。

#### 流程 3：钓位库存管理

```
当前：不存在
缺失：创建团期 → 自动生成钓位库存 → 预约时锁定 → 支付确认 → 超时释放
```

#### 流程 4：天气/不可抗力处理

```
当前：不存在
缺失：天气预警 → 管理员标记团期状态 → 批量通知用户 → 自动退款或改期
```

#### 流程 5：钓场信息维护

```
当前：不存在
缺失：添加钓场 → 录入钓位 → 设置等级和价格 → 关联线路 → 上线
```

### 4.2 小程序端新增页面建议

| 页面 | 说明 | 优先级 |
|:---|:---|:---|
| 钓场列表 | 展示所有钓场，支持筛选 | P0 |
| 钓场详情 | 钓场介绍、设施、钓位分布图 | P0 |
| 钓位选择 | 预约时选择钓位（列表或平面图） | P0 |
| 钓位地图 | 可视化钓位分布（进阶） | P2 |

### 4.3 管理后台新增页面建议

| 页面 | 说明 | 优先级 |
|:---|:---|:---|
| 钓场管理 | CRUD 钓场信息 | P0 |
| 钓位管理 | 管理每个钓场的钓位和等级 | P0 |
| 钓位平面图 | 可视化编辑钓位布局（进阶） | P2 |

---

## 五、优先级建议

### P0 — MVP 必须（本期要做）

| 实体/功能 | 理由 |
|:---|:---|
| 钓场表（fishing_spots） | 没有钓场，所有业务无依附 |
| 钓位等级表（spot_grades） | 差异化定价的基础 |
| 钓位表（fishing_positions） | 预约的最小单元 |
| 团期钓位库存（schedule_positions） | 防止超卖、支持选位 |
| 线路关联钓场 | 团期创建时自动关联 |
| 管理后台-钓场管理 | 管理员需要维护钓场信息 |
| 管理后台-钓位管理 | 管理员需要维护钓位和定价 |
| 小程序-钓位选择 | 用户预约时选位 |

### P1 — 近期迭代

| 实体/功能 | 理由 |
|:---|:---|
| 钓场设施标准化 | 便于筛选和对比 |
| 钓位平面图可视化 | 提升选位体验 |
| 天气/不可抗力流程 | 保障运营安全 |
| 团期批量创建 | 每周排期效率 |

### P2 — 远期规划

| 实体/功能 | 理由 |
|:---|:---|
| 钓场评价系统 | 用户反馈 |
| 钓位占用热力图 | 运营数据分析 |
| 智能推荐钓位 | 基于用户偏好推荐 |
| 车辆调度管理 | 多线路多车辆 |

---

## 六、数据模型变更建议（完整版）

### 新增表

```sql
-- 钓场表
CREATE TABLE fishing_spots (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL COMMENT '钓场名称',
  address       VARCHAR(255) NOT NULL COMMENT '详细地址',
  latitude      DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
  longitude     DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
  description   TEXT COMMENT '钓场介绍',
  facilities    JSON COMMENT '设施列表',
  cover_image   VARCHAR(512) DEFAULT '' COMMENT '封面图',
  images        JSON COMMENT '图片集',
  contact_name  VARCHAR(64) DEFAULT '' COMMENT '联系人',
  contact_phone VARCHAR(20) DEFAULT '' COMMENT '联系电话',
  total_spots   INT UNSIGNED DEFAULT 0 COMMENT '总钓位数',
  status        TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0=停用 1=营业中',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钓场表';

-- 钓位等级表
CREATE TABLE spot_grades (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fishing_spot_id  BIGINT UNSIGNED NOT NULL COMMENT '所属钓场',
  name             VARCHAR(50) NOT NULL COMMENT '等级名称',
  description      TEXT COMMENT '等级说明',
  price_multiplier DECIMAL(3,2) DEFAULT 1.00 COMMENT '价格系数',
  daily_price      DECIMAL(10,2) DEFAULT 0.00 COMMENT '每日固定价格',
  features         JSON COMMENT '特色说明',
  sort_order       INT UNSIGNED DEFAULT 0 COMMENT '排序',
  status           TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0=停用 1=启用',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_spot (fishing_spot_id),
  FOREIGN KEY (fishing_spot_id) REFERENCES fishing_spots(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钓位等级表';

-- 钓位表
CREATE TABLE fishing_positions (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  fishing_spot_id  BIGINT UNSIGNED NOT NULL COMMENT '所属钓场',
  grade_id         BIGINT UNSIGNED NOT NULL COMMENT '钓位等级',
  position_no      VARCHAR(20) NOT NULL COMMENT '钓位编号',
  description      VARCHAR(255) DEFAULT '' COMMENT '备注',
  status           TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0=不可用 1=可预约 2=维护中',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_spot_no (fishing_spot_id, position_no),
  INDEX idx_grade (grade_id),
  FOREIGN KEY (fishing_spot_id) REFERENCES fishing_spots(id),
  FOREIGN KEY (grade_id) REFERENCES spot_grades(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钓位表';

-- 团期钓位库存表
CREATE TABLE schedule_positions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  schedule_id   BIGINT UNSIGNED NOT NULL COMMENT '团期 ID',
  position_id   BIGINT UNSIGNED NOT NULL COMMENT '钓位 ID',
  order_id      BIGINT UNSIGNED DEFAULT NULL COMMENT '预约订单 ID',
  status        TINYINT UNSIGNED DEFAULT 0 COMMENT '状态：0=可预约 1=已预约 2=已锁定',
  locked_at     DATETIME DEFAULT NULL COMMENT '锁定时间',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_schedule_position (schedule_id, position_id),
  INDEX idx_order (order_id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id),
  FOREIGN KEY (position_id) REFERENCES fishing_positions(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团期钓位库存';
```

### 现有表变更

```sql
-- routes 新增钓场关联
ALTER TABLE routes ADD COLUMN fishing_spot_id BIGINT UNSIGNED DEFAULT NULL COMMENT '默认关联钓场' AFTER type;
ALTER TABLE routes ADD COLUMN duration VARCHAR(20) DEFAULT '一日游' COMMENT '行程时长' AFTER max_slots;
ALTER TABLE routes ADD COLUMN departure_time TIME DEFAULT NULL COMMENT '默认出发时间' AFTER duration;
ALTER TABLE routes ADD COLUMN min_participants INT UNSIGNED DEFAULT 1 COMMENT '最少成团人数' AFTER departure_time;
ALTER TABLE routes ADD INDEX idx_fishing_spot (fishing_spot_id);
ALTER TABLE routes ADD FOREIGN KEY (fishing_spot_id) REFERENCES fishing_spots(id);

-- schedules 新增钓场和天气
ALTER TABLE schedules ADD COLUMN fishing_spot_id BIGINT UNSIGNED DEFAULT NULL COMMENT '本期钓场' AFTER route_id;
ALTER TABLE schedules ADD COLUMN weather_status TINYINT UNSIGNED DEFAULT 0 COMMENT '天气状态' AFTER guide_phone;
ALTER TABLE schedules ADD COLUMN weather_note VARCHAR(255) DEFAULT '' COMMENT '天气备注' AFTER weather_status;
ALTER TABLE schedules ADD INDEX idx_fishing_spot (fishing_spot_id);
ALTER TABLE schedules ADD FOREIGN KEY (fishing_spot_id) REFERENCES fishing_spots(id);

-- orders 新增钓位信息
ALTER TABLE orders ADD COLUMN position_ids JSON COMMENT '预约钓位 ID 列表' AFTER schedule_id;
ALTER TABLE orders ADD COLUMN spot_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT '钓位费用' AFTER rental_fee;
```

---

## 七、实施建议

### 7.1 推荐实施顺序

```
第1步：创建钓场/钓位相关表（纯新增，不影响现有功能）
第2步：管理后台-钓场管理页面（CRUD）
第3步：管理后台-钓位管理页面（CRUD + 等级定价）
第4步：修改团期创建流程（关联钓场、生成钓位库存）
第5步：修改小程序预约流程（选择钓位）
第6步：修改订单表结构（记录钓位信息）
```

### 7.2 向后兼容

- 所有新增字段设 DEFAULT NULL，不影响现有数据
- 现有线路和团期可逐步关联钓场
- 未关联钓场的团期按原流程走（不选钓位）

---

*文档结束。如有疑问请在团队群讨论。*
