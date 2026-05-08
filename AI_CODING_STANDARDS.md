# AI 编码规范 (AI Coding Standards)

> 适用于 yule-go 项目的所有代码：Go 后端、云函数、小程序、管理后台。
> 每次写代码前必须阅读本文件。
> 版本: v1.0 | 2026-05-08 | 适配 yule-go 项目

---

## 一、文件规范

### 1.1 文件行数上限

| 类型 | 软限制 | 硬限制 | 超限处理 |
|:---|:---|:---|:---|
| Go 文件 | ≤ 300 行 | ≤ 500 行 | 拆分为多个文件 |
| 云函数 JS 文件 | ≤ 250 行 | ≤ 400 行 | 拆分 action 到独立文件 |
| Vue 组件 | ≤ 250 行 | ≤ 400 行 | 拆分子组件 |
| uni-app 页面 JS | ≤ 250 行 | ≤ 400 行 | 提取工具函数 |
| WXML 模板 | ≤ 200 行 | ≤ 400 行 | 抽取 template |
| WXSS 样式 | ≤ 200 行 | ≤ 400 行 | 按模块拆分 |
| 配置文件 | ≤ 100 行 | ≤ 200 行 | 分环境/分模块 |
| 测试文件 | ≤ 400 行 | ≤ 600 行 | 按功能拆分 |

### 1.2 文件命名规范

```
Go 后端:
  模块文件    → snake_case.go        (order.go, user_service.go)
  测试文件    → xxx_test.go          (order_service_test.go)

云函数:
  入口文件    → index.js             (每个云函数目录一个)
  共享配置    → config.js            (shared/config.js)

Vue3 管理后台:
  组件文件    → PascalCase.vue       (OrderPanel.vue, ScheduleTable.vue)
  工具文件    → camelCase.js         (formatDate.js, useAuth.js)
  API 文件    → camelCase.js         (order.js, schedule.js)

uni-app 小程序:
  页面文件    → camelCase/           (booking/, profile/)
  组件文件    → kebab-case.vue       (schedule-card.vue)
  工具文件    → camelCase.js         (date.js, auth.js)

通用:
  配置文件    → snake_case.yaml/json (app_config.yaml)
  文档文件    → UPPER_CASE.md        (README.md, API_SPEC.md)
```

### 1.3 单文件职责

```
✅ 一个文件只做一件事:
  - order.go           → 只负责订单相关结构体和方法
  - coupons/index.js   → 只负责优惠券 CRUD
  - OrderPanel.vue     → 只负责订单展示

❌ 一个文件做多件事:
  - order_and_coupon_and_wallet.go
  - utils_that_do_everything.js
```

---

## 二、函数规范

### 2.1 函数行数上限

| 类型 | 软限制 | 硬限制 | 超限处理 |
|:---|:---|:---|:---|
| Go 业务函数 | ≤ 30 行 | ≤ 50 行 | 提取子函数 |
| 云函数 action 处理 | ≤ 40 行 | ≤ 60 行 | 提取 helper 函数 |
| 前端方法 | ≤ 30 行 | ≤ 50 行 | 提取工具函数 |
| 测试函数 | ≤ 30 行 | ≤ 50 行 | 拆分为多个 test case |

### 2.2 函数参数上限

| 参数数量 | 判定 | 处理方式 |
|:---|:---|:---|
| 1-3 个 | ✅ 正常 | 直接传参 |
| 4-5 个 | ⚠️ 偏多 | 封装为 struct / object |
| 6+ 个 | ❌ 过多 | 必须封装为对象 |

```go
// ❌ 参数过多
func CreateOrder(userID uint64, scheduleID uint64, adults uint, children uint,
    contactName string, contactPhone string, useBalance bool, remark string) error {

// ✅ 封装为结构体
type CreateOrderRequest struct {
    ScheduleID   uint64 `json:"schedule_id" binding:"required"`
    Adults       uint   `json:"adults" binding:"required,min=1"`
    Children     uint   `json:"children"`
    ContactName  string `json:"contact_name" binding:"required"`
    ContactPhone string `json:"contact_phone" binding:"required"`
    UseBalance   bool   `json:"use_balance"`
    Remark       string `json:"remark"`
}
func CreateOrder(userID uint64, req *CreateOrderRequest) error {
```

