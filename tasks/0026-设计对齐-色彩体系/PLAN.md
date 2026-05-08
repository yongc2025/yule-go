# 0026 — 执行计划

## Phase 1：定义 CSS 变量（app.wxss）
- 在 app.wxss 顶部定义设计稿的 CSS 变量
- 替换全局背景色、主色、强调色

## Phase 2：逐页面替换
- index.wxss：门店头部渐变色、按钮、标签
- detail.wxss：时间线圆点、按钮、价格
- booking.wxss：按钮、表单
- orders.wxss：状态标签、按钮
- admin.wxss：概览卡片、按钮

## Phase 3：配置文件
- app.json：navigationBarBackgroundColor、tabBar.selectedColor

## Phase 4：验证
- 逐页检查无残留蓝色
- 价格显示为暖橙色
