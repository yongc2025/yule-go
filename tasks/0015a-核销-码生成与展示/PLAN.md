# PLAN — 核销码生成与展示

## Step 1: 建表 + Model
- migrations — checkins 表
- model/checkin.go

## Step 2: 生成逻辑
- service/checkin.go — 生成核销码
- 在支付回调成功后触发

## Step 3: 小程序展示
- pages/order/detail.vue — 展示核销二维码
