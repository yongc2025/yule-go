# AI 编码规范 (AI Coding Standards)

> 前台 + 后台代码的文件大小、函数长度、命名、模块组织等硬性约束。
> 版本: v1.0 | 2026-05-03

---

## 一、文件规范

### 1.1 文件行数上限

| 类型            | 软限制   | 硬限制   | 超限处理             |
| --------------- | -------- | -------- | -------------------- |
| Python 后台文件 | ≤ 300 行 | ≤ 500 行 | 拆分为多个模块       |
| JS/TS 前台文件  | ≤ 250 行 | ≤ 400 行 | 拆分为组件/工具      |
| HTML 模板文件   | ≤ 200 行 | ≤ 400 行 | 抽取 partial/include |
| CSS/样式文件    | ≤ 200 行 | ≤ 400 行 | 按模块拆分           |
| 配置文件        | ≤ 100 行 | ≤ 200 行 | 分环境/分模块        |
| 测试文件        | ≤ 400 行 | ≤ 600 行 | 按功能拆分文件       |

### 1.2 文件命名规范

```text
Python 后台:
  模块文件    → snake_case.py        (order_engine.py, user_service.py)
  类文件      → snake_case.py        (一个文件一个主类)
  测试文件    → test_xxx.py          (test_order_engine.py)
  工具文件    → utils.py / helpers.py

JS/TS 前台:
  组件文件    → PascalCase.vue/jsx   (OrderPanel.vue, TradeForm.jsx)
  工具文件    → camelCase.js         (formatPrice.js, useWebSocket.js)
  样式文件    → kebab-case.css       (trade-panel.css, order-table.css)
  常量文件    → UPPER_CASE.js        (CONSTANTS.js)

通用:
  配置文件    → snake_case.yaml/json (app_config.yaml, trade_settings.json)
  文档文件    → UPPER_CASE.md        (README.md, API_SPEC.md)
```

### 1.3 单文件职责

```text
✅ 一个文件只做一件事:
  - order_engine.py    → 只负责订单执行逻辑
  - stoploss.py        → 只负责止损逻辑
  - PositionPanel.vue  → 只负责持仓展示

❌ 一个文件做多件事:
  - order_and_stoploss_and_position.py
  - utils_that_do_everything.py
  - AllComponents.vue
```

---

## 二、函数规范

### 2.1 函数行数上限

| 类型            | 软限制  | 硬限制  | 超限处理             |
| --------------- | ------- | ------- | -------------------- |
| 业务逻辑函数    | ≤ 30 行 | ≤ 50 行 | 提取子函数           |
| 数据处理函数    | ≤ 40 行 | ≤ 60 行 | 分步骤提取           |
| UI 渲染函数     | ≤ 50 行 | ≤ 80 行 | 拆分子组件           |
| 初始化/配置函数 | ≤ 30 行 | ≤ 50 行 | 分阶段提取           |
| 测试函数        | ≤ 30 行 | ≤ 50 行 | 拆分为多个 test case |

### 2.2 函数行数快速判断

```text
一个函数如果需要滚动屏幕才能看完 → 太长了，拆它
一个函数的注释比代码还多        → 逻辑太复杂，重构它
一个函数有 3 层以上 if/for 嵌套  → 太深了，用 guard clause 或提取
```

### 2.3 函数参数上限

| 参数数量 | 判定    | 处理方式                              |
| -------- | ------- | ------------------------------------- |
| 1-3 个   | ✅ 正常 | 直接传参                              |
| 4-5 个   | ⚠️ 偏多 | 考虑用 dataclass / dict / object 封装 |
| 6+ 个    | ❌ 过多 | 必须封装为对象                        |

```python
# ❌ 参数过多
def place_order(symbol, direction, price, quantity, notional, order_type, leverage, tier, timeout):
    ...

# ✅ 封装为对象
@dataclass
class OrderRequest:
    symbol: str
    direction: str
    price: float
    quantity: int
    order_type: str = "limit"
    leverage: int = 3

def place_order(req: OrderRequest) -> dict:
    ...
```

### 2.4 函数命名规范

```python
# ✅ 动词开头，清晰表达意图
def calculate_stoploss_price(entry_price, direction):
def validate_order(direction, leverage, balance):
def sync_positions():
def close_all_positions():

# ❌ 模糊命名
def process(data):
def handle_stuff():
def do_it():
def calc(a, b):
```

