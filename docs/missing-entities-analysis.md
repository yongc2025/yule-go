# 业务实体缺失分析 — yule-go（完整版）

> 专家团队：钓场运营专家 × 旅游产品专家 × 系统架构专家 × 产品经理
> 日期：2026-05-06
> 状态：v2 完整版（含位置服务、核销、真实场景全链路分析）

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
| 位置服务 | ❌ 缺失 | 无附近钓场查询、无距离排序 |
| 到场核销 | ❌ 缺失 | 无核销流程、无到场确认 |
| 订单生命周期 | ⚠️ 不完整 | 状态机简单，缺少退款/超时/核销等状态 |
| 消息通知 | ❌ 缺失 | 无微信模板消息/订阅消息 |
| 保险管理 | ❌ 缺失 | 需求提到出行保险，但无保险字段 |
| 天气应对 | ❌ 缺失 | 无天气状态、无改期/取消流程 |

### 1.3 核心问题

**系统隐含假设：所有线路去同一个地方、所有钓位等价、用户到了自动开始、不需要知道附近有什么。**

这与实际业务严重不符：
- 一个渔具店通常对接 **多个钓场**（不同水库、不同鱼塘）
- 同一个钓场内有 **不同等级的钓位**（VIP 近水位、普通位、远岸位）
- 不同钓位 **价格差异显著**（VIP 位可能是普通位的 2-3 倍）
- 用户预约时需要 **选择具体钓位**，而不是到了再分配
- 用户需要 **查找附近钓场**，按距离筛选
- 到场后需要 **核销确认**，才算真正"开始服务"

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
| business_hours | VARCHAR(50) | 营业时间（如"06:00-18:00"） |
| fish_types | JSON | 主要鱼种（如["鲫鱼","鲤鱼","草鱼"]） |
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
| latitude | DECIMAL(10,7) | 钓位精确纬度（可选，用于地图展示） |
| longitude | DECIMAL(10,7) | 钓位精确经度（可选） |
| status | TINYINT | 0=不可用 1=可预约 2=维护中 |

**与其他实体关系：**
- 一个位属于一个钓场、一个等级
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

### 2.5 核销记录（checkins）🔴 MVP 必须

**业务含义：** 用户到场后的签到确认，是服务交付的关键节点。

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | BIGINT PK | 主键 |
| order_id | BIGINT FK | 订单 ID |
| user_id | BIGINT FK | 用户 ID |
| schedule_id | BIGINT FK | 团期 ID |
| fishing_spot_id | BIGINT FK | 钓场 ID |
| checkin_code | VARCHAR(16) | 核销码（6-8位数字，订单生成时自动创建） |
| qr_code_data | VARCHAR(256) | 二维码内容（加密后的核销码+订单信息） |
| status | TINYINT | 0=未核销 1=已核销 2=已过期 |
| checked_in_at | DATETIME | 核销时间 |
| checked_by | BIGINT FK | 核销人（工作人员 admin_id） |
| checkin_method | TINYINT | 核销方式：1=扫码 2=手动输入 3=GPS定位 |
| gps_latitude | DECIMAL(10,7) | 核销时用户纬度（防作弊） |
| gps_longitude | DECIMAL(10,7) | 核销时用户经度 |
| created_at | DATETIME | 创建时间 |

**关键逻辑：**
- 下单支付成功 → 自动生成核销码 → 存入 checkins 表
- 小程序"我的订单"展示核销二维码
- 工作人员扫码/输入核销码 → 确认到场 → 订单状态变为"已核销"
- 支持 GPS 辅助校验（用户是否在钓场范围内）

---

### 2.6 用户位置（user_locations）🟡 MVP 建议

**业务含义：** 用户地理位置，用于"附近钓场"查询。

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| id | BIGINT PK | 主键 |
| user_id | BIGINT FK | 用户 ID（唯一） |
| latitude | DECIMAL(10,7) | 最新纬度 |
| longitude | DECIMAL(10,7) | 最新经度 |
| updated_at | DATETIME | 更新时间 |

