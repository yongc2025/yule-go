# 渔乐出行 — 技术架构文档

> **cloud-mvp（微信云开发版本）**
> **版本**：v1.0 | **日期**：2026-05-08

---

## 一、架构总览

```
┌─────────────────────────────────────────────────────────┐
│                    微信小程序客户端                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐  │
│  │ 首页     │  │ 活动详情 │  │ 预约下单 │  │ 订单/我的 │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └─────┬────┘  │
│       │            │            │              │        │
│  ┌────┴────────────┴────────────┴──────────────┴────┐  │
│  │              api.js（云函数调用封装）               │  │
│  └──────────────────────┬───────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │ wx.cloud.callFunction()
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  微信云开发环境                            │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                 云函数层（11 个函数）                  │ │
│  │                                                     │ │
│  │  login    orders     checkin    wallet    referral  │ │
│  │  activities schedules shop     coupons   users     │ │
│  │  notify                                              │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                          │                                │
│  ┌──────────────────────┴──────────────────────────────┐ │
│  │                云数据库（12 个集合）                   │ │
│  │                                                     │ │
│  │  users  merchants  activities  schedules  orders    │ │
│  │  user_wallets  coupons  referrals  wallet_logs      │ │
│  │  recharges  schedule_changelogs  subscriptions      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              云存储（用户头像/相册图片）                │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 二、技术选型说明

### 2.1 选型：微信云开发

**选择原因**：

| 维度 | 说明 |
|:---|:---|
| **零运维** | 无需购买/管理服务器，微信自动扩缩容 |
| **原生集成** | 与小程序深度集成，openid 自动获取，无需额外鉴权 |
| **快速上线** | 数据库、云函数、云存储一站式，MVP 验证周期短 |
| **成本低** | 免费额度足够单店 MVP 使用（云函数 40 万次/月、数据库 2GB） |
| **支付便捷** | 内置 `cloud.cloudPay` 统一下单接口 |

### 2.2 优势

- **开发效率高**：一个 `wx.cloud.callFunction()` 调用即完成前端到后端的通信
- **安全模型内置**：openid 由云开发环境自动注入，无法伪造
- **弹性扩缩**：无需关心并发和容量，云开发自动处理
- **适合 MVP**：验证完可删，无沉没成本

### 2.3 劣势与限制

| 限制 | 影响 | 应对方案 |
|:---|:---|:---|
| **冷启动** | 云函数首次调用有 2-3 秒延迟 | V2 迁移到自建 Go 服务 |
| **文档型数据库** | 不支持 JOIN、事务有限 | 冗余存储关键字段（如 `activityName`） |
| **无定时任务原生支持** | 需要云函数定时触发器 | MVP 阶段不做超时取消，V2 补充 |
| **调试困难** | 云函数日志查看不便 | 增加 `console.log` + 云开发控制台查看 |
| **无 WebSocket** | 实时通知能力弱 | 使用微信订阅消息替代 |
| **数据库查询限制** | `where in` 最多 20 条、单次查询最多 1000 条 | 分批查询 |

### 2.4 技术栈清单

| 层 | 技术 | 版本 |
|:---|:---|:---|
| 前端框架 | 微信小程序原生 | - |
| 后端运行时 | Node.js（云函数） | 12+ |
| 后端 SDK | wx-server-sdk | latest |
| 数据库 | 云数据库（MongoDB-like） | - |
| 存储 | 云存储 | - |
| 支付 | cloud.cloudPay | - |
| 通知 | 微信订阅消息 | - |

---

## 三、云函数职责矩阵

### 3.1 函数总览

| 云函数 | 职责 | 权限 | action 数量 |
|:---|:---|:---|:---|
| `login` | 用户登录、自动注册、邀请码生成/绑定 | 公开 | 1（无 action 参数） |
| `orders` | 订单全生命周期管理 | 用户/管理员 | 8 |
| `checkin` | 核销（扫码/手动）+ 统计 | 管理员 | 3 |
| `wallet` | 用户钱包（余额/会员/充值/退还） | 用户/管理员 | 8 |
| `referral` | 老带新裂变（邀请/绑定/奖励） | 用户 | 4 |
| `schedules` | 团期管理（编辑/取消/通知） | 管理员 | 4 |
| `activities` | 活动 CRUD | 用户/管理员 | 4 |
| `shop` | 门店信息管理 | 用户/管理员 | 3 |
| `coupons` | 优惠券管理（发放/查询/使用） | 用户 | 5 |
| `users` | 用户信息管理（资料/手机号/相册） | 用户 | 5 |
| `notify` | 订阅消息授权管理 | 用户/管理员 | 3 |

### 3.2 详细职责

#### login
- 自动获取 openid，查找或创建用户记录
- 新用户生成唯一 6 位邀请码（大写字母+数字，排除易混淆字符）
- 新用户自动发放新人券（¥10，30 天有效）
- 支持登录时传入邀请码绑定邀请关系

#### orders
- `create`：创建订单 + 校验名额 + 计算多重优惠 + 生成核销码 + 调用微信支付
- `cancel`：取消订单（pending 直接取消，paid 调用微信退款）
- `list`：用户订单列表（分页）
- `detail`：订单详情（含归属校验）
- `payCallback`：微信支付回调（更新状态 + 发放邀请奖励 + 记录用户门店关系）
- `stats`：订单统计（管理员，按日/周/月，按团期维度）
- `refundList`：退款订单列表（管理员）
- `calcDiscount`：下单前优惠预览（同行优惠/会员折扣/邀请立减/优惠券/余额）

#### checkin
- `scan`：扫码核销（校验管理员权限 + 核销码有效性 + 团期匹配）
- `manual`：手动输入核销码（逻辑同 scan）
- `stats`：团期核销统计（总数/已核销/未核销/核销名单）
- 核销完成后自动发放复购券（¥15，30 天有效）

#### wallet
- `getWallet`：查询指定门店钱包信息
- `getWallets`：查询用户所有门店钱包
- `recharge`：充值（MVP 模拟充值，直接入账 + 升级会员等级 + 发放赠送券）
- `rechargeList`：充值记录
- `walletLogs`：钱包流水日志
- `getTiers`：获取充值档位配置
- `refundBalance`：用户申请退还余额
- `adminRefund`：管理员操作退还余额

#### referral
- `getInviteInfo`：查询邀请信息（邀请码 + 邀请记录 + 累计奖励）
- `bindInvite`：绑定邀请关系
- `grantReward`：发放邀请奖励（被邀请人首单成功后）
- `getInviteList`：邀请记录列表

#### schedules
- `update`：编辑团期（日期/名额/集合地点 + 记录变更日志 + 通知已报名用户）
- `cancel`：取消团期（自动退款 + 通知用户）
- `detail`：查询团期详情
- `changelog`：查询变更记录

#### activities
- `list`：活动列表（按周查询，支持分页）
- `detail`：活动详情
- `create`：创建活动（管理员）
- `update`：更新活动（管理员）

#### shop
- `list`：门店列表
- `detail`：门店详情
- `update`：更新门店信息（管理员）

#### coupons
- `list`：查询我的优惠券（支持 Tab 筛选：可用/已用/过期）
- `available`：查询可用优惠券（下单时选择）
- `grant`：发放优惠券（系统内部调用）
- `use`：使用优惠券
- `count`：统计可用券数量（角标显示）

#### users
- `getProfile`：获取用户完整资料
- `updateProfile`：更新昵称/头像/简介
- `updatePhone`：绑定/更新手机号（正则校验）
- `uploadAlbum`：添加相册照片（最多 9 张）
- `deleteAlbum`：删除相册照片

#### notify
- `saveSubscription`：保存用户订阅授权状态
- `getMySubscriptions`：查询我的订阅状态
- `sendTest`：管理员测试发送通知

---

## 四、数据库集合设计

### 4.1 集合总览

| 集合 | 说明 | 关联关系 |
|:---|:---|:---|
| `users` | 用户信息 | openid（唯一标识） |
| `merchants` | 门店信息 | MVP 单店，仅一条记录 |
| `activities` | 活动 | → merchants (merchantId) |
| `schedules` | 团期 | → activities (activityId) |
| `orders` | 订单 | → users (openid), activities, schedules |
| `user_wallets` | 用户钱包 | → users (openid), merchants (merchantId) |
| `coupons` | 优惠券 | → users (openid) |
| `referrals` | 邀请记录 | → users (inviterOpenid, inviteeOpenid) |
| `wallet_logs` | 钱包流水 | → users (openid) |
| `recharges` | 充值记录 | → users (openid), merchants (merchantId) |
| `schedule_changelogs` | 团期变更记录 | → schedules (scheduleId) |
| `subscriptions` | 订阅消息授权 | → users (openid) |

### 4.2 关键字段说明

#### users — 用户

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| openid | string | 微信 openid（唯一标识） |
| nickname | string | 昵称 |
| avatar | string | 头像 URL |
| phone | string | 手机号（11 位） |
| bio | string | 个人简介 |
| album | array | 相册图片 URL 列表（最多 9 张） |
| balance | number | 余额（来自邀请奖励，与 user_wallets.balance 不同） |
| memberLevel | number | 会员等级（0=普通/1=银卡/2=金卡/3=钻石） |
| isGuide | boolean | 是否为领队 |
| inviteCode | string | 6 位邀请码（唯一） |
| invitedBy | string | 邀请人 openid |

#### merchants — 门店

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| name | string | 门店名称 |
| ownerName | string | 店主姓名 |
| ownerAvatar | string | 店主头像 |
| ownerTitle | string | 店主头衔（如"金牌领队"） |
| slogan | string | 门店口号 |
| serviceCount | number | 已服务人数 |
| rating | number | 评分 |
| ratingCount | number | 评分人数 |
| address | string | 门店地址 |
| phone | string | 联系电话 |
| coverImage | string | 封面图 URL |
| images | array | 门店图片列表 |
| latitude | number | 纬度 |
| longitude | number | 经度 |

#### activities — 活动

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| name | string | 活动名称 |
| type | string | 类型（fishing/camping/family/senior/wild_fishing） |
| price | number | 成人价格（元） |
| childPrice | number | 儿童价格（元） |
| maxSlots | number | 最大名额 |
| bookedSlots | number | 已报名人数 |
| coverImage | string | 封面图 URL |
| images | array | 活动图片列表 |
| highlights | array | 亮点标签（如["含午餐","新手友好"]） |
| itinerary | array | 行程安排（[{time, desc}]） |
| includes | array | 费用包含项 |
| excludes | array | 费用不含项 |
| notes | string | 出行须知 |
| merchantId | string | 关联门店 ID |
| status | string | 状态（active/cancelled） |

#### schedules — 团期

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| activityId | string | 关联活动 ID |
| date | string | 团期日期（ISO 格式） |
| maxSlots | number | 最大名额 |
| bookedSlots | number | 已报名人数 |
| status | string | 状态（active/cancelled） |
| location | string | 集合地点 |
| cancelReason | string | 取消原因 |

#### orders — 订单

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| orderNo | string | 订单号（YL + 时间戳 + 随机数） |
| openid | string | 用户 openid |
| activityId | string | 活动 ID |
| activityName | string | 活动名称（冗余） |
| scheduleId | string | 团期 ID |
| scheduleDate | string | 团期日期（冗余） |
| adults | number | 成人数 |
| children | number | 儿童数 |
| totalPeople | number | 总人数 |
| contactName | string | 联系人姓名 |
| contactPhone | string | 联系人手机号 |
| remark | string | 备注 |
| originalFee | number | 原价（元） |
| totalFee | number | 实付金额（元） |
| discountDetail | object | 优惠明细（同行优惠/会员折扣/邀请立减/优惠券/余额抵扣） |
| checkinCode | string | 6 位核销码 |
| status | string | 状态（pending/paid/completed/cancelled/refunded） |
| paidAt | date | 支付时间 |
| checkedInAt | date | 核销时间 |
| checkedInBy | string | 核销人 openid |
| refundNo | string | 退款单号 |
| refundAmount | number | 退款金额 |
| refundReason | string | 退款原因 |

#### user_wallets — 用户钱包

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| openid | string | 用户 openid |
| merchantId | string | 门店 ID |
| balance | number | 余额（元） |
| memberLevel | number | 会员等级 |
| totalRecharge | number | 累计充值金额 |

#### coupons — 优惠券

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| openid | string | 用户 openid |
| type | string | 券类型（newuser/travel/repurchase/invite/wakeup/equipment） |
| amount | number | 面额（元） |
| minAmount | number | 最低消费（元） |
| source | string | 来源（register/checkin/recharge/system） |
| status | string | 状态（unused/used） |
| description | string | 描述 |
| expireAt | date | 过期时间 |
| orderId | string | 使用的订单 ID |

#### referrals — 邀请记录

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| inviterOpenid | string | 邀请人 openid |
| inviteeOpenid | string | 被邀请人 openid |
| inviteCode | string | 邀请码 |
| rewardAmount | number | 奖励金额（¥20） |
| newUserDiscount | number | 新人立减金额（¥15） |
| status | string | 状态（pending/completed） |
| orderId | string | 触发奖励的订单 ID |

### 4.3 集合关系图

```
merchants ──1:N──→ activities ──1:N──→ schedules
                      │                    │
                      │                    │
                      ▼                    ▼
                   orders ◄───────────────┘
                      │
           ┌──────────┼──────────┐
           ▼          ▼          ▼
        users    user_wallets  coupons
           │
           ├──→ referrals (inviterOpenid)
           ├──→ referrals (inviteeOpenid)
           ├──→ wallet_logs
           ├──→ recharges
           └──→ subscriptions

