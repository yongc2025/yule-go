<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="header">
      <view class="status-bar">
        <text class="time">9:41</text>
        <text class="icons">📶 🔋</text>
      </view>
      <view class="header-text">
        <text class="page-title">发现好店</text>
        <text class="page-subtitle">📍 芙蓉区 · 为您推荐附近门店</text>
      </view>
    </view>

    <!-- 搜索框 -->
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <text class="search-placeholder">搜索门店或活动...</text>
    </view>

    <!-- 快捷筛选 -->
    <scroll-view scroll-x class="filter-scroll">
      <view
        class="filter-item"
        :class="{ active: activeFilter === i }"
        v-for="(f, i) in filters"
        :key="f.label"
        @tap="activeFilter = i"
      >
        {{ f.emoji }} {{ f.label }}
      </view>
    </scroll-view>

    <!-- 门店列表 -->
    <view class="store-list">
      <view
        class="store-card"
        v-for="store in merchants"
        :key="store.id"
        @tap="goStoreDetail(store.id)"
      >
        <view class="store-banner" :style="{ background: store.gradient }">
          <view class="store-badge">🔥 本周{{ store.weeklyActivities }}个活动</view>
          <view class="store-banner-info">
            <view class="store-avatar">{{ store.ownerAvatar }}</view>
            <view>
              <text class="store-name">{{ store.name }}</text>
              <text class="store-stats">⭐ {{ store.rating }} · 已服务{{ store.serviceCount }}人 · 距您{{ store.distance }}km</text>
            </view>
          </view>
        </view>
        <view class="store-footer">
          <text class="store-hot">本周热门：<text class="hot-activity">{{ store.hotActivity }}</text></text>
          <view class="btn btn-primary btn-sm">去看看</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { mockMerchants } from '@/mock/data.js'

const merchants = ref(mockMerchants)
const activeFilter = ref(0)

const filters = [
  { emoji: '', label: '全部' },
  { emoji: '🎣', label: '钓鱼' },
  { emoji: '⛺', label: '露营' },
  { emoji: '👨‍👩‍👧', label: '亲子' },
  { emoji: '👴', label: '慢游' }
]

const goStoreDetail = (id) => {
  uni.navigateTo({ url: `/pages/store/detail?id=${id}` })
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';

.page {
  background: $bg-page;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.header {
  background: $primary;
  padding-bottom: 24rpx;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 40rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: white;
}

.header-text {
  padding: 24rpx 32rpx 0;
}

.page-title {
  font-size: 44rpx;
  font-weight: 800;
  color: white;
  display: block;
}

.page-subtitle {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4rpx;
  display: block;
}

/* 搜索框 */
.search-bar {
  margin: 32rpx;
  background: $bg-card;
  border-radius: $radius-full;
  padding: 20rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: $shadow-sm;
}

.search-icon { font-size: 32rpx; }
.search-placeholder { font-size: 28rpx; color: $text-tertiary; }

/* 筛选 */
.filter-scroll {
  padding: 0 32rpx 24rpx;
  white-space: nowrap;
}

.filter-item {
  display: inline-block;
  background: $bg-card;
  color: $text-secondary;
  padding: 12rpx 28rpx;
  border-radius: $radius-full;
  font-size: 26rpx;
  margin-right: 16rpx;
  border: 2rpx solid #E5E5E5;

  &.active {
    background: $primary;
    color: white;
    border-color: $primary;
    font-weight: 600;
  }
}

/* 门店卡片 */
.store-list {
  padding: 0 32rpx;
}

.store-card {
  background: $bg-card;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: $shadow-sm;
  margin-bottom: 28rpx;
}

.store-banner {
  height: 240rpx;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 28rpx;
}

.store-badge {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  font-size: 22rpx;
  background: $accent;
  color: white;
  padding: 6rpx 16rpx;
  border-radius: $radius-full;
  font-weight: 500;
}

.store-banner-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.store-avatar {
  width: 88rpx;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.4);
}

.store-name {
  color: white;
  font-size: 34rpx;
  font-weight: 700;
  display: block;
}

.store-stats {
  color: rgba(255, 255, 255, 0.7);
  font-size: 24rpx;
  display: block;
}

.store-footer {
  padding: 24rpx 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.store-hot {
  font-size: 26rpx;
  color: $text-secondary;
}

.hot-activity {
  color: $text-primary;
  font-weight: 600;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-full;
  font-weight: 600;
}

.btn-primary {
  background: $primary;
  color: white;
}

.btn-sm {
  padding: 16rpx 32rpx;
  font-size: 26rpx;
}
</style>
