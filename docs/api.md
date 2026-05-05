# API 接口定义 — yule-go

> 基础路径：`/api/v1`
> 认证方式：JWT Bearer Token（小程序端通过微信登录获取）
> 响应格式：`{ code, message, data }`

## 1. 用户模块

### 1.1 微信登录
```
POST /api/v1/auth/wechat-login
Request:
{
  "code": "微信登录code"
}
Response:
{
  "code": 0,
  "data": {
    "token": "jwt_token",
    "user": { "id", "nickname", "avatar", "member_level", "balance", "invite_code" }
  }
}
```

### 1.2 获取用户信息
```
GET /api/v1/user/profile
Authorization: Bearer <token>
Response:
{
  "code": 0,
  "data": {
    "id", "nickname", "avatar", "phone", "member_level",
    "balance", "total_recharge", "invite_code"
  }
}
```

### 1.3 更新用户信息
```
PUT /api/v1/user/profile
Authorization: Bearer <token>
Request:
{
  "nickname": "新昵称",
  "phone": "手机号"
}
```

## 2. 线路模块

### 2.1 获取线路列表
```
GET /api/v1/routes
Response:
{
  "code": 0,
  "data": [
    { "id", "name", "type", "price", "child_price", "cover_image", "description" }
  ]
}
```

### 2.2 获取线路详情
```
GET /api/v1/routes/:id
Response:
{
  "code": 0,
  "data": {
    "id", "name", "type", "price", "child_price",
    "description", "itinerary", "includes", "cover_image", "max_slots"
  }
}
```

## 3. 团期模块

### 3.1 获取团期列表（按周）
```
GET /api/v1/schedules?week=2026-W19
Response:
{
  "code": 0,
  "data": [
    {
      "id", "route_id", "route_name", "trip_date",
      "max_slots", "booked_slots", "available_slots", "status"
    }
  ]
}
```

### 3.2 获取团期详情
```
GET /api/v1/schedules/:id
Response:
{
  "code": 0,
  "data": {
    "id", "route": {...}, "trip_date",
    "max_slots", "booked_slots", "available_slots",
    "guide_name", "status"
  }
}
```

## 4. 订单模块

### 4.1 创建订单
```
POST /api/v1/orders
Authorization: Bearer <token>
Request:
{
  "schedule_id": 1,
  "adults": 2,
  "children": 1,
  "rental_items": [
    { "rental_item_id": 1, "quantity": 2 },
    { "rental_item_id": 2, "quantity": 1 }
  ],
  "contact_name": "张三",
  "contact_phone": "13800138000",
  "use_balance": true,
  "remark": ""
}
Response:
{
  "code": 0,
  "data": {
    "order_id": 1,
    "order_no": "20260505001",
    "trip_fee": 324.00,
    "rental_fee": 110.00,
    "discount_amount": 20.00,
    "balance_used": 50.00,
    "total_amount": 364.00,
    "payment_params": { "timeStamp", "nonceStr", "package", "signType", "paySign" }
  }
}
```

### 4.2 获取订单列表
```
GET /api/v1/orders?status=all&page=1&size=10
Authorization: Bearer <token>
Response:
{
  "code": 0,
  "data": {
    "total": 25,
    "list": [
      {
        "order_no", "route_name", "trip_date", "adults", "children",
        "total_amount", "status", "created_at"
      }
    ]
  }
}
```

### 4.3 获取订单详情
```
GET /api/v1/orders/:order_no
Authorization: Bearer <token>
Response:
{
  "code": 0,
  "data": {
    "order_no", "schedule": {...}, "adults", "children",
    "trip_fee", "rental_fee", "discount_amount", "balance_used", "total_amount",
    "contact_name", "contact_phone", "rental_items": [...],
    "status", "payment_status", "created_at"
  }
}
```

### 4.4 取消订单
```
POST /api/v1/orders/:order_no/cancel
Authorization: Bearer <token>
Request:
{
  "reason": "临时有事"
}
```

## 5. 会员模块

### 5.1 获取充值方案
```
GET /api/v1/member/plans
Response:
{
  "code": 0,
  "data": [
    { "amount": 200, "gift": 0, "discount": 0.95, "perks": "..." },
    { "amount": 500, "gift": 0, "discount": 0.90, "perks": "..." },
    { "amount": 1000, "gift": 0, "discount": 0.85, "perks": "..." }
  ]
}
```

### 5.2 发起充值
```
POST /api/v1/member/recharge
Authorization: Bearer <token>
Request:
{
  "plan": 500
}
Response:
{
  "code": 0,
  "data": {
    "recharge_id": 1,
    "payment_params": { ... }
  }
}
```

### 5.3 充值记录
```
GET /api/v1/member/recharges?page=1&size=10
Authorization: Bearer <token>
```

## 6. 装备租赁模块

### 6.1 获取可租赁装备列表
```
GET /api/v1/rental-items
Response:
{
  "code": 0,
  "data": [
    { "id", "name", "price_per_day", "stock", "status" }
  ]
}
```

## 7. 裂变模块

### 7.1 获取我的邀请信息
```
GET /api/v1/referral/my
Authorization: Bearer <token>
Response:
{
  "code": 0,
  "data": {
    "invite_code": "ABC123",
    "invite_url": "pages/index/index?invite=ABC123",
    "total_invited": 5,
    "total_reward": 100.00,
    "invited_list": [
      { "nickname", "avatar", "reward_amount", "created_at" }
    ]
  }
}
```

## 8. 管理后台 API

### 8.1 管理员登录
```
POST /api/v1/admin/auth/login
Request:
{
  "username": "admin",
  "password": "password"
}
```

### 8.2 团期管理
```
POST   /api/v1/admin/schedules          # 创建团期
GET    /api/v1/admin/schedules           # 团期列表
PUT    /api/v1/admin/schedules/:id       # 编辑团期
DELETE /api/v1/admin/schedules/:id       # 取消团期
```

### 8.3 订单管理
```
GET    /api/v1/admin/orders              # 订单列表（支持筛选）
GET    /api/v1/admin/orders/:id          # 订单详情
POST   /api/v1/admin/orders/:id/refund   # 退款
GET    /api/v1/admin/orders/export       # 导出名单
```

### 8.4 客户管理
```
GET    /api/v1/admin/customers           # 客户列表
GET    /api/v1/admin/customers/:id       # 客户详情
```

### 8.5 线路管理
```
POST   /api/v1/admin/routes              # 创建线路
GET    /api/v1/admin/routes              # 线路列表
PUT    /api/v1/admin/routes/:id          # 编辑线路
```

### 8.6 财务统计
```
GET /api/v1/admin/finance/summary?period=week   # 汇总
GET /api/v1/admin/finance/by-route              # 按线路
GET /api/v1/admin/finance/by-day                # 按天
```