schedules ──1:N──→ schedule_changelogs
```

---

## 五、数据流向图

### 5.1 用户预约流程数据流

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ 小程序    │     │ activities│     │ schedules │     │  orders  │
│ 首页      │────→│ list      │────→│ (关联查询) │────→│ create   │
└──────────┘     └──────────┘     └──────────┘     └──────┬───┘
                                                          │
                              ┌───────────────────────────┘
                              ▼
                    ┌──────────────────┐
                    │ 1. 校验团期名额   │ ← schedules.bookedSlots
                    │ 2. 计算优惠       │ ← user_wallets, coupons, users.invitedBy
                    │ 3. 扣减名额       │ → schedules.bookedSlots += N
                    │ 4. 扣减优惠券     │ → coupons.status = 'used'
                    │ 5. 扣减余额       │ → user_wallets.balance -= N
                    │ 6. 创建订单       │ → orders (status=pending)
                    │ 7. 调用微信支付   │ → cloud.cloudPay.unifiedOrder
                    └────────┬─────────┘
                             │
                             ▼ (支付成功回调)
                    ┌──────────────────┐
                    │ payCallback      │
                    │ 1. 更新订单状态   │ → orders.status = 'paid'
                    │ 2. 发放邀请奖励   │ → users.balance += 20, referrals.status = 'completed'
                    │ 3. 记录门店关系   │ → user_shops (upsert)
                    └──────────────────┘
```