### 2.3 函数命名规范

```go
// ✅ Go: 驼峰，动词开头
func (s *orderService) Create(userID uint64, req *CreateOrderRequest) (*CreateOrderResponse, error)
func (s *orderService) GetByOrderNo(orderNo string) (*OrderResponse, error)
func calcCompanionDiscount(totalPeople int) CompanionDiscount

// ✅ JS 云函数: 驼峰，动词开头
async function getAvailableCoupons(openid, { orderType, orderAmount }) { ... }
async function grantCoupon(openid, { targetOpenid, type, amount }) { ... }
function calcCompanionDiscount(totalPeople) { ... }
```

**命名动词参考：**

| 动词 | 用途 | 示例 |
|:---|:---|:---|
| `get` / `find` / `list` | 获取数据 | `GetByOrderNo`, `listCoupons` |
| `create` / `grant` | 创建 | `Create`, `grantCoupon` |
| `update` / `use` | 更新 | `Update`, `useCoupon` |
| `delete` / `cancel` | 删除/取消 | `Cancel`, `cancelOrder` |
| `calc` / `calculate` | 计算 | `calcDiscountPreview`, `calcLevel` |
| `validate` / `check` | 验证 | `validateOrder`, `isAdmin` |

---

## 三、类/结构体规范

### 3.1 Go 结构体

```go
// ✅ 单一职责，字段有 GORM + JSON 标签
type Order struct {
    ID            uint64        `json:"id" gorm:"primaryKey;autoIncrement"`
    OrderNo       string        `json:"order_no" gorm:"size:32;not null;uniqueIndex"`
    UserID        uint64        `json:"user_id" gorm:"not null;index"`
    TotalAmount   float64       `json:"total_amount" gorm:"type:DECIMAL(10,2);not null"`
    Status        OrderStatus   `json:"status" gorm:"default:0;index"`
    CreatedAt     time.Time     `json:"created_at"`
}
```

### 3.2 云函数数据结构

```javascript
// ✅ 云数据库文档结构清晰，字段名用 camelCase
const coupon = {
    openid: target,
    type: 'travel',           // 券类型，对应 shared/config.js 的 COUPON_TYPES
    amount: 20,               // 面额（分或元，项目统一）
    minAmount: 0,             // 最低消费门槛
    source: 'recharge',       // 来源
    status: 'unused',         // unused | used | expired
    expireAt: new Date(),     // ⚠️ 必须用 Date 对象，不要用字符串
    createdAt: db.serverDate()
}
```

---

## 四、模块/目录规范

### 4.1 云函数目录结构

```
cloud-mvp/cloudfunctions/
├── shared/
│   └── config.js          ← 📌 所有业务规则集中在此
├── activities/index.js    ← 活动管理
├── booking/index.js       ← 预约（如有）
├── checkin/index.js       ← 核销
├── coupons/index.js       ← 优惠券
├── login/index.js         ← 登录注册
├── notify/index.js        ← 消息通知
├── orders/index.js        ← 订单
├── referral/index.js      ← 邀请裂变
├── schedules/index.js     ← 团期管理
├── shop/index.js          ← 门店
├── users/index.js         ← 用户
└── wallet/index.js        ← 钱包/充值
```

### 4.2 Go 后端目录结构

```
src/server/
├── main.go               # 入口
├── config/               # 配置（config.go + config.yaml）
├── router/               # 路由（按模块拆分）
├── handler/              # HTTP 处理器（入参校验 + 响应封装）
├── service/              # 业务逻辑（事务管理 + 核心逻辑）
├── repository/           # 数据访问（纯 CRUD）
├── model/                # 数据模型（GORM 标签）
├── middleware/            # 中间件
└── pkg/                  # 公共工具包
```

---

## 五、云函数编码规范（重点）

### 5.1 业务配置集中管理