**替代方案：Redis GEO**（推荐）
```
GEOADD user:locations 116.40 39.90 "user:1001"
GEOADD spots 116.41 39.91 "spot:1"
GEOSEARCH spots FROMLONLAT 116.40 39.90 BYRADIUS 10 km ASC
```
- 性能更好，支持实时距离计算
- 用户位置更新频率高，Redis 更适合
- 附近钓场查询天然支持

---

### 2.7 线路-钓场关联（route_spots）🟡 MVP 建议

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

### 2.8 钓场设施表（spot_facilities）🟢 后续迭代

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
| departure_point | VARCHAR(255) | 集合地点（如"XX渔具店门口"） |
| departure_latitude | DECIMAL(10,7) | 集合地纬度 |
| departure_longitude | DECIMAL(10,7) | 集合地经度 |
| min_participants | INT | 最少成团人数 |
| highlights | JSON | 亮点标签（如["免费停车","包午餐"]） |
| insurance_included | TINYINT | 是否含保险（0=否 1=是） |
| insurance_amount | DECIMAL(10,2) | 保险费用 |

### 3.2 schedules（团期表）需新增

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| fishing_spot_id | BIGINT FK | 本期钓场（可与线路默认不同） |
| departure_time | DATETIME | 本期出发时间（可覆盖线路默认） |
| weather_status | TINYINT | 天气状态：0=未确认 1=正常 2=改期 3=取消 |
| weather_note | VARCHAR(255) | 天气备注 |
| guide_admin_id | BIGINT FK | 领队（关联 admins 表，替代纯文本 guide_name） |
| actual_departure_time | DATETIME | 实际出发时间 |
| actual_return_time | DATETIME | 实际返回时间 |

### 3.3 orders（订单表）需新增

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| fishing_spot_id | BIGINT FK | 钓场（冗余，方便查询） |
| position_ids | JSON | 预约的钓位 ID 列表 |
| spot_fee | DECIMAL(10,2) | 钓位费用小计 |
| checkin_code | VARCHAR(16) | 核销码（冗余，方便查询） |
| checked_in_at | DATETIME | 核销时间 |
| cancel_time | DATETIME | 取消时间 |
| refund_amount | DECIMAL(10,2) | 退款金额 |
| refund_time | DATETIME | 退款时间 |
| expire_at | DATETIME | 支付过期时间（超时自动取消） |

### 3.4 admins（管理员表）需新增

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| phone | VARCHAR(20) | 手机号 |
| real_name | VARCHAR(64) | 真实姓名 |
| fishing_spot_id | BIGINT FK | 所属钓场（工作人员限定） |
| permissions | JSON | 细粒度权限（如["schedule:read","order:write","checkin:scan"]） |

---

## 四、真实场景全链路分析

### 4.1 用户端完整旅程（小程序）

#### 场景 A：新用户首次预约

```
① 打开小程序
   → 首页展示本周团期、热门线路
   → 【缺失】没有"附近钓场"入口，用户不知道去哪钓

② 浏览钓场
   → 按距离排序展示附近钓场
   → 看钓场详情：地址、设施、鱼种、图片
   → 【缺失】钓场列表页、详情页不存在

③ 选择线路/团期
   → 看到某钓场关联的团期
   → 选择日期
   → 【部分覆盖】现有团期列表可工作

④ 选择钓位
   → 看到钓位等级（VIP/标准/远岸）及价格差异
   → 选择具体钓位编号
   → 实时看到哪些已被选
   → 【完全缺失】钓位选择流程

⑤ 填写信息 + 支付
   → 填联系人、人数
   → 勾选装备租赁
   → 选择是否用余额抵扣
   → 微信支付
   → 【部分覆盖】现有下单流程基本可用

⑥ 支付成功
   → 获得核销二维码
   → 看到集合地点、出发时间、领队电话
   → 【缺失】核销码生成、订单成功页展示

⑦ 出行当天
   → 小程序查看订单详情
   → 导航到集合地点
   → 到场后出示核销码
   → 【缺失】导航跳转、核销码展示

⑧ 出行结束
   → 订单自动完成
   → 邀请好友获得返现
   → 【缺失】自动完成逻辑
```

#### 场景 B：老用户复购