**命名动词参考：**

| 动词                 | 用途        | 示例                                       |
| -------------------- | ----------- | ------------------------------------------ |
| `get` / `fetch`      | 获取数据    | `get_balance()`, `fetch_ticker()`          |
| `set` / `update`     | 设置/更新   | `set_leverage()`, `update_stoploss()`      |
| `create` / `insert`  | 创建/插入   | `create_order()`, `insert_trade()`         |
| `delete` / `remove`  | 删除        | `delete_credential()`, `remove_favorite()` |
| `validate` / `check` | 验证/检查   | `validate_order()`, `check_connection()`   |
| `calculate` / `calc` | 计算        | `calculate_pnl()`, `calc_avg_price()`      |
| `convert` / `format` | 转换/格式化 | `convert_currency()`, `format_price()`     |
| `is` / `has` / `can` | 布尔判断    | `is_connected()`, `has_position()`         |
| `on` / `handle`      | 事件处理    | `on_tick()`, `handle_disconnect()`         |

---

## 三、类规范

### 3.1 类行数上限

| 类型       | 软限制   | 硬限制   | 超限处理         |
| ---------- | -------- | -------- | ---------------- |
| 核心业务类 | ≤ 200 行 | ≤ 350 行 | 拆分职责         |
| 工具类     | ≤ 100 行 | ≤ 200 行 | 拆分为多个工具   |
| 数据模型类 | ≤ 80 行  | ≤ 150 行 | 拆分为多个 Model |
| 前端组件类 | ≤ 150 行 | ≤ 250 行 | 拆分子组件       |

### 3.2 类职责（单一职责原则）

```
✅ 一个类只负责一件事:
  class OrderEngine      → 只负责下单/平仓
  class StoplossEngine   → 只负责止损逻辑
  class RiskController   → 只负责风控校验
  class PositionManager  → 只负责持仓管理

❌ 一个类管所有事:
  class TradingSystem:   → 下单、止损、风控、持仓、日志全塞一起
```

### 3.3 类方法数量

| 方法数量 | 判定              |
| -------- | ----------------- |
| 3-8 个   | ✅ 合理           |
| 9-15 个  | ⚠️ 偏多，考虑拆分 |
| 16+ 个   | ❌ 过多，必须重构 |

---

## 四、模块/目录规范

### 4.1 目录层级

```
最大深度: 3 层

✅ 合理:
  trading/
  ├── api/           # 接口层
  ├── core/          # 基础层
  ├── engine/        # 引擎层
  └── data/          # 数据层

❌ 过深:
  trading/
  ├── api/
  │   ├── rest/
  │   │   ├── v1/
  │   │   │   ├── handlers/    # 4 层了，太深
```

### 4.2 单个目录文件数

| 文件数量 | 判定    | 处理方式     |
| -------- | ------- | ------------ |
| 1-5 个   | ✅ 精简 | -            |
| 6-10 个  | ⚠️ 偏多 | 考虑分组     |
| 11+ 个   | ❌ 过多 | 必须分子目录 |

### 4.3 模块依赖规则

```
依赖方向: 上层 → 下层（单向）

  前台 (templates/js)
    ↓ 调用
  API 层 (api/)
    ↓ 调用
  引擎层 (engine/)
    ↓ 调用
  数据层 (data/) + 核心层 (core/)

❌ 禁止:
  - data/ 调用 engine/
  - core/ 调用 api/
  - 同层模块互相调用（除非通过接口）
```

---

## 五、前端代码规范

### 5.1 组件拆分原则

```
单个 Vue/React 组件:
  - 模板/JSX 部分  ≤ 100 行
  - 脚本部分       ≤ 150 行
  - 样式部分       ≤ 50 行
  - 总计           ≤ 300 行

超限 → 拆分子组件
```

### 5.2 组件命名

```
✅ PascalCase:  OrderPanel.vue, TradeForm.vue, PositionTable.vue
❌ kebab-case:  order-panel.vue (组件不推荐)
❌ snake_case:  order_panel.vue
```

### 5.3 状态管理

```
本地状态 (组件内):
  - 纯 UI 状态（弹窗开关、loading、表单输入）
  - 不需要跨组件共享的数据

全局状态 (store/context):
  - 用户登录状态
  - 连接状态
  - 持仓数据
  - 实时价格
  - 配置项
```