### 5.2 核销流程数据流

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ 管理员    │────→│ checkin  │────→│  orders  │
│ 输入核销码 │     │ scan     │     │          │
└──────────┘     └──────────┘     └──────────┘
                                      │
                    ┌─────────────────┘
                    ▼
           ┌──────────────────┐
           │ 1. 校验管理员权限  │ ← admins 集合
           │ 2. 查找订单       │ ← orders (checkinCode + status='paid')
           │ 3. 校验团期匹配   │ ← orders.scheduleId
           │ 4. 更新订单状态   │ → orders.status = 'completed'
           │ 5. 发放复购券     │ → coupons (type='repurchase')
           └──────────────────┘
```

### 5.3 团期取消流程数据流

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ 管理员    │────→│schedules │────→│  orders  │
│ 取消团期  │     │ cancel   │     │ (已支付)  │
└──────────┘     └──────────┘     └──────────┘
                                      │
                    ┌─────────────────┘
                    ▼
           ┌──────────────────┐
           │ 1. 标记团期取消   │ → schedules.status = 'cancelled'
           │ 2. 写入变更日志   │ → schedule_changelogs
           │ 3. 批量退款       │ → orders.status = 'refunded'
           │ 4. 退还名额       │ → schedules.bookedSlots -= N
           │ 5. 发送取消通知   │ → subscriptions + subscribeMessage.send
           └──────────────────┘
```