```
① 打开小程序 → "上次去的XX水库不错，看看这周有没有"
   → 【缺失】没有"去过的地方"历史记录

② 直接搜索钓场 → 查看本周团期
   → 【缺失】钓场搜索功能

③ 快速下单（已有联系人信息）
   → 选择钓位 → 支付
   → 【缺失】常用联系人自动填充
```

#### 场景 C：用户取消/改期

```
① 出行前1天，临时有事
   → 进入订单详情 → 点击"取消订单"
   → 选择取消原因
   → 系统计算退款金额（根据取消时间距出发的间隔）
   → 【缺失】取消退款规则、退款计算逻辑

② 天气不好，团期被改期
   → 收到通知："本周六团期因大雨改至下周六"
   → 用户选择同意改期或申请退款
   → 【缺失】改期流程、批量通知
```

---

### 4.2 运营端完整旅程（管理后台）

#### 场景 D：每周排期（周五前完成）

```
① 管理员登录后台
   → 进入"团期管理"
   → 批量创建下周六、周日的团期
   → 选择线路 → 选择钓场 → 系统自动填充该钓场所有钓位库存
   → 填写领队、最大人数
   → 【缺失】批量创建、钓场关联、钓位库存自动生成

② 检查天气
   → 如果天气不佳，标记团期天气状态
   → 系统自动通知已报名用户
   → 【缺失】天气状态管理、通知机制
```

#### 场景 E：用户预约管理

```
① 查看某团期报名情况
   → 已报名名单（姓名、电话、钓位号）
   → 导出 Excel 给领队
   → 【部分覆盖】订单列表可查，但缺少钓位信息

② 处理退款
   → 用户申请取消 → 管理员审核
   → 确认退款 → 微信支付原路退回
   → 钓位库存自动释放
   → 【缺失】退款审核流程、退款接口、库存释放
```

#### 场景 F：出行当天运营

```
① 领队到达钓场
   → 打开管理后台"核销"页面
   → 逐一扫码确认用户到场
   → 或手动输入核销码
   → 实时查看本团期到场率
   → 【完全缺失】核销功能

② 出行结束
   → 领队标记团期"已完成"
   → 系统自动将订单状态变为"已完成"
   → 【缺失】团期完成 → 订单自动流转
```

---

### 4.3 钓场管理全链路

#### 场景 G：新增钓场上线

```
① 管理员添加钓场信息
   → 名称、地址、经纬度、设施、图片
   → 【缺失】钓场 CRUD

② 录入钓位
   → 设置钓位等级（VIP/标准/远岸）及定价
   → 批量添加钓位编号（A-01 到 A-30）
   → 【缺失】钓位管理、等级管理

③ 关联线路
   → 将钓场关联到"成人钓友单日垂钓团"线路
   → 【缺失】线路-钓场关联管理

④ 钓场上架
   → 状态改为"营业中"
   → 小程序端可见
   → 【缺失】钓场状态管理
```

---

### 4.4 财务与数据场景

#### 场景 H：财务对账

```
① 日结
   → 今日收入 = 各订单实付金额之和
   → 今日退款 = 各退款金额之和
   → 净收入 = 收入 - 退款
   → 【部分覆盖】有财务统计，但缺少退款统计

② 按钓场统计
   → 各钓场的订单量、收入、钓位使用率
   → 【缺失】按钓场维度的统计

③ 按钓位等级统计
   → VIP位 vs 标准位的销售占比
   → 定价策略优化依据
   → 【缺失】按钓位等级维度的统计
```

#### 场景 I：运营数据分析

```
① 钓位热度分析
   → 哪些钓位最热门？哪些长期空置？
   → 调整定价或布局的依据
   → 【缺失】钓位维度的数据分析

② 用户复购分析
   → 用户平均多久来一次？
   → 哪些用户流失了？
   → 【缺失】用户生命周期分析

③ 裂变效果分析
   → 邀请码转化率
   → 各渠道获客成本
   → 【缺失】裂变数据看板
```

---

## 五、订单状态机（完整版）

### 5.1 当前状态（过于简单）

