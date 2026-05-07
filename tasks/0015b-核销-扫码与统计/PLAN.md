# PLAN — 扫码核销与统计

## Step 1: 核销 API
- handler/checkin.go — 核销接口（POST /api/v1/admin/checkin）
- service/checkin.go — 核销逻辑

## Step 2: 管理后台页面
- views/checkin/CheckinPage.vue — 核销页

## Step 3: 过期处理
- scheduler — 团期结束后自动过期
