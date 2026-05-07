# Task 0015a — 核销：码生成与展示

## 用户故事
用户支付成功后获得核销二维码，出行当天出示给领队。

## 验收标准
- [ ] AC-01: 创建 checkins 表（order_id, checkin_code, status, checked_at, operator_id）
- [ ] AC-02: 支付成功后自动生成核销码（6位随机码）
- [ ] AC-03: 小程序订单详情展示核销二维码（含核销码）

## 依赖：0014b（支付回调）