```
0=待支付 → 1=已确认 → 2=已出行 → 3=已完成
                                    4=已取消
                                    5=已退款
```

### 5.2 建议状态机

```
                    ┌──────────────────────────────┐
                    │                              │
                    ▼                              │
  ┌─────────┐  支付成功  ┌─────────┐  出发   ┌──────┴──┐  返程  ┌─────────┐
  │ 待支付   │ ────────→ │ 已支付   │ ─────→ │ 出行中   │ ────→ │ 待核销   │
  │ PENDING │          │ PAID    │        │ EN_ROUTE│       │ CHECKIN │
  └────┬────┘          └────┬────┘        └─────────┘       └────┬────┘
       │                    │                                     │
    超时/取消              退款申请                              核销完成
       │                    │                                     │
       ▼                    ▼                                     ▼
  ┌─────────┐          ┌─────────┐                          ┌─────────┐
  │ 已取消   │          │ 退款中   │                          │ 已完成   │
  │ CANCEL  │          │ REFUNDING│                         │ COMPLETED│
  └─────────┘          └────┬────┘                          └─────────┘
                            │
                         退款成功
                            │
                            ▼
                       ┌─────────┐
                       │ 已退款   │
                       │ REFUNDED │
                       └─────────┘
```

### 5.3 状态定义

| 状态码 | 状态名 | 说明 | 触发条件 |
|:---|:---|:---|:---|
| 0 | PENDING | 待支付 | 下单创建 |
| 1 | PAID | 已支付 | 微信支付回调成功 |
| 2 | EN_ROUTE | 出行中 | 领队标记出发 |
| 3 | CHECKIN | 待核销 | 到达钓场，等待核销 |
| 4 | COMPLETED | 已完成 | 核销完成或团期结束自动完成 |
| 5 | CANCELLED | 已取消 | 用户主动取消 / 超时未支付 |
| 6 | REFUNDING | 退款中 | 用户申请退款，待审核 |
| 7 | REFUNDED | 已退款 | 退款到账 |

### 5.4 状态流转规则

| 当前状态 | 可转到 | 触发方 | 说明 |
|:---|:---|:---|:---|
| PENDING | PAID | 系统 | 支付成功回调 |
| PENDING | CANCELLED | 用户/系统 | 用户取消或超时（15分钟） |
| PAID | EN_ROUTE | 管理员 | 领队标记出发 |
| PAID | REFUNDING | 用户 | 出行前申请退款 |
| PAID | CANCELLED | 管理员 | 管理员取消团期 |
| EN_ROUTE | CHECKIN | 系统 | 到达钓场（领队操作或GPS检测） |
| CHECKIN | COMPLETED | 系统/管理员 | 核销完成 |
| REFUNDING | REFUNDED | 管理员 | 审核通过，退款到账 |
| REFUNDING | PAID | 管理员 | 审核驳回，恢复已支付 |

---

## 六、优先级建议（修订版）

### P0 — MVP 必须（本期要做）

| 实体/功能 | 理由 |
|:---|:---|
| 钓场表（fishing_spots） | 没有钓场，所有业务无依附 |
| 钓位等级表（spot_grades） | 差异化定价的基础 |
| 钓位表（fishing_positions） | 预约的最小单元 |
| 团期钓位库存（schedule_positions） | 防止超卖、支持选位 |
| 核销记录表（checkins） | 服务交付的关键节点 |
| 线路关联钓场 | 团期创建时自动关联 |
| 订单状态机补全 | 退款、超时、核销等状态 |
| 管理后台-钓场管理 | 管理员需要维护钓场信息 |
| 管理后台-钓位管理 | 管理员需要维护钓位和定价 |
| 管理后台-核销功能 | 工作人员扫码/输入核销码 |
| 小程序-钓场列表（附近钓场） | 用户发现钓场的入口 |
| 小程序-钓位选择 | 用户预约时选位 |
| 小程序-核销码展示 | 出行当天出示核销码 |

### P1 — 近期迭代

