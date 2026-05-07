# PLAN — 钓场后端 API

## Step 1: 建表
- migrations/ — fishing_spots DDL

## Step 2: Model + Repository + Service + Handler
- model/spot.go — FishingSpot 模型
- repository/spot.go — CRUD + nearby 查询
- service/spot.go — 业务逻辑
- handler/spot.go — HTTP 接口
- router/spot.go — 路由注册

## Step 3: 验证
