# API 接口文档 — cloud-mvp（微信云开发版本）

> **版本**：v1.0  
> **日期**：2026-05-08  
> **调用方式**：`wx.cloud.callFunction({ name: '函数名', data: { action, ... } })`  
> **响应格式**：`{ code: 0, data: ..., message: 'ok' }`（code=0 成功，-1 失败）

---

## 目录

1. [login — 登录](#1-login)
2. [orders — 订单](#2-orders)
3. [checkin — 核销](#3-checkin)
4. [wallet — 钱包](#4-wallet)
5. [referral — 裂变邀请](#5-referral)
6. [schedules — 团期管理](#6-schedules)
7. [activities — 活动管理](#7-activities)
8. [shop — 门店信息](#8-shop)
9. [coupons — 优惠券](#9-coupons)
10. [users — 用户信息](#10-users)
11. [notify — 订阅消息](#11-notify)

---

## 通用说明

### 权限模型
- **公开**：无需管理员身份
- **管理员**：需要 openid 在 `admins` 集合中存在
- **用户**：需要 openid（云函数自动获取）

### 分页参数

| 参数 | 类型 | 必填 | 默认 | 说明 |
|:---|:---|:---:|:---:|:---|
| page | Number | 否 | 1 | 页码 |
| pageSize | Number | 否 | 20 | 每页条数 |

### 通用响应结构

```js
// 成功
{ code: 0, data: { ... }, message: 'ok' }

// 失败
{ code: -1, data: null, message: '错误描述' }
```

---

## 1. login

### 自动登录（获取 openid + 用户信息）

无需传 action，云函数自动处理。

**权限**：公开

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| nickname | String | 否 | 微信昵称（首次授权时传入） |
| avatar | String | 否 | 微信头像 URL（首次授权时传入） |
| inviteCode | String | 否 | 邀请码（受邀注册时传入） |

**响应**：

```js
{
  code: 0,
  data: {
    openid: 'oXXXX',
    user: {
      _id: 'xxx',
      nickname: '钓友老张',
      avatar: 'https://...',
      phone: '13800138000',
      bio: '周末钓鱼爱好者',
      album: ['https://...'],
      balance: 0,
      memberLevel: 0,
      isGuide: false,
      inviteCode: 'ABC123'
    }
  }
}
```

**业务逻辑**：
- 新用户自动生成唯一邀请码（6位大写字母+数字，排除 O/0/I/1/L）
- 新用户自动发放新人券（¥10，30天有效）
- 如携带 inviteCode，自动绑定邀请关系

**前端调用示例**：

```js
// app.js
wx.cloud.callFunction({ name: 'login', data: {} }).then(res => {
  const { openid, user } = res.result.data
  app.globalData.openid = openid
  app.globalData.userInfo = user
})
```

---

## 2. orders

### 2.1 创建订单 — `action: 'create'`

**权限**：用户

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| activityId | String | 是 | 活动 ID |
| scheduleId | String | 是 | 团期 ID |
| adults | Number | 是 | 成人数（≥1） |
| children | Number | 否 | 儿童数（默认 0） |
| contactName | String | 是 | 联系人姓名 |
| contactPhone | String | 是 | 手机号（11位） |
| remark | String | 否 | 备注（≤200字） |
| totalFee | Number | 是 | 前端计算总价（后端二次校验） |
| couponId | String | 否 | 优惠券 ID |
| useBalance | Boolean | 否 | 是否使用余额抵扣 |

**响应**：

```js
{
  code: 0,
  data: {
    orderId: 'xxx',
    orderNo: 'YL17151744000001234',
    payment: {
      timeStamp: '...',
      nonceStr: '...',
      package: 'prepay_id=xxx',
      signType: 'MD5',
      paySign: '...'
    },
    mockPay: false  // true 表示模拟支付
  }
}
```

**价格计算规则**：
1. 原价 = 活动价 × 成人 + 儿童价 × 儿童
2. 同行优惠（2人减¥10/人，3人减¥15/人）与会员折扣取最优惠
3. 邀请立减（被邀请人首单 ¥15）
4. 优惠券抵扣
5. 余额抵扣
6. 后端计算最终价格，与前端传入 totalFee 校验（误差 ≤0.01）

**前端调用示例**：

```js
api.call('orders', {
  action: 'create',
  activityId: 'act_001',
  scheduleId: 'sch_001',
  adults: 2,
  children: 1,
  contactName: '张三',
  contactPhone: '13800138000',
  totalFee: 299.00,
  couponId: '',
  useBalance: false
}).then(orderInfo => {
  if (orderInfo.mockPay) {
    // 模拟支付，直接成功
    wx.switchTab({ url: '/pages/orders/orders' })
  } else {
    wx.requestPayment({ ...orderInfo.payment, success() { ... } })
  }
})
```

### 2.2 取消订单 — `action: 'cancel'`

**权限**：用户（仅自己的订单）

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| orderId | String | 是 | 订单 ID |

**响应**：

```js
{ code: 0, data: { refundAmount: 299.00 } }
```

**业务逻辑**：
- pending 状态：直接取消，退还名额，无退款
- paid 状态：调用微信退款（模拟支付直接标记），退还名额

### 2.3 订单列表 — `action: 'list'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| page | Number | 否 | 页码，默认 1 |
| pageSize | Number | 否 | 每页条数，默认 20 |

**响应**：

```js
{
  code: 0,
  data: {
    list: [
      {
        _id: 'xxx',
        orderNo: 'YL...',
        activityName: '周末钓鱼团',
        scheduleDate: '2026-05-10',
        adults: 2,
        children: 1,
        totalFee: 299.00,
        status: 'paid',
        checkinCode: '382916',
        createdAt: '2026-05-08T12:00:00Z'
      }
    ],
    total: 5,
    page: 1,
    pageSize: 20
  }
}
```

### 2.4 订单详情 — `action: 'detail'`

**权限**：用户（仅自己的订单）

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| orderId | String | 是 | 订单 ID |

### 2.5 支付回调 — `action: 'payCallback'`

**权限**：微信支付系统自动调用（非前端调用）

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| outTradeNo | String | 是 | 商户订单号 |
| resultCode | String | 是 | 支付结果（SUCCESS/FAIL） |

**业务逻辑**：
- 更新订单状态为 paid
- 发放邀请奖励（如有邀请关系）
- 记录用户门店关系

### 2.6 订单统计 — `action: 'stats'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| range | String | 否 | 时间范围：today/week/month，默认 today |
| scheduleId | String | 否 | 按团期筛选 |

**响应**：

```js
{
  code: 0,
  data: {
    summary: {
      totalOrders: 25,
      paidCount: 20,
      paidTotal: 5980.00,
      refundedCount: 2,
      refundedTotal: 598.00,
      netIncome: 5382.00,
      cancelledCount: 3,
      pendingCount: 0
    },
    bySchedule: [
      {
        scheduleId: 'sch_001',
        activityName: '周末钓鱼团',
        scheduleDate: '2026-05-10',
        paidCount: 8,
        paidTotal: 2392.00,
        refundedCount: 1,
        refundedTotal: 299.00,
        netIncome: 2093.00
      }
    ]
  }
}
```

### 2.7 退款列表 — `action: 'refundList'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |

### 2.8 优惠预览 — `action: 'calcDiscount'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| activityId | String | 是 | 活动 ID |
| adults | Number | 是 | 成人数 |
| children | Number | 否 | 儿童数 |
| couponId | String | 否 | 优惠券 ID |
| useBalance | Boolean | 否 | 是否使用余额 |

**响应**：

```js
{
  code: 0,
  data: {
    originalFee: 398.00,
    companionDiscount: 30.00,
    companionRule: '3人同行，每人立减¥15',
    companionGift: '鱼饵礼包',
    memberDiscount: 0,
    memberLevel: 0,
    bestDiscount: 30.00,
    discountType: 'companion',
    inviteDiscount: 15.00,
    isFirstOrder: true,
    couponDiscount: 10.00,
    couponInfo: { _id: 'xxx', type: 'newuser', amount: 10 },
    availableCoupons: [...],
    userBalance: 200.00,
    balanceDeduction: 0,
    finalFee: 343.00
  }
}
```

---

## 3. checkin

### 3.1 扫码核销 — `action: 'scan'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| checkinCode | String | 是 | 6位核销码 |
| scheduleId | String | 否 | 团期 ID（校验归属） |

**响应**：

```js
{
  code: 0,
  data: {
    orderNo: 'YL...',
    activityName: '周末钓鱼团',
    contactName: '张三',
    adults: 2,
    children: 1,
    totalFee: 299.00
  },
  message: '核销成功'
}
```

**业务逻辑**：
- 核销码为 6 位纯数字，查 `orders` 集合中 `status=paid` 的匹配订单
- 核销后自动发放复购券（¥15，30天有效）
- 异步发放，不影响核销结果

### 3.2 手动核销 — `action: 'manual'`

参数和逻辑与扫码核销相同。

### 3.3 核销统计 — `action: 'stats'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| scheduleId | String | 是 | 团期 ID |

**响应**：

```js
{
  code: 0,
  data: {
    total: 15,
    checkedIn: 12,
    unchecked: 3,
    checkedList: [
      { orderNo: 'YL...', contactName: '张三', adults: 2, children: 0, checkedInAt: '...' }
    ]
  }
}
```

---

## 4. wallet

### 4.1 获取钱包 — `action: 'getWallet'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| merchantId | String | 否 | 门店 ID（不传返回所有） |

**响应**：

```js
{
  code: 0,
  data: {
    _id: 'xxx',
    balance: 200.00,
    memberLevel: 1,
    memberName: '银卡会员',
    totalRecharge: 200.00,
    travelDiscount: 10,
    equipDiscount: '9.5折'
  }
}
```

### 4.2 获取所有钱包 — `action: 'getWallets'`

**权限**：用户

无额外参数。返回用户在所有门店的钱包列表。

### 4.3 充值 — `action: 'recharge'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| merchantId | String | 是 | 门店 ID |
| tierId | String | 是 | 充值档位：silver/gold/diamond |

**充值档位**：

| tierId | 金额 | 会员等级 | 赠送 |
|:---|:---|:---|:---|
| silver | ¥200 | 银卡 | 旅行券¥10×1 |
| gold | ¥500 | 金卡 | 旅行券¥20×2 + 装备免费租×1 |
| diamond | ¥1000 | 钻石 | 免费出行×1 + 装备免费租×3 |

**业务逻辑**：
- MVP 阶段模拟充值（不走真实支付）
- 累计充值自动升级会员等级
- 赠送优惠券自动发放到 `coupons` 集合
- 记录充值流水到 `wallet_logs` 和 `recharges`

### 4.4 充值记录 — `action: 'rechargeList'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| merchantId | String | 否 | 门店 ID |
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |

### 4.5 钱包流水 — `action: 'walletLogs'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| merchantId | String | 否 | 门店 ID |
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |

**流水类型**：recharge（充值）、order_pay（订单抵扣）、invite_reward（邀请奖励）、refund（退还）

### 4.6 获取充值档位 — `action: 'getTiers'`

**权限**：用户

无参数。返回三档充值配置。

### 4.7 用户申请退还余额 — `action: 'refundBalance'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| merchantId | String | 是 | 门店 ID |

**说明**：仅返回余额信息和提示，实际退还需店主在门店操作。

### 4.8 店主退还余额 — `action: 'adminRefund'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| merchantId | String | 是 | 门店 ID |
| targetOpenid | String | 是 | 目标用户 openid |
| amount | Number | 是 | 退还金额（≤余额） |

---

## 5. referral

### 5.1 查询邀请信息 — `action: 'getInviteInfo'`

**权限**：用户

**响应**：

```js
{
  code: 0,
  data: {
    inviteCode: 'ABC123',
    totalReward: 60.00,
    completedCount: 3,
    pendingCount: 1,
    list: [
      {
        _id: 'xxx',
        inviteeNickname: '钓友小李',
        inviteeAvatar: 'https://...',
        rewardAmount: 20.00,
        newUserDiscount: 15.00,
        status: 'completed',
        orderId: 'xxx',
        createdAt: '...'
      }
    ]
  }
}
```

### 5.2 绑定邀请关系 — `action: 'bindInvite'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| inviteCode | String | 是 | 邀请码 |

**业务逻辑**：
- 不能自己邀请自己
- 每个用户只能被邀请一次
- 创建 referral 记录（status=pending）
- 被邀请人首单支付后自动完成

### 5.3 发放邀请奖励 — `action: 'grantReward'`

**权限**：系统内部调用

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| orderId | String | 否 | 订单 ID |
| inviteeOpenid | String | 是 | 被邀请人 openid |

**说明**：被邀请人首单支付成功后由 payCallback 自动调用，邀请人余额增加 ¥20。

### 5.4 邀请记录列表 — `action: 'getInviteList'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |

---

## 6. schedules

### 6.1 编辑团期 — `action: 'update'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| id | String | 是 | 团期 ID |
| date | String | 否 | 日期（ISO 格式） |
| maxSlots | Number | 否 | 最大名额 |
| location | String | 否 | 集合地点 |

**业务逻辑**：
- 记录变更日志到 `schedule_changelogs`
- 异步通知已报名用户（订阅消息）

### 6.2 取消团期 — `action: 'cancel'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| id | String | 是 | 团期 ID |
| reason | String | 否 | 取消原因 |

**业务逻辑**：
- 标记团期为 cancelled
- 自动查询所有已支付订单并退款
- 退还名额
- 发送取消通知

### 6.3 团期详情 — `action: 'detail'`

**权限**：公开

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| id | String | 是 | 团期 ID |

### 6.4 变更记录 — `action: 'changelog'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| scheduleId | String | 否 | 团期 ID |
| activityId | String | 否 | 活动 ID |

---

## 7. activities

### 7.1 活动列表 — `action: 'list'`

**权限**：公开

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| weekStart | String | 否 | 周起始日期 |
| weekEnd | String | 否 | 周结束日期 |
| page | Number | 否 | 页码 |
| pageSize | Number | 否 | 每页条数 |

### 7.2 活动详情 — `action: 'detail'`

**权限**：公开

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| id | String | 是 | 活动 ID |

### 7.3 创建活动 — `action: 'create'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| name | String | 是 | 活动名称 |
| type | String | 是 | 类型：fishing/camping/family/senior/wild_fishing |
| price | Number | 是 | 成人价格 |
| childPrice | Number | 否 | 儿童价格 |
| description | String | 否 | 描述 |
| coverImages | Array | 否 | 封面图 URL 列表 |
| itinerary | Array | 否 | 行程安排 |
| includes | Array | 否 | 费用包含 |
| excludes | Array | 否 | 费用不含 |
| highlights | Array | 否 | 亮点标签 |
| notes | String | 否 | 出行须知 |
| cancelPolicy | String | 否 | 取消政策 |

### 7.4 更新活动 — `action: 'update'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| id | String | 是 | 活动 ID |
| status | String | 否 | 状态：active/deleted |
| ... | | | 同创建参数，传入需更新的字段 |

---

## 8. shop

### 8.1 门店列表 — `action: 'list'`

**权限**：公开

无参数。返回 merchants 集合（MVP 只有一家）。

### 8.2 门店详情 — `action: 'detail'`

**权限**：公开

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| id | String | 是 | 门店 ID |

### 8.3 更新门店 — `action: 'update'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| id | String | 是 | 门店 ID |
| name | String | 否 | 门店名称 |
| ownerName | String | 否 | 店主姓名 |
| ownerAvatar | String | 否 | 店主头像 |
| slogan | String | 否 | 口号 |
| address | String | 否 | 地址 |
| phone | String | 否 | 电话 |
| businessHours | String | 否 | 营业时间 |
| latitude | Number | 否 | 纬度 |
| longitude | Number | 否 | 经度 |

---

## 9. coupons

### 9.1 优惠券列表 — `action: 'list'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| status | String | 否 | unused/used/expired，默认 unused |

### 9.2 可用优惠券 — `action: 'available'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| orderType | String | 否 | 订单类型（travel） |

**说明**：返回未过期、未使用的非装备类优惠券列表。

### 9.3 发放优惠券 — `action: 'grant'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| openid | String | 是 | 目标用户 |
| type | String | 是 | 券类型：newuser/travel/repurchase/invite/wakeup/equipment |
| amount | Number | 否 | 面额 |
| expireDays | Number | 否 | 有效天数 |

**券类型配置**：

| type | 名称 | 面额 | 来源 |
|:---|:---|:---|:---|
| newuser | 新人券 | ¥10 | 注册自动发放 |
| travel | 旅行券 | ¥10/¥20 | 充值赠送 |
| repurchase | 复购券 | ¥15 | 核销后自动发放 |
| invite | 邀请券 | ¥15 | 受邀首单赠送 |
| wakeup | 唤醒券 | ¥20 | 专属优惠 |
| equipment | 装备租免券 | - | 充值赠送 |

### 9.4 使用优惠券 — `action: 'use'`

**权限**：系统内部（下单时自动调用）

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| couponId | String | 是 | 优惠券 ID |
| orderId | String | 是 | 订单 ID |

### 9.5 优惠券统计 — `action: 'count'`

**权限**：用户

返回用户各类优惠券数量统计。

---

## 10. users

### 10.1 获取用户资料 — `action: 'getProfile'`

**权限**：用户

**响应**：

```js
{
  code: 0,
  data: {
    _id: 'xxx',
    openid: 'oXXXX',
    nickname: '钓友老张',
    avatar: 'https://...',
    phone: '13800138000',
    bio: '周末钓鱼爱好者',
    album: ['https://...'],
    inviteCode: 'ABC123',
    createdAt: '...'
  }
}
```

### 10.2 更新资料 — `action: 'updateProfile'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| nickname | String | 否 | 昵称（≤20字） |
| avatar | String | 否 | 头像 URL |
| bio | String | 否 | 个人简介（≤200字） |

### 10.3 绑定手机号 — `action: 'updatePhone'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| phone | String | 是 | 11位手机号 |

### 10.4 上传相册 — `action: 'uploadAlbum'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| fileID | String | 是 | 云存储文件 ID |

**限制**：最多 9 张

### 10.5 删除相册 — `action: 'deleteAlbum'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| fileID | String | 是 | 云存储文件 ID |

---

## 11. notify

### 11.1 保存订阅授权 — `action: 'saveSubscription'`

**权限**：用户

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| templateId | String | 是 | 模板 ID |
| status | String | 是 | authorized/rejected |

### 11.2 查询授权状态 — `action: 'getMySubscriptions'`

**权限**：用户

无参数。

### 11.3 测试发送通知 — `action: 'sendTest'`

**权限**：管理员

| 参数 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| templateId | String | 是 | 模板 ID |
| openid | String | 否 | 目标用户（默认自己） |

---

## 附录：前端 API 封装

项目中 `miniprogram/utils/api.js` 提供了统一调用封装：

```js
const api = require('../../utils/api')

// 带 loading 的调用
api.call('orders', { action: 'list' }).then(data => {
  console.log(data.list)
})

// 静默调用（不显示 loading）
api.callSilent('orders', { action: 'list' }).then(data => {
  console.log(data.list)
})
```

**封装特性**：
- 自动显示/隐藏 loading
- 统一错误处理（code≠0 时 toast 提示）
- 简单重试（retry 选项）
- 静默调用模式（callSilent）

---

*文档结束。如有新增云函数或 action，请同步更新此文档。*