| 实体/功能 | 理由 |
|:---|:---|
| 位置服务（Redis GEO） | 附近钓场查询、距离排序 |
| 钓场设施标准化 | 便于筛选和对比 |
| 钓位平面图可视化 | 提升选位体验 |
| 天气/不可抗力流程 | 保障运营安全 |
| 团期批量创建 | 每周排期效率 |
| 微信消息通知 | 预约成功、天气变更、核销提醒 |
| 退款审核流程 | 订单管理闭环 |
| 集合地导航 | 小程序跳转微信地图导航 |
| 常用联系人 | 复购时自动填充 |
| 按钓场/钓位维度统计 | 运营决策依据 |

### P2 — 远期规划

| 实体/功能 | 理由 |
|:---|:---|
| 钓场评价系统 | 用户反馈 |
| 钓位占用热力图 | 运营数据分析 |
| 智能推荐钓位 | 基于用户偏好推荐 |
| 车辆调度管理 | 多线路多车辆 |
| GPS自动核销 | 用户到达钓场范围自动签到 |
| 用户生命周期分析 | 流失预警、复购激励 |
| 裂变数据看板 | 渠道效果分析 |

---

## 七、数据模型变更建议（完整版）

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
  business_hours VARCHAR(50) DEFAULT '' COMMENT '营业时间',
  fish_types    JSON COMMENT '主要鱼种',
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
  latitude         DECIMAL(10,7) DEFAULT NULL COMMENT '钓位纬度',
  longitude        DECIMAL(10,7) DEFAULT NULL COMMENT '钓位经度',
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