### 5.4 CSS/样式规范

```
✅ BEM 命名或 scoped:
  .trade-panel__header--active { }
  <style scoped>

❌ 全局类名:
  .header { }        ← 会污染全局
  .box { }           ← 太通用
  .div { }           ← 不要用标签名做类名
```

### 5.5 API 调用规范

```
✅ 统一 API 层:
  // api/trade.js
  export async function placeOrder(req) { ... }
  export async function closeAll() { ... }

❌ 组件内直接 fetch:
  // TradePanel.vue
  fetch('/api/order', { method: 'POST', body: ... })  ← 散落各处
```

---

## 六、后台代码规范

### 6.1 分层规范

```
API 层 (api/):
  - 路由定义
  - 参数解析与校验
  - 调用引擎层
  - 返回响应
  - ❌ 不放业务逻辑

引擎层 (engine/):
  - 核心业务逻辑
  - 编排多个服务
  - ❌ 不直接操作数据库（通过 data 层）
  - ❌ 不处理 HTTP 细节

数据层 (data/):
  - 数据库 CRUD
  - 数据格式转换
  - ❌ 不放业务判断

核心层 (core/):
  - 基础设施（加密、日志、配置、会话）
  - ❌ 不依赖业务模块
```

### 6.2 异步函数规范

```python
# ✅ 异步函数用 async def
async def get_balance() -> dict:
    resp = await self.rest.get_balance()
    return resp

# ❌ 异步函数里用同步阻塞
async def get_balance() -> dict:
    resp = requests.get(url)  ← 阻塞了整个事件循环！
    return resp

# ✅ 同步阻塞操作用 asyncio.to_thread
async def heavy_computation():
    result = await asyncio.to_thread(cpu_intensive_function)
```

### 6.3 数据库操作规范

```python
# ✅ 参数化查询
db.fetchall("SELECT * FROM trades WHERE symbol=?", (symbol,))

# ❌ 字符串拼接（SQL 注入风险）
db.fetchall(f"SELECT * FROM trades WHERE symbol='{symbol}'")

# ✅ 事务操作
with db.transaction():
    db.insert_trade(...)
    db.update_stoploss(...)

# ❌ 分散操作（失败时数据不一致）
db.insert_trade(...)
# 如果这里崩了，stoploss 就没更新
db.update_stoploss(...)
```

### 6.4 日志规范

```python
# ✅ 结构化日志
log.info(f"下单完成: {symbol} {direction} {quantity}张@{price} ({latency:.1f}ms)")
log.error(f"下单失败: {symbol} {direction} - {'; '.join(error_msgs)}")

# ❌ 无上下文日志
log.info("下单完成")
log.error("出错了")

# 日志级别:
# DEBUG  → 开发调试信息（生产环境关闭）
# INFO   → 关键业务操作（下单、平仓、连接）
# WARNING → 可恢复的异常（撤单重试、WS 重连）
# ERROR  → 需要关注的错误（下单失败、连接断开）
# CRITICAL → 系统级故障（数据库损坏、加密失败）
```

---

## 七、异常处理规范

### 7.1 异常捕获粒度

```python
# ✅ 精确捕获
try:
    await rest.place_order(...)
except httpx.ConnectError:
    return {"error": "网络连接失败，请检查代理"}
except httpx.TimeoutException:
    return {"error": "请求超时，请稍后重试"}

# ❌ 裸捕获（吞掉所有异常，调试困难）
try:
    await rest.place_order(...)
except Exception as e:
    return {"error": str(e)}
```

### 7.2 错误信息规范

```python
# ✅ 用户侧错误：可操作
"API Key 与环境不匹配，请检查是否在实盘使用了模拟盘 Key"
"网络连接失败，请检查代理端口 (127.0.0.1:10808) 是否开启"
"可用余额不足，需要至少 1500 USDT"

# ❌ 用户侧错误：不可操作
"Error 50101"
"ConnectionRefusedError: [Errno 111] Connection refused"
"NoneType object has no attribute 'get'"

# ✅ 开发侧日志：详细上下文
log.error(f"下单异常: symbol={symbol} direction={direction} err={e}")

# ❌ 开发侧日志：无上下文
log.error(f"Error: {e}")
```

### 7.3 错误返回格式

