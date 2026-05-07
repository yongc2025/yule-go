# TODO — 钓场后端 API

- [x] 1. 创建 migrations/003_fishing_spots.sql — fishing_spots 表 + routes 补充 fishing_spot_id
- [x] 2. 创建 model/spot.go — FishingSpot + StringArray + 请求/响应结构体
- [x] 3. 创建 repository/spot.go — CRUD + Nearby (Haversine) + ListRoutesBySpotID
- [x] 4. 创建 service/spot.go — 业务逻辑
- [x] 5. 创建 handler/spot.go — CRUD + nearby + routes（管理端 + 小程序端）
- [x] 6. 创建 router/spot.go + main.go 注册
- [x] 7. 更新 model/route.go — 新增 FishingSpotID 字段
- [ ] 8. curl 验证全部接口（需 Go 环境 + MySQL）