```javascript
// ❌ 硬编码（散落在各云函数中）
const MEMBER_LEVELS = [
    { level: 1, travelDiscount: 10 },
    { level: 2, travelDiscount: 20 },
]
const NEWUSER_COUPON_AMOUNT = 10
const INVITE_REWARD = 20

// ✅ 从 shared/config.js 读取
const { MEMBER_LEVELS, REWARDS, COUPON_TYPES } = require('../shared/config')
// 使用: REWARDS.newuser_coupon, REWARDS.invite_cash, COUPON_TYPES.travel.amount
```

### 5.2 金额处理

```javascript
// ❌ 浮点运算精度问题
const total = 0.1 + 0.2  // 0.30000000000000004

// ✅ 用整数（分）运算，最后转元
const totalCents = 10 + 20  // 30
const totalYuan = totalCents / 100  // 0.30

// ✅ 或用 toFixed
const total = Number((0.1 + 0.2).toFixed(2))  // 0.3
```

### 5.3 日期处理

```javascript
// ❌ 字符串存储日期（类型不一致导致比较失败）
expireAt: '2026-08-06T20:17:11+08:00'
if (coupon.expireAt < now) ...  // 字符串比较，结果不可靠

// ✅ 统一用 Date 对象
expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
if (new Date(coupon.expireAt) < new Date()) ...  // 兼容字符串和 Date
```

### 5.4 错误处理

```javascript
// ❌ 吞掉错误
try {
    await db.collection('coupons').doc(couponId).get()
} catch (e) { }

// ❌ 暴露内部细节
return { code: -1, message: 'coupons collection not found' }

// ✅ 用户友好的错误信息 + 开发日志
try {
    const couponRes = await db.collection('coupons').doc(couponId).get()
    // ...
} catch (err) {
    console.error('[orders.calcDiscount] coupon fetch error:', err)
    return { code: -1, message: '优惠券查询失败，请重试' }
}
```

### 5.5 云函数返回格式

```javascript
// ✅ 统一格式
return { code: 0, data: { ... } }           // 成功
return { code: -1, message: '错误描述' }      // 失败

// ❌ 不一致
return { success: true, data: { ... } }      // 有时用 success
return { error: 'xxx' }                       // 有时用 error
```

---

## 六、Go 后端编码规范

### 6.1 错误处理

```go
// ❌ 吞掉错误
user, _ := s.userRepo.FindByID(userID)

// ❌ 返回裸 error
return err

// ✅ 包裹错误，添加上下文
user, err := s.userRepo.FindByID(userID)
if err != nil {
    return nil, fmt.Errorf("查询用户 %d 失败: %w", userID, err)
}
```

### 6.2 数据库操作

```go
// ❌ 在 Handler 中直接操作数据库
func (h *orderHandler) Create(c *gin.Context) {
    db.Create(&order)  // 违反分层
}

// ✅ 通过 Service 层
func (h *orderHandler) Create(c *gin.Context) {
    result, err := h.svc.Create(userID, &req)
}
```

### 6.3 金额字段

```go
// ❌ float64 直接存金额（精度问题）
TotalAmount float64 `json:"total_amount"`

// ✅ DECIMAL 类型
TotalAmount float64 `json:"total_amount" gorm:"type:DECIMAL(10,2);not null"`

// ✅ 运算时用工具函数保证精度
import "yule-go/pkg/util"
tripFee = util.RoundToCent(tripFee)
```

---

## 七、前端编码规范

### 7.1 Vue3 管理后台

```vue
<!-- ✅ 组合式 API + TypeScript -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { getOrderList } from '@/api/order'

const orders = ref<Order[]>([])
const loading = ref(false)

const filteredOrders = computed(() =>
  orders.value.filter(o => o.status === props.status)
)
</script>
```

### 7.2 uni-app 小程序

```javascript
// ✅ API 调用统一封装
const api = require('../../utils/api')

// ✅ 通过 api.call 调用云函数
api.call('coupons', { action: 'available', orderType: 'travel' })

// ❌ 直接调用（散落各处，无法统一错误处理）
wx.cloud.callFunction({ name: 'coupons', data: { ... } })
```