---

## 六、安全模型

### 6.1 身份认证

**openid 认证**：

- 所有云函数通过 `cloud.getWXContext().OPENID` 获取用户身份
- openid 由微信服务器签发，云开发环境自动注入，**无法伪造**
- 无需额外的 token/JWT 机制

```javascript
// 每个云函数入口
const wxContext = cloud.getWXContext()
const openid = wxContext.OPENID  // 唯一、可信的用户标识
```

### 6.2 管理员校验

**双重校验机制**：

1. **数据库校验**：查询 `admins` 集合确认 openid 是否为管理员
2. **操作归属校验**：订单详情/取消等操作校验 openid 与订单归属

```javascript
// 管理员权限检查
async function isAdmin(openid) {
  const res = await db.collection('admins').where({ openid }).get()
  return res.data.length > 0
}

// 订单归属检查
if (order.openid !== openid) {
  return { code: -1, message: '无权操作' }
}
```

### 6.3 数据库权限策略

| 集合 | 权限策略 | 说明 |
|:---|:---|:---|
| users | 仅创建者可读写 | 用户只能读写自己的记录 |
| merchants | 所有用户可读，仅管理员可写 | 门店信息公开，修改需管理员权限 |
| activities | 所有用户可读，仅管理员可写 | 活动信息公开 |
| schedules | 所有用户可读，仅管理员可写 | 团期信息公开 |
| orders | 仅创建者可读写 | 订单私有，通过云函数权限控制 |
| user_wallets | 仅创建者可读 | 钱包私有，写操作通过云函数控制 |
| coupons | 仅创建者可读 | 优惠券私有 |
| referrals | 仅创建者可读 | 邀请记录私有 |
| wallet_logs | 仅创建者可读 | 流水日志私有 |
| recharges | 仅创建者可读 | 充值记录私有 |
| schedule_changelogs | 管理员可读 | 变更记录仅管理员可见 |
| subscriptions | 仅创建者可读写 | 订阅授权私有 |

