# 0030 — 执行计划

## Phase 1：引入二维码库
- 选择方案：weapp-qrcode npm 包 或 Canvas API 手绘
- 集成到项目

## Phase 2：渲染二维码
- orders.wxml 中 canvas 替换为二维码组件
- orders.js 中传入核销码数据

## Phase 3：放大弹窗
- 点击二维码弹出全屏预览
- 遮罩 + 关闭按钮

## Phase 4：验证
- 二维码可扫描识别
- 弹窗交互正常
