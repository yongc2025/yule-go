<template>
  <view class="order-list-page">
    <!-- 状态筛选 -->
    <view class="filter-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @tap="switchTab(tab.value)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading && !orders.length" class="loading-wrap">
      <view class="loading-spinner"></view>
      <text>加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="!loading && !orders.length" class="empty-wrap">
      <text class="empty-icon">📋</text>
      <text class="empty-title">暂无订单</text>
      <text class="empty-desc">去团期页面看看吧</text>
    </view>

    <!-- 订单列表 -->
    <view v-else class="order-cards">
      <view
        v-for="order in orders"
        :key="order.order_no"
        class="order-card"
        @tap="goDetail(order.order_no)"
      >
        <!-- 头部：线路 + 状态 -->
        <view class="card-top">
          <text class="route-name">{{ order.route_name || '未知线路' }}</text>
          <text class="order-status" :class="'status-' + order.status">{{ order.status_text }}</text>
        </view>

        <!-- 信息行 -->
        <view class="card-info">
          <view class="info-item">
            <text class="info-icon">📅</text>
            <text>{{ formatDateCN(order.trip_date) }}</text>
          </view>
          <view class="info-item">
            <text class="info-icon">👥</text>
            <text>{{ order.adults }}成人{{ order.children > 0 ? ' + ' + order.children + '儿童' : '' }}</text>
          </view>
        </view>

        <!-- 底部：金额 + 时间 -->
        <view class="card-bottom">
          <text class="order-time">{{ formatTime(order.created_at) }}</text>
          <text class="order-amount">¥{{ order.total_amount.toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view v-if="hasMore && !loading" class="load-more" @tap="loadMore">
      <text>加载更多</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { orderApi } from '../../api/order'
import { formatDateCN } from '../../utils/date'

// --- 状态 ---
const loading = ref(false)
const orders = ref([])
const currentTab = ref(-1) // -1 = 全部
const page = ref(1)
const hasMore = ref(true)

const tabs = [
  { label: '全部', value: -1 },
  { label: '待支付', value: 0 },
  { label: '已确认', value: 1 },
  { label: '已完成', value: 3 },
  { label: '已取消', value: 4 }
]

// --- 方法 ---
async function fetchOrders(reset = false) {
  if (reset) {
    page.value = 1
    hasMore.value = true
    orders.value = []
  }

  loading.value = true
  try {
    const params = {
      page: page.value,
      page_size: 10
    }
    if (currentTab.value >= 0) {
      params.status = currentTab.value
    }

    const res = await orderApi.list(params)
    const list = res.data?.list || []

    if (reset) {
      orders.value = list
    } else {
      orders.value.push(...list)
    }

    hasMore.value = list.length >= 10
  } catch (e) {
    console.error('获取订单失败', e)
  } finally {
    loading.value = false
  }
}

function switchTab(value) {
  currentTab.value = value
  fetchOrders(true)
}

function loadMore() {
  page.value++
  fetchOrders()
}

function goDetail(orderNo) {
  uni.navigateTo({
    url: `/pages/order/detail?order_no=${orderNo}`
  })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// --- 生命周期 ---
onMounted(() => {
  fetchOrders(true)
})

onPullDownRefresh(() => {
  fetchOrders(true).finally(() => {
    uni.stopPullDownRefresh()
  })
})
</script>

<style lang="scss" scoped>
.order-list-page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  background: #fff;
  padding: 16rpx 24rpx;
  gap: 16rpx;
  border-bottom: 1rpx solid #eee;
  overflow-x: auto;
  white-space: nowrap;
}

.tab-item {
  padding: 12rpx 28rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  color: #666;
  background: #f5f5f5;
  flex-shrink: 0;

  &.active {
    background: #e6f7ff;
    color: #1890ff;
    font-weight: 500;
  }
}

/* 加载 & 空状态 */
.loading-wrap, .empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #e6f7ff;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-title {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
}

/* 订单卡片 */
.order-cards {
  padding: 20rpx 24rpx;
}

.order-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);

  &:active {
    background: #fafafa;
  }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.route-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.order-status {
  font-size: 24rpx;
  font-weight: 500;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.status-0 {
  color: #faad14;
  background: #fffbe6;
}

.status-1 {
  color: #1890ff;
  background: #e6f7ff;
}

.status-2 {
  color: #722ed1;
  background: #f9f0ff;
}

.status-3 {
  color: #52c41a;
  background: #f6ffed;
}

.status-4, .status-5 {
  color: #999;
  background: #f5f5f5;
}

.card-info {
  display: flex;
  gap: 32rpx;
  margin-bottom: 20rpx;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #666;
}

.info-icon {
  margin-right: 8rpx;
  font-size: 24rpx;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.order-time {
  font-size: 24rpx;
  color: #999;
}

.order-amount {
  font-size: 32rpx;
  font-weight: 600;
  color: #ff4d4f;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 24rpx 0 48rpx;
  font-size: 26rpx;
  color: #1890ff;
}
</style>