```python
# ✅ 统一格式
{"error": "用户友好的错误描述"}           # 失败
{"status": "ok", "data": ...}             # 成功
{"status": "ok", "message": "操作成功"}   # 成功（无数据）

# ❌ 不一致的格式
{"msg": "..."}       # 有时用 msg
{"error": "..."}     # 有时用 error
{"detail": "..."}    # 有时用 detail
{"success": True}    # 有时用 success
```

---

## 八、测试规范

### 8.1 测试文件组织

```
tests/
├── test_unit_order.py        # 单元测试: 订单引擎
├── test_unit_stoploss.py     # 单元测试: 止损引擎
├── test_unit_risk.py         # 单元测试: 风控
├── test_integration.py       # 集成测试: 端到端流程
├── mock_okx.py              # Mock 工具
└── diagnostic.py            # 诊断工具
```

### 8.2 测试命名

```python
# ✅ 测试名包含：被测行为 + 条件 + 预期结果
def test_validate_order_with_excess_leverage_returns_error():
def test_split_order_below_threshold_returns_single_order():
def test_close_all_with_no_positions_returns_empty():

# ❌ 模糊命名
def test_order():
def test_case_1():
def test_it():
```

### 8.3 测试覆盖要求

```
核心引擎 (engine/)  → 单元测试覆盖率 ≥ 80%
API 层 (api/)       → 集成测试覆盖主流程
数据层 (data/)      → CRUD 操作测试
核心层 (core/)      → 加密/解密、会话管理测试
```

---

## 九、配置规范

### 9.1 配置分类

```python
# ✅ 分类组织，注释清晰
# ============================================================
# 网络配置
# ============================================================
PROXY_URL = "http://127.0.0.1:10808"

# ============================================================
# 交易参数
# ============================================================
DEFAULT_LEVERAGE_LONG = 3
SPLIT_THRESHOLD_USDT = 800

# ❌ 一股脑堆在一起
PROXY_URL = "http://127.0.0.1:10808"
DEFAULT_LEVERAGE_LONG = 3
LOG_MAX_DAYS = 90
```

### 9.2 魔法数字消除

```python
# ❌ 魔法数字
if notional > 800:
    split(...)
if leverage > 3:
    reject(...)
timeout = 3

# ✅ 命名常量
SPLIT_THRESHOLD_USDT = 800
MAX_LEVERAGE_LONG = 3
LIMIT_TO_MARKET_TIMEOUT = 3

if notional > SPLIT_THRESHOLD_USDT:
    split(...)
if leverage > MAX_LEVERAGE_LONG:
    reject(...)
timeout = LIMIT_TO_MARKET_TIMEOUT
```

---

## 十、代码审查检查清单

### 提交前自检

```
□ 文件行数是否在限制内？
□ 函数行数是否在限制内？
□ 函数参数是否 ≤ 3 个？多了是否封装了？
□ 是否有裸 except Exception？
□ 错误信息是否用户友好？
□ 日志是否有足够上下文？
□ 是否有魔法数字？
□ 是否有 SQL 字符串拼接？
□ 异步函数里是否有同步阻塞调用？
□ 类/函数命名是否清晰表达意图？
□ 是否遵循了项目的已有风格？
```

### Code Review 关注点

```
□ 架构: 分层是否正确？有没有跨层调用？
□ 职责: 单个文件/类/函数是否职责单一？
□ 边界: 错误处理是否完善？空值/零值/负值？
□ 安全: 敏感信息是否加密？SQL 注入？XSS？
□ 性能: 是否有 N+1 查询？不必要的循环？同步阻塞？
□ 可维护: 命名是否清晰？注释是否必要且准确？
```

---

## 十一、速查表

### 一行判断法

```
文件 > 500 行?    → 拆
函数 > 50 行?     → 拆
参数 > 5 个?      → 封装
类方法 > 15 个?   → 拆职责
嵌套 > 3 层?      → 提取/guard clause
目录文件 > 10 个? → 分子目录
注释比代码多?     → 重构逻辑
```

### 命名速查

```
文件:   snake_case.py / PascalCase.vue
函数:   snake_case() / camelCase()
类:     PascalCase
常量:   UPPER_SNAKE_CASE
CSS:    kebab-case 或 BEM
```

---

_规范不是枷锁，是团队协作的共识。遵守规范，写出别人（和未来的自己）能读懂的代码。_
