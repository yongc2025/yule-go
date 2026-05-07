<template>
  <view class="page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <text class="nav-title">我的订单</text>
    </view>

    <!-- 状态筛选 -->
    <view class="filter-bar">
      <view
        class="filter-item"
        :class="{ active: activeTab === i }"
        v-for="(tab, i) in tabs"
        :key="tab"
        @tap="activeTab = i"
      >
        {{ tab }}
      </view>
    </view>

    <!-- 按门店分组 -->
    <view class="order-group">
      <view class="group-header">
        <view class="group-icon">👨‍🌾</view>
        <text class="group-name">老王渔具</text>
      </view>

      <view
        class="order-card"
        v-for="order in filteredOrders"
        :key="order.id"
        @tap="goOrderDetail(order)"
      >
        <view class="order-top">
          <text class="order-date">{{ order.date }} {{ order.dayOfWeek }}</text>
          <text class="order-status" :class="order.status">{{ order.statusText }}</text>
        </view>
        <view class="order-body">
          <view class="order-icon" :style="{ background: order.gradient }">{{ order.activityEmoji }}</view>
          <view class="order-info">
            <text class="order-name">{{ order.activityName }}</text>
            <text class="order-meta">
              {{ order.adultCount }}成人{{ order.childCount > 0 ? ' · ' + order.childCount + '儿童' : '' }} · {{ order.collectionTime }}集合
            </text>
          </view>
          <text class="order-amount">¥{{ order.totalAmount.toFixed(2) }}</text>
        </view>

        <!-- 核销码（已支付状态） -->
        <view class="checkin-section" v-if="order.status === 'paid'">
          <view class="checkin-info">
            <text class="checkin-label">核销码</text>
            <text class="checkin-code">{{ formatCode(order.checkinCode) }}</text>
          </view>
          <view class="checkin-qr">QR码</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mockOrders } from '@/mock/data.js'

const activeTab = ref(1) // 默认"已支付"
const tabs = ['全部', '已支付', '已完成', '已取消']

const statusMap = { 0: '', 1: 'paid', 2: 'completed', 3: 'cancelled' }

const filteredOrders = computed(() => {
  if (activeTab.value === 0) return mockOrders
  const status = Object.values(statusMap)[activeTab.value]
  return mockOrders.filter(o => o.status === status)
})

const formatCode = (code) => {
  return code.split('').join(' ')
}

const goOrderDetail = (order) => {
  uni.navigateTo({ url: `/pages/order/detail?orderNo=${order.orderNo}` })
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';

.page {
  background: $bg-page;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.nav-bar {
  background: $bg-card;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 2rpx solid #F0F0F0;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 600;
}

/* 筛选 */
.filter-bar {
  display: flex;
  background: $bg-card;
  border-bottom: 2rpx solid #F0F0F0;
  padding: 0 16rpx;
}

.filter-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: $text-tertiary;
  position: relative;

  &.active {
    color: $primary;
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 30%;
      right: 30%;
      height: 4rpx;
      background: $primary;
      border-radius: 2rpx;
    }
  }
}

/* 门店分组 */
.order-group {
  padding: 32rpx;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.group-icon {
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, #F4A261, #E76F51);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.group-name {
  font-size: 28rpx;
  font-weight: 600;
}

/* 订单卡片 */
.order-card {
  background: $bg-card;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: $shadow-sm;
  margin-bottom: 24rpx;
}

.order-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.order-date {
  font-size: 26rpx;
  color: $text-tertiary;
}

.order-status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: $radius-full;
  font-weight: 500;

  &.paid {
    background: $primary-bg;
    color: $primary;
  }

  &.completed {
    background: #E8F5E9;
    color: $primary;
  }

  &.cancelled {
    background: #FEE2E2;
    color: $danger;
  }
}

.order-body {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.order-icon {
  width: 112rpx;
  height: 112rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
}

.order-info {
  flex: 1;
}

.order-name {
  font-size: 30rpx;
  font-weight: 600;
  display: block;
}

.order-meta {
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 6rpx;
  display: block;
}

.order-amount {
  font-size: 34rpx;
  font-weight: 700;
  color: $accent;
}

/* 核销码 */
.checkin-section {
  margin-top: 24rpx;
  background: $primary-bg-light;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkin-info { flex: 1; }

.checkin-label {
  font-size: 24rpx;
  color: $primary;
  font-weight: 600;
  display: block;
}

.checkin-code {
  font-size: 40rpx;
  font-weight: 800;
  color: $primary;
  letter-spacing: 6rpx;
  margin-top: 4rpx;
  display: block;
}

.checkin-qr {
  width: 112rpx;
  height: 112rpx;
  background: white;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: $text-tertiary;
}
</style>
