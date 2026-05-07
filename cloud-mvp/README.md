# 渔乐出行 — 云开发 MVP

> 最小可用版本，验证核心业务流程：活动展示 → 预约支付 → 核销

## 项目结构

```
cloud-mvp/
├── miniprogram/                 # 小程序前端
│   ├── pages/
│   │   ├── index/               # 活动列表（首页）
│   │   ├── detail/              # 活动详情（行程、档期、取消政策）
│   │   ├── booking/             # 预约下单（选人数、填信息、支付）
│   │   ├── orders/              # 我的订单（核销码展示）
│   │   └── admin/               # 管理入口（今日数据、核销）
│   ├── utils/
│   │   ├── api.js               # 云函数调用封装
│   │   └── date.js              # 日期工具
│   ├── app.js / app.json / app.wxss
│   └── project.config.json
│
├── cloudfunctions/              # 云函数
│   ├── login/                   # 登录（获取 openid）
│   ├── activities/              # 活动 CRUD
│   ├── orders/                  # 订单（创建/支付回调/取消）
│   └── checkin/                 # 核销（扫码/手动/统计）
│
└── README.md
```

## 云数据库集合

| 集合 | 说明 | 关键字段 |
|:---|:---|:---|
| `users` | 用户 | openid, nickname, phone, balance, memberLevel |
| `merchants` | 门店（MVP 只有一家） | name, ownerName, ownerAvatar, slogan, rating |
| `activities` | 活动（线路+团期合并） | name, type, price, date, maxSlots, bookedSlots |
| `schedules` | 团期 | activityId, date, maxSlots, bookedSlots |
| `orders` | 订单 | orderNo, openid, activityId, status, checkinCode |
| `user_shops` | 用户门店关系 | openid, merchantId, isPrimary, visitCount |
| `admins` | 管理员 | openid, password |

## 快速开始

### 1. 创建云开发环境
1. 微信公众平台 → 小程序 → 开发 → 云开发
2. 创建环境（建议命名 `yule-prod`）
3. 记下环境 ID

### 2. 配置 project.config.json
- 修改 `appid` 为你的小程序 AppID
- 修改 `miniprogram/app.js` 中的 `env` 为你的环境 ID

### 3. 创建数据库集合
在云开发控制台 → 数据库中创建以上 7 个集合

### 4. 初始化数据
在云开发控制台 → 数据库 → `merchants` 集合中手动添加一条：
```json
{
  "name": "渔乐渔具",
  "ownerName": "老王",
  "ownerAvatar": "",
  "ownerTitle": "金牌领队",
  "slogan": "周末去哪？跟我走！",
  "serviceCount": 268,
  "rating": 4.9,
  "ratingCount": 128,
  "address": "长沙市XX区XX路XX号",
  "phone": "13800138000"
}
```

在 `admins` 集合中添加管理员：
```json
{
  "openid": "（登录后在云开发控制台查看你的 openid）",
  "password": "admin123"
}
```

在 `activities` 集合中添加活动，在 `schedules` 中添加对应团期。

### 5. 部署云函数
在微信开发者工具中，右键每个云函数目录 → 上传并部署（云端安装依赖）

### 6. 运行
用微信开发者工具打开 `cloud-mvp/` 目录即可预览

## 核心流程

```
用户打开小程序
  → 首页看到本周活动列表
  → 点击活动查看详情（行程、包含、档期）
  → 选档期 → 选人数 → 填联系信息 → 确认支付
  → 微信支付 → 获得核销码
  → 出行当天出示核销码
  → 老板扫码核销 → 完成
```

## 与 yule-go 的关系

| | cloud-mvp | yule-go |
|:---|:---|:---|
| 定位 | 快速验证 MVP | 正式产品 |
| 后端 | 云函数 | Go (Gin) |
| 数据库 | 云数据库 | MySQL |
| 管理后台 | 小程序内嵌 | Vue3 独立后台 |
| 生命周期 | 验证完可删 | 长期维护 |

MVP 验证通过后，数据迁移到 MySQL，前端切到 yule-go 的 API 即可。
