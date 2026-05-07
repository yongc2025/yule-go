# Task 0012a — 钓场管理：后端 API

## 用户故事
平台需要维护钓场信息，供商家创建线路时关联。

## 验收标准
- [ ] AC-01: 创建 fishing_spots 表（名称、地址、经纬度、鱼种、设施、图片、联系人、营业时间、状态）
- [ ] AC-02: 钓场 CRUD API（创建/编辑/删除/列表/详情）
- [ ] AC-03: 附近钓场 API `GET /api/v1/spots/nearby?lat=&lng=&radius=`（经纬度距离排序）
- [ ] AC-04: 钓场关联线路 API `GET /api/v1/spots/:id/routes`

## 依赖：无