### 6.4 费用安全

- **二次校验**：前端传入的 `totalFee` 与后端计算结果比对，差异 > 0.01 元即拒绝
- **优惠券校验**：后端校验券归属、状态、过期时间
- **名额原子性**：创建订单时通过 `_.inc()` 原子操作扣减名额

---

## 七、已知架构限制与演进方向

### 7.1 已知限制

| # | 限制 | 影响 | 严重性 |
|:---|:---|:---|:---|
| 1 | **云函数冷启动** | 首次调用延迟 2-3 秒 | 🟡 中等 |
| 2 | **无事务支持** | 订单创建涉及多集合写入，非原子操作 | 🟡 中等 |
| 3 | **无定时任务** | 待支付订单无法自动超时取消 | 🟡 中等 |
| 4 | **文档型数据库** | 不支持 JOIN，需冗余存储 | 🟢 低等 |
| 5 | **查询限制** | `where in` 最多 20 条，单次最多 1000 条 | 🟢 低等 |
| 6 | **模拟支付** | MVP 阶段未配置商户号时使用模拟支付 | 🟡 中等 |
| 7 | **无实时推送** | 依赖订阅消息，用户需主动授权 | 🟢 低等 |

### 7.2 演进方向

| 阶段 | 方向 | 说明 |
|:---|:---|:---|
| **MVP → V2** | 补充定时任务 | 使用云函数定时触发器实现超时自动取消 |
| **MVP → V2** | 接入真实支付 | 配置微信支付子商户号，替换模拟支付 |
| **MVP → V2** | 管理后台 PC 端 | Vue3 独立后台，支持批量操作 |
| **V2 → V3** | 迁移到自建后端 | Go (Gin) + MySQL，解决冷启动和事务问题 |
| **V2 → V3** | 实时通知 | WebSocket 推送替代订阅消息 |
| **V2 → V3** | 数据分析 | 数据仓库 + BI 看板 |

---

*文档结束*