-- 核销记录表
CREATE TABLE checkins (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id         BIGINT UNSIGNED NOT NULL COMMENT '订单 ID',
  user_id          BIGINT UNSIGNED NOT NULL COMMENT '用户 ID',
  schedule_id      BIGINT UNSIGNED NOT NULL COMMENT '团期 ID',
  fishing_spot_id  BIGINT UNSIGNED NOT NULL COMMENT '钓场 ID',
  checkin_code     VARCHAR(16) NOT NULL COMMENT '核销码',
  qr_code_data     VARCHAR(256) DEFAULT '' COMMENT '二维码内容',
  status           TINYINT UNSIGNED DEFAULT 0 COMMENT '0=未核销 1=已核销 2=已过期',
  checked_in_at    DATETIME DEFAULT NULL COMMENT '核销时间',
  checked_by       BIGINT UNSIGNED DEFAULT NULL COMMENT '核销人（admin_id）',
  checkin_method   TINYINT DEFAULT 1 COMMENT '1=扫码 2=手动 3=GPS',
  gps_latitude     DECIMAL(10,7) DEFAULT NULL COMMENT '核销时用户纬度',
  gps_longitude    DECIMAL(10,7) DEFAULT NULL COMMENT '核销时用户经度',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_code (checkin_code),
  INDEX idx_order (order_id),
  INDEX idx_schedule (schedule_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id),
  FOREIGN KEY (fishing_spot_id) REFERENCES fishing_spots(id),
  FOREIGN KEY (checked_by) REFERENCES admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='核销记录表';

-- 用户位置表（或用 Redis GEO 替代）
CREATE TABLE user_locations (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL COMMENT '用户 ID',
  latitude    DECIMAL(10,7) NOT NULL COMMENT '纬度',
  longitude   DECIMAL(10,7) NOT NULL COMMENT '经度',
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户位置';
```

### 现有表变更

```sql
-- routes 新增字段
ALTER TABLE routes ADD COLUMN fishing_spot_id BIGINT UNSIGNED DEFAULT NULL COMMENT '默认关联钓场' AFTER type;
ALTER TABLE routes ADD COLUMN duration VARCHAR(20) DEFAULT '一日游' COMMENT '行程时长' AFTER max_slots;
ALTER TABLE routes ADD COLUMN departure_time TIME DEFAULT NULL COMMENT '默认出发时间' AFTER duration;
ALTER TABLE routes ADD COLUMN return_time TIME DEFAULT NULL COMMENT '默认返回时间' AFTER departure_time;
ALTER TABLE routes ADD COLUMN departure_point VARCHAR(255) DEFAULT '' COMMENT '集合地点' AFTER return_time;
ALTER TABLE routes ADD COLUMN departure_latitude DECIMAL(10,7) DEFAULT NULL COMMENT '集合地纬度' AFTER departure_point;
ALTER TABLE routes ADD COLUMN departure_longitude DECIMAL(10,7) DEFAULT NULL COMMENT '集合地经度' AFTER departure_latitude;
ALTER TABLE routes ADD COLUMN min_participants INT UNSIGNED DEFAULT 1 COMMENT '最少成团人数' AFTER departure_longitude;
ALTER TABLE routes ADD COLUMN highlights JSON COMMENT '亮点标签' AFTER min_participants;
ALTER TABLE routes ADD COLUMN insurance_included TINYINT DEFAULT 1 COMMENT '是否含保险' AFTER highlights;
ALTER TABLE routes ADD COLUMN insurance_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '保险费用' AFTER insurance_included;
ALTER TABLE routes ADD INDEX idx_fishing_spot (fishing_spot_id);
ALTER TABLE routes ADD FOREIGN KEY (fishing_spot_id) REFERENCES fishing_spots(id);

-- schedules 新增字段
ALTER TABLE schedules ADD COLUMN fishing_spot_id BIGINT UNSIGNED DEFAULT NULL COMMENT '本期钓场' AFTER route_id;
ALTER TABLE schedules ADD COLUMN weather_status TINYINT UNSIGNED DEFAULT 0 COMMENT '天气状态' AFTER guide_phone;
ALTER TABLE schedules ADD COLUMN weather_note VARCHAR(255) DEFAULT '' COMMENT '天气备注' AFTER weather_status;
ALTER TABLE schedules ADD COLUMN guide_admin_id BIGINT UNSIGNED DEFAULT NULL COMMENT '领队admin_id' AFTER weather_note;
ALTER TABLE schedules ADD COLUMN actual_departure_time DATETIME DEFAULT NULL COMMENT '实际出发时间' AFTER guide_admin_id;
ALTER TABLE schedules ADD COLUMN actual_return_time DATETIME DEFAULT NULL COMMENT '实际返回时间' AFTER actual_departure_time;
ALTER TABLE schedules ADD INDEX idx_fishing_spot (fishing_spot_id);
ALTER TABLE schedules ADD FOREIGN KEY (fishing_spot_id) REFERENCES fishing_spots(id);

-- orders 新增字段
ALTER TABLE orders ADD COLUMN fishing_spot_id BIGINT UNSIGNED DEFAULT NULL COMMENT '钓场' AFTER schedule_id;
ALTER TABLE orders ADD COLUMN position_ids JSON COMMENT '预约钓位 ID 列表' AFTER fishing_spot_id;
ALTER TABLE orders ADD COLUMN spot_fee DECIMAL(10,2) DEFAULT 0.00 COMMENT '钓位费用' AFTER rental_fee;
ALTER TABLE orders ADD COLUMN checkin_code VARCHAR(16) DEFAULT NULL COMMENT '核销码' AFTER remark;
ALTER TABLE orders ADD COLUMN checked_in_at DATETIME DEFAULT NULL COMMENT '核销时间' AFTER checkin_code;
ALTER TABLE orders ADD COLUMN cancel_time DATETIME DEFAULT NULL COMMENT '取消时间' AFTER checked_in_at;
ALTER TABLE orders ADD COLUMN refund_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '退款金额' AFTER cancel_time;
ALTER TABLE orders ADD COLUMN refund_time DATETIME DEFAULT NULL COMMENT '退款时间' AFTER refund_amount;
ALTER TABLE orders ADD COLUMN expire_at DATETIME DEFAULT NULL COMMENT '支付过期时间' AFTER refund_time;

-- admins 新增字段
ALTER TABLE admins ADD COLUMN phone VARCHAR(20) DEFAULT '' COMMENT '手机号' AFTER password_hash;
ALTER TABLE admins ADD COLUMN real_name VARCHAR(64) DEFAULT '' COMMENT '真实姓名' AFTER phone;
ALTER TABLE admins ADD COLUMN fishing_spot_id BIGINT UNSIGNED DEFAULT NULL COMMENT '所属钓场' AFTER real_name;
ALTER TABLE admins ADD COLUMN permissions JSON COMMENT '细粒度权限' AFTER fishing_spot_id;
```

---

## 八、API 接口补充

### 8.1 钓场模块（新增）

```
GET    /api/v1/spots                    # 钓场列表（支持距离排序）
GET    /api/v1/spots/:id                # 钓场详情
GET    /api/v1/spots/nearby?lat=&lng=&radius=  # 附近钓场
GET    /api/v1/spots/:id/positions      # 钓场钓位列表（按等级分组）
GET    /api/v1/spots/:id/schedules      # 钓场关联的团期
```

### 8.2 核销模块（新增）

```
GET    /api/v1/orders/:order_no/checkin-code   # 获取核销码/二维码
POST   /api/v1/admin/checkin/scan              # 扫码核销
POST   /api/v1/admin/checkin/manual            # 手动核销（输入核销码）
GET    /api/v1/admin/schedules/:id/checkins    # 团期核销统计
```

### 8.3 管理后台-钓场管理（新增）

```
POST   /api/v1/admin/spots                     # 创建钓场
GET    /api/v1/admin/spots                     # 钓场列表
PUT    /api/v1/admin/spots/:id                 # 编辑钓场
DELETE /api/v1/admin/spots/:id                 # 删除钓场

POST   /api/v1/admin/spots/:id/grades          # 创建钓位等级
PUT    /api/v1/admin/grades/:id                # 编辑钓位等级

POST   /api/v1/admin/spots/:id/positions       # 批量创建钓位
PUT    /api/v1/admin/positions/:id             # 编辑钓位
DELETE /api/v1/admin/positions/:id             # 删除钓位
```

### 8.4 现有接口需修改

```
# 团期创建 - 增加钓场关联、自动生成钓位库存
POST   /api/v1/admin/schedules

# 订单创建 - 增加钓位选择
POST   /api/v1/orders

# 订单详情 - 增加核销码、钓位信息
GET    /api/v1/orders/:order_no

# 订单取消 - 增加退款逻辑
POST   /api/v1/orders/:order_no/cancel

# 线路列表 - 增加关联钓场信息
GET    /api/v1/routes
```

---

## 九、实施建议

### 9.1 推荐实施顺序

```
第1步：创建钓场/钓位/核销相关表（纯新增，不影响现有功能）
第2步：现有表变更（routes/schedules/orders/admins 新增字段）
第3步：管理后台-钓场管理页面（CRUD + 钓位管理）
第4步：修改团期创建流程（关联钓场、生成钓位库存）
第5步：修改小程序预约流程（钓场列表 → 选择钓位）
第6步：核销功能（管理后台扫码 + 小程序展示核销码）
第7步：订单状态机补全（退款、超时、自动完成）
第8步：位置服务（Redis GEO + 附近钓场）
```

### 9.2 向后兼容

- 所有新增字段设 DEFAULT NULL，不影响现有数据
- 现有线路和团期可逐步关联钓场
- 未关联钓场的团期按原流程走（不选钓位）
- 核销功能可独立上线，不影响现有订单流程

---

## 十、风险与建议

### 10.1 技术风险

| 风险 | 影响 | 应对 |
|:---|:---|:---|
| 钓位并发预约超卖 | 同一钓位被多人选中 | 数据库乐观锁 + Redis 分布式锁 |
| 核销码安全 | 伪造核销码 | 加密生成（HMAC + 订单信息），校验时解密验证 |
| 微信支付退款 | 退款接口调用失败 | 重试机制 + 人工兜底 |
| 位置隐私 | 用户位置泄露 | 仅查询时使用，不持久化精确位置（或脱敏存储） |

### 10.2 业务风险

| 风险 | 影响 | 应对 |
|:---|:---|:---|
| 钓位定价不合理 | 用户不买账 | 先按等级系数定价，根据数据调优 |
| 核销流程太复杂 | 工作人员不愿用 | 极简操作：扫码 → 确认，两步完成 |
| 天气取消频繁 | 用户体验差 | 提前预警 + 自动改期 + 退款保障 |

---

*文档结束。如有疑问请在团队群讨论。*