### 7.3 样式规范

```css
/* ✅ 使用 design-tokens */
@import '@/styles/design-tokens.scss';
.page { background: $bg-page; }

/* ✅ BEM 命名 */
.coupon-bar__label--active { }

/* ❌ 全局通用类名 */
.header { }  /* 污染全局 */
```

---

## 八、异常处理规范

### 8.1 云函数异常

```javascript
// ✅ 每个 action 都有 try/catch
async function getAvailableCoupons(openid, params) {
    try {
        // ... 业务逻辑
        return { code: 0, data: available }
    } catch (err) {
        console.error('[coupons.available] 查询失败:', err)
        return { code: -1, message: '查询优惠券失败，请重试' }
    }
}
```

### 8.2 Go 异常

```go
// ✅ 精确错误处理
if errors.Is(err, gorm.ErrRecordNotFound) {
    response.NotFound(c)
    return
}

// ❌ 裸捕获
if err != nil {
    response.ServerError(c)  // 丢失错误上下文
    return
}
```

### 8.3 用户侧错误信息

```
✅ 可操作:
  "名额不足，仅剩 3 位"
  "该团期不可报名"
  "优惠券已过期"
  "费用不一致，请刷新重试"

❌ 不可操作:
  "Error 50101"
  "coupons collection not found"
  "Cannot read property '_id' of undefined"
```

---

## 九、测试规范

### 9.1 测试文件组织

```
Go:
  src/server/service/order_test.go    # Service 层单元测试
  src/server/service/referral_test.go

云函数:
  目前无单元测试，依赖微信开发者工具本地调试
  TODO: 引入 jest 或 mocha 做云函数单元测试
```

### 9.2 测试命名

```go
// ✅ 被测行为 + 条件 + 预期结果
func TestCreateOrder_WhenScheduleFull_ShouldReturnError(t *testing.T) { ... }
func TestCalcCompanionDiscount_WithThreePeople_ShouldReturn45(t *testing.T) { ... }

// ❌ 模糊命名
func TestOrder(t *testing.T) { ... }
```

---

## 十、代码审查检查清单

### 提交前自检

```
□ 文件行数是否在限制内？
□ 函数行数是否在限制内？
□ 函数参数是否 ≤ 3 个？多了是否封装了？
□ 业务规则是否在 shared/config.js 中？（云函数）
□ 金额是否用了 DECIMAL 或整数运算？（禁止裸 float）
□ expireAt 是否用 Date 对象存储？
□ 错误信息是否用户友好？
□ 是否有魔法数字？
□ 日志是否有足够上下文？
□ 是否遵循了项目的已有风格？
```

### Code Review 关注点

```
□ 架构: Go 分层是否正确？云函数是否引用了 shared/config？
□ 职责: 单个文件/函数是否职责单一？
□ 边界: 错误处理是否完善？空值/零值/负值？
□ 安全: 敏感信息是否加密？是否硬编码了密钥？
□ 一致性: 云函数间配置是否统一从 shared/config 读取？
```

---

## 十一、速查表

### 一行判断法

```
文件 > 500 行?         → 拆
函数 > 50 行?          → 拆
参数 > 5 个?           → 封装
硬编码金额/天数?       → 移到 shared/config.js
expireAt 用字符串?     → 改 Date
Go 金额用 float64?     → 改 DECIMAL
云函数没 try/catch?    → 加
错误信息暴露内部细节?  → 改用户友好文案
```

### 命名速查

```
Go:       文件 snake_case.go / 函数 PascalCase(导出) 或 camelCase(私有) / 常量 UPPER_SNAKE_CASE
JS/云函数: 文件 index.js / 函数 camelCase / 常量 UPPER_SNAKE_CASE
Vue:      组件 PascalCase.vue / 页面 camelCase/
CSS:      kebab-case 或 BEM
```

---

_规范不是枷锁，是团队协作的共识。遵守规范，写出别人（和未来的自己）能读懂的代码。_
