# 0040 活动管理补全 — 执行计划

## Step 1：活动编辑页 UI（独立页面替代弹窗）
- 新建 `pages/admin/activity-edit.wxml/js/wxss`
- 页面结构：分区块表单（基本信息、图片、亮点、行程、包含/不含、须知）
- 底部固定保存按钮
- 从活动列表页跳转：新建 → 空表单，编辑 → 加载已有数据回显

## Step 2：图片上传
- 使用 `wx.cloud.uploadFile` 上传到云存储
- 图片选择器（最多 9 张），支持预览、删除、拖拽排序
- 保存时将云存储 fileID 写入 `images[]`
- `coverImage` 取第一张图

## Step 3：亮点标签
- 预设标签：含午餐、车接车送、新手友好、亲子推荐、野钓、装备提供
- 支持自定义输入
- 以 tag 形式展示，可逐个删除

## Step 4：行程安排（时间线编辑）
- 可增删行：每行 = 时间（picker） + 描述（input）
- 保存为 `itinerary: [{time, desc}]`

## Step 5：费用包含/不包含
- 两个独立列表区域
- 每个列表可增删行，每行一个文本项
- 保存为 `includes: [string]` 和 `excludes: [string]`

## Step 6：出行须知
- 多行文本域（textarea）

## Step 7：云函数 activities 更新
- `create` action 支持接收全部新字段
- `update` action 支持更新全部新字段
- 字段校验（价格 > 0，名称非空等）

## Step 8：详情页兼容性检查
- 确认详情页对空字段的优雅降级（wx:if 控制）
- 已有 seed 数据不受影响
