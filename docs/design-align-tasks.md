# 设计对齐 — 任务分解

> **目标**：将 cloud-mvp 实际实现对齐到 docs/design/ 设计稿
> **原则**：P0 必改 → P1 建议改 → P2 V2 再做
> **技术栈**：微信小程序原生 + 微信云开发

---

## P0 — 必须修复（3 个任务）

### Task 1：全局色彩体系对齐

**目标**：将 UI 主色从蓝色 (#1890ff) 改为设计稿的森林绿 (#2D6A4F)

**涉及文件**：
- `miniprogram/app.wxss` — 全局变量、按钮、标签
- `miniprogram/pages/index/index.wxss` — 首页样式
- `miniprogram/pages/detail/detail.wxss` — 详情页样式
- `miniprogram/pages/booking/booking.wxss` — 预约页样式
- `miniprogram/pages/orders/orders.wxss` — 订单页样式
- `miniprogram/pages/admin/admin.wxss` — 管理页样式
- `miniprogram/app.json` — tabBar 颜色配置

**具体改动**：
```
主色: #1890ff → #2D6A4F
主色浅: #096dd9 → #40916C
主色更浅: #e6f7ff → #D8F3DC
成功色: #52c41a → #2D6A4F
价格色: #f5222d → #E76F51 (暖橙)
背景色: #f5f5f5 → #F5F5F0
导航栏: #1890ff → #2D6A4F
tabBar 选中色: #1890ff → #2D6A4F
```

**验收标准**：
- [ ] 所有页面主色为森林绿
- [ ] 价格显示为暖橙色
- [ ] 背景为暖米色
- [ ] 导航栏为深绿色
- [ ] 无残留蓝色元素

---

### Task 2：TabBar 扩展（2 Tab → 4 Tab）

**目标**：将底部导航从 2 个 Tab 扩展为 4 个

**涉及文件**：
- `miniprogram/app.json` — tabBar 配置
- `miniprogram/pages/discover/` — 新建发现页目录
- `miniprogram/pages/profile/` — 新建我的页目录

**具体改动**：

1. **app.json** — 添加 tabBar 配置：
```json
{
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/discover/discover", "text": "发现" },
      { "pagePath": "pages/orders/orders", "text": "订单" },
      { "pagePath": "pages/profile/profile", "text": "我的" }
    ]
  }
}
```

2. **pages.json** — 注册新页面路径

3. **创建 Tab 图标**：8 个图标文件（4 个默认 + 4 个选中态）

**验收标准**：
- [ ] 底部显示 4 个 Tab
- [ ] Tab 切换正常
- [ ] 图标风格统一

---

### Task 3：发现页（简化版）

**目标**：创建发现页，展示门店列表

**涉及文件**：
- `miniprogram/pages/discover/discover.wxml`
- `miniprogram/pages/discover/discover.wxss`
- `miniprogram/pages/discover/discover.js`
- `miniprogram/pages/discover/discover.json`

**功能范围（MVP 简化版）**：
- 顶部标题栏
- 分类筛选标签（全部/钓鱼/露营/亲子/慢游）
- 门店卡片列表：
  - 门店头像
  - 门店名 + 评分 + 已服务人数
  - 距离（可选，MVP 可先不实现定位）
  - 本周活动数量
  - 热门活动名称 + 价格
  - "去看看"按钮 → 跳转首页并聚焦该店

**不在 MVP 范围**：
- 搜索功能（V2）
- 定位距离计算（V2）
- 门店详情独立页（V2）

**数据来源**：`merchants` 集合 + `activities` 集合聚合

**验收标准**：
- [ ] 页面正常加载
- [ ] 门店卡片展示正确
- [ ] 分类筛选可用
- [ ] 点击可跳转

---

### Task 4：我的页（简化版）

**目标**：创建个人中心页

**涉及文件**：
- `miniprogram/pages/profile/profile.wxml`
- `miniprogram/pages/profile/profile.wxss`
- `miniprogram/pages/profile/profile.js`
- `miniprogram/pages/profile/profile.json`

**功能范围（MVP 简化版）**：
- 用户头像 + 昵称（微信信息）
- 我的门店（去过的店，从 user_shops 集合读取）
  - 主场店标记
  - 距离 + 本周活动数
  - 箭头跳转
- 快捷入口列表：
  - 📋 我的订单 → 跳转订单页
  - 📞 联系客服 → 拨打电话
  - 🔍 发现新门店 → 跳转发现页

**不在 MVP 范围**：
- 会员等级/余额（V2）
- 会员充值（V2）
- 邀请好友（V2）

**数据来源**：
- 用户信息：`wx.getUserProfile()` + `users` 集合
- 门店关系：`user_shops` 集合

**验收标准**：
- [ ] 用户信息展示正确
- [ ] 我的门店列表正常
- [ ] 快捷入口跳转正常

---

### Task 5：订单核销码二维码生成

**目标**：为已支付订单生成可扫描的二维码

**涉及文件**：
- `miniprogram/pages/orders/orders.js` — 生成二维码逻辑
- `miniprogram/pages/orders/orders.wxml` — 二维码展示
- `miniprogram/pages/orders/orders.wxss` — 二维码样式
- `miniprogram/utils/qrcode.js` — 新增二维码生成工具库

**具体改动**：

1. 引入轻量二维码生成库（如 `weapp-qrcode` 或手写 Canvas 绘制）
2. 在订单卡片的 `checkin-section` 中，将 canvas 替换为实际二维码
3. 二维码内容：核销码 6 位数字（或包含订单 ID 的 JSON）
4. 支持点击放大展示（全屏弹窗）

**验收标准**：
- [ ] 已支付订单显示二维码
- [ ] 二维码可被扫码识别
- [ ] 点击可放大展示
- [ ] 核销码数字大号绿色显示

---

## P1 — 建议修复（4 个任务）

### Task 6：首页门店头部增强

**目标**：补充门店信息展示

**涉及文件**：
- `miniprogram/pages/index/index.wxml`
- `miniprogram/pages/index/index.wxss`

**新增内容**：
- 地址（📍 + 地址文本）
- 电话（📞 + 电话号码）
- 营业时间（🕐 + 时间段）
- 好评率（如 96%）
- 开店时长（如 3 年）
- 导航按钮 + 拨打按钮

**数据来源**：`merchants` 集合已有 `address`、`phone` 字段，需新增 `approvalRate`、`businessYears` 字段或从现有数据计算。

**验收标准**：
- [ ] 门店头部展示地址/电话/营业时间
- [ ] 好评率和开店时长显示
- [ ] 导航/拨打按钮可点击

---

### Task 7：活动卡片类型图标

**目标**：为活动卡片添加类型图标

**涉及文件**：
- `miniprogram/pages/index/index.wxml`
- `miniprogram/pages/index/index.wxss`
- `miniprogram/pages/index/index.js`

**改动**：
- 在 `TYPE_MAP` 中添加图标映射
- 活动卡片封面左上角显示图标（替代纯文字标签）

```javascript
const TYPE_ICON_MAP = {
  fishing: '🎣',
  camping: '⛺',
  family: '👨👩👧',
  senior: '👴',
  wild_fishing: '🎣'
}
```

**验收标准**：
- [ ] 每种活动类型显示对应图标
- [ ] 图标与文字标签并存

---

### Task 8：活动详情 — 集合地点模块

**目标**：在活动详情页添加集合地点信息

**涉及文件**：
- `miniprogram/pages/detail/detail.wxml`
- `miniprogram/pages/detail/detail.wxss`

**新增模块**（放在取消政策之后）：
```html
<!-- 集合地点 -->
<view class="card" wx:if="{{activity.meetingPoint}}">
  <view class="section-title">📍 集合地点</view>
  <view class="meeting-point">
    <view class="meeting-info">
      <text class="meeting-name">🏪 {{activity.meetingPoint.name || shopInfo.name}}</text>
      <text class="meeting-addr">{{activity.meetingPoint.address || shopInfo.address}}</text>
    </view>
    <view class="btn-outline btn-sm" bindtap="openNavigation">🧭 导航</view>
  </view>
</view>
```

**数据来源**：`activities` 集合新增 `meetingPoint` 字段，或直接用 `merchants` 的地址。

**验收标准**：
- [ ] 集合地点模块正常显示
- [ ] 导航按钮调用 `wx.openLocation`

---

### Task 9：首页下拉刷新 + 空状态优化

**目标**：完善首页交互体验

**涉及文件**：
- `miniprogram/pages/index/index.json` — 启用下拉刷新
- `miniprogram/pages/index/index.wxml` — 优化空状态

**改动**：
1. `index.json` 中启用 `"enablePullDownRefresh": true`
2. 空状态文案优化为设计稿风格
3. 名额 ≤3 位时的橙色警告样式对齐设计稿

**验收标准**：
- [ ] 下拉刷新正常工作
- [ ] 空状态展示友好
- [ ] 名额警告样式正确

---

## 执行建议

### 执行顺序

```
Task 1 (色彩) → Task 2 (TabBar) → Task 3 (发现页) + Task 4 (我的页) → Task 5 (二维码)
→ Task 6 (首页增强) → Task 7 (卡片图标) → Task 8 (集合地点) → Task 9 (交互优化)
```

### 注意事项

1. **Task 1 应最先执行**，因为后续所有任务都基于新色彩体系
2. **Task 2-4 是关联任务**，TabBar 扩展需要发现页和我的页就位
3. **每个 Task 完成后**，更新 `memory-bank/progress.md`
4. **V2 功能**（装备租赁、会员体系、天气预报等）不在本次调整范围

### 预估工时

| 任务 | 预估 | 复杂度 |
|:-----|:-----|:------:|
| Task 1 色彩对齐 | 1h | 低 |
| Task 2 TabBar 扩展 | 2h | 中 |
| Task 3 发现页 | 3h | 中 |
| Task 4 我的页 | 2h | 中 |
| Task 5 二维码 | 2h | 中 |
| Task 6 首页增强 | 1h | 低 |
| Task 7 卡片图标 | 0.5h | 低 |
| Task 8 集合地点 | 1h | 低 |
| Task 9 交互优化 | 0.5h | 低 |
| **合计** | **~13h** | — |
