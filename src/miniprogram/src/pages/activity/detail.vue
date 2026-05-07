<template>
  <view class="page">
    <!-- 头图 -->
    <view class="header-image" :style="{ background: activity.gradient }">
      <view class="status-bar">
        <text class="time">9:41</text>
        <text class="icons">📶 🔋</text>
      </view>
      <view class="back-btn" @tap="goBack">←</view>
      <view class="action-btns">
        <view class="action-btn">⭐</view>
        <view class="action-btn">↗</view>
      </view>
      <view class="header-badges">
        <text class="badge-accent">🔥 热门</text>
        <text class="badge-white">🎣 钓鱼</text>
      </view>
    </view>

    <!-- 活动标题 -->
    <view class="title-section">
      <view class="title-left">
        <text class="activity-name">{{ activity.name }}</text>
        <text class="activity-merchant">{{ merchant.name }} · 长沙市芙蓉区</text>
      </view>
      <view class="title-right">
        <text class="price">¥{{ activity.price }}</text>
        <text class="price-unit">{{ activity.priceUnit }}</text>
      </view>
    </view>

    <!-- 亮点标签 -->
    <view class="highlight-tags">
      <text class="highlight-tag" v-for="tag in activity.tags" :key="tag">{{ tag }}</text>
    </view>

    <view class="divider"></view>

    <!-- 档期选择 -->
    <view class="section">
      <text class="section-title">📅 选择档期</text>
      <view class="schedule-row">
        <view
          class="schedule-item"
          v-for="(s, i) in schedules"
          :key="s.id"
          :class="{ active: selectedSchedule === i }"
          @tap="selectedSchedule = i"
        >
          <text class="schedule-day">{{ s.dayOfWeek }}</text>
          <text class="schedule-date">{{ s.date }}</text>
          <text class="schedule-slots" :class="{ hot: s.remainingSlots <= 5 }">
            {{ s.remainingSlots <= 5 ? '仅剩' + s.remainingSlots + '位' : '剩余' + s.remainingSlots + '位' }}
          </text>
        </view>
      </view>
    </view>

    <view class="divider"></view>

    <!-- 行程安排 -->
    <view class="section">
      <text class="section-title">📋 行程安排</text>
      <view class="timeline">
        <view class="timeline-item" v-for="(item, i) in activity.itinerary" :key="i">
          <view class="timeline-dot" :class="{ accent: item.time.includes('11:30') }"></view>
          <view class="timeline-content">
            <text class="timeline-time" :class="{ accent: item.time.includes('11:30') }">{{ item.time }}</text>
            <text class="timeline-label">{{ item.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="divider"></view>

    <!-- 费用包含/不包含 -->
    <view class="section">
      <view class="includes-row">
        <view class="includes-col">
          <text class="includes-title success">✅ 费用包含</text>
          <text class="includes-item" v-for="item in activity.includes" :key="item">{{ item }}</text>
        </view>
        <view class="includes-col">
          <text class="includes-title muted">❌ 不包含</text>
          <text class="includes-item" v-for="item in activity.excludes" :key="item">{{ item }}</text>
        </view>
      </view>
    </view>

    <view class="divider"></view>

    <!-- 集合地点 -->
    <view class="section">
      <text class="section-title">📍 集合地点</text>
      <view class="meeting-card" @tap="openMap">
        <view class="meeting-icon">🏪</view>
        <view class="meeting-info">
          <text class="meeting-name">{{ activity.meetingPoint.name }}</text>
          <text class="meeting-address">{{ activity.meetingPoint.address }}</text>
        </view>
        <text class="meeting-nav">🧭</text>
      </view>
    </view>

    <view class="divider"></view>

    <!-- 取消政策 -->
    <view class="section">
      <text class="section-title">📜 取消政策</text>
      <view class="policy-card">
        <text class="policy-line">✅ 出行前 72 小时+ → <text class="policy-highlight success">全额退款</text></text>
        <text class="policy-line">⚠️ 出行前 24-72 小时 → <text class="policy-highlight warning">退 50%</text></text>
        <text class="policy-line">❌ 出行前 24 小时内 → <text class="policy-highlight danger">不可退</text></text>
        <text class="policy-line">🌧️ 天气/不可抗力 → <text class="policy-highlight success">全额退款或改期</text></text>
      </view>
    </view>

    <view class="divider"></view>

    <!-- 出行须知 -->
    <view class="section">
      <text class="section-title">📝 出行须知</text>
      <view class="notice-card">
        <text class="notice-line">🌤️ <text class="bold">明日天气</text>：晴 28℃ / 建议穿搭：防晒衣、遮阳帽</text>
        <text class="notice-line">🛡️ 全员统一购买短途意外险</text>
        <text class="notice-line">👴 退休长者建议携带常用药品</text>
        <text class="notice-line">👶 儿童需家长全程陪同</text>
        <text class="notice-line">📱 领队电话：138-XXXX-8888（老王）</text>
      </view>
    </view>

    <!-- 关联钓场 -->
    <view class="section" v-if="activity.spot">
      <text class="section-title">🏞️ 关联钓场</text>
      <view class="spot-card">
        <view class="spot-icon">🏞️</view>
        <view class="spot-info">
          <text class="spot-name">{{ activity.spot.name }}</text>
          <text class="spot-meta">🐟 {{ activity.spot.fishTypes }} · 🅿️ {{ activity.spot.facilities }}</text>
          <text class="spot-distance">距门店 {{ activity.spot.distance }} · {{ activity.spot.driveTime }}</text>
        </view>
        <text class="spot-arrow">→</text>
      </view>
    </view>

    <!-- 底部固定栏 -->
    <view class="bottom-bar">
      <view class="bottom-fav" @tap="toggleFavorite">
        <text class="fav-icon">{{ isFavorite ? '⭐' : '☆' }}</text>
        <text class="fav-label">收藏</text>
      </view>
      <view class="bottom-total">
        <text class="total-label">合计</text>
        <view class="total-price">
          <text class="price">¥{{ activity.price }}</text>
          <text class="price-unit">{{ activity.priceUnit }}</text>
        </view>
      </view>
      <view class="btn-book" @tap="goBooking">立即报名</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { mockActivities, mockSchedules, mockMerchant } from '@/mock/data.js'

const activity = ref(mockActivities[0])
const merchant = ref(mockMerchant)
const schedules = ref(mockSchedules)
const selectedSchedule = ref(0)
const isFavorite = ref(false)

const goBack = () => uni.navigateBack()
const toggleFavorite = () => { isFavorite.value = !isFavorite.value }
const openMap = () => uni.openLocation({
  latitude: merchant.value.latitude,
  longitude: merchant.value.longitude,
  name: merchant.value.name,
  address: merchant.value.address
})
const goBooking = () => {
  uni.navigateTo({
    url: `/pages/booking/index?activityId=${activity.value.id}&scheduleId=${schedules.value[selectedSchedule.value].id}`
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';

.page {
  background: $bg-page;
  min-height: 100vh;
  padding-bottom: 180rpx;
}

/* 头图 */
.header-image {
  height: 480rpx;
  position: relative;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 40rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: white;
}

.back-btn {
  position: absolute;
  top: 100rpx;
  left: 32rpx;
  width: 72rpx;
  height: 72rpx;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36rpx;
}

.action-btns {
  position: absolute;
  top: 100rpx;
  right: 32rpx;
  display: flex;
  gap: 20rpx;
}

.action-btn {
  width: 72rpx;
  height: 72rpx;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.header-badges {
  position: absolute;
  bottom: 40rpx;
  left: 40rpx;
  display: flex;
  gap: 12rpx;
}

.badge-accent {
  font-size: 22rpx;
  background: $accent-bg;
  color: $accent;
  padding: 6rpx 16rpx;
  border-radius: $radius-full;
  font-weight: 500;
}

.badge-white {
  font-size: 22rpx;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6rpx 16rpx;
  border-radius: $radius-full;
}

/* 标题 */
.title-section {
  padding: 32rpx;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.title-left {
  flex: 1;
}

.activity-name {
  font-size: 44rpx;
  font-weight: 800;
  line-height: 1.3;
  display: block;
}

.activity-merchant {
  font-size: 26rpx;
  color: $text-secondary;
  margin-top: 12rpx;
  display: block;
}

.title-right {
  text-align: right;
}

.price {
  font-size: 56rpx;
  font-weight: 800;
  color: $accent;
}

.price-unit {
  font-size: 24rpx;
  color: $text-tertiary;
}

/* 亮点标签 */
.highlight-tags {
  padding: 0 32rpx 28rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.highlight-tag {
  font-size: 24rpx;
  background: $bg-page;
  color: $text-secondary;
  padding: 8rpx 20rpx;
  border-radius: $radius-full;
}

.divider {
  height: 16rpx;
  background: $bg-page;
}

/* Section */
.section {
  padding: 32rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 24rpx;
}

/* 档期 */
.schedule-row {
  display: flex;
  gap: 20rpx;
}

.schedule-item {
  flex: 1;
  background: $bg-card;
  border: 3rpx solid #E5E5E5;
  border-radius: 24rpx;
  padding: 28rpx 20rpx;
  text-align: center;

  &.active {
    background: $primary;
    border-color: $primary;

    .schedule-day,
    .schedule-date {
      color: white;
    }

    .schedule-slots {
      color: $accent-light;
    }
  }
}

.schedule-day {
  font-size: 24rpx;
  color: $text-tertiary;
  display: block;
}

.schedule-date {
  font-size: 40rpx;
  font-weight: 800;
  margin: 8rpx 0;
  display: block;
}

.schedule-slots {
  font-size: 22rpx;
  color: $primary;
  display: block;

  &.hot {
    color: $accent-light;
  }
}

/* 时间线 */
.timeline {
  position: relative;
  padding-left: 48rpx;
}

.timeline-item {
  position: relative;
  margin-bottom: 36rpx;

  &:last-child { margin-bottom: 0; }
}

.timeline-dot {
  position: absolute;
  left: -40rpx;
  top: 8rpx;
  width: 24rpx;
  height: 24rpx;
  background: $primary;
  border-radius: 50%;
  border: 4rpx solid $primary-bg;

  &.accent {
    background: $accent-light;
    border-color: $accent-bg;
  }
}

.timeline-time {
  font-size: 26rpx;
  font-weight: 700;
  color: $primary;
  display: block;

  &.accent { color: $accent; }
}

.timeline-label {
  font-size: 28rpx;
  margin-top: 4rpx;
  display: block;
}

/* 包含/不包含 */
.includes-row {
  display: flex;
  gap: 32rpx;
}

.includes-col {
  flex: 1;
}

.includes-title {
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 20rpx;
  display: block;

  &.success { color: $primary; }
  &.muted { color: $text-tertiary; }
}

.includes-item {
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 2;
  display: block;
}

/* 集合地点 */
.meeting-card {
  background: $bg-card;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.meeting-icon {
  width: 96rpx;
  height: 96rpx;
  background: $primary-bg;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
}

.meeting-info {
  flex: 1;
}

.meeting-name {
  font-size: 30rpx;
  font-weight: 600;
  display: block;
}

.meeting-address {
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 4rpx;
  display: block;
}

.meeting-nav {
  font-size: 40rpx;
  color: $primary;
}

/* 取消政策 */
.policy-card {
  background: $bg-card;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: $shadow-sm;
}

.policy-line {
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 2;
  display: block;
}

.policy-highlight {
  font-weight: 600;

  &.success { color: $primary; }
  &.warning { color: #92400E; }
  &.danger { color: $accent; }
}

/* 出行须知 */
.notice-card {
  background: $bg-card;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: $shadow-sm;
}

.notice-line {
  font-size: 26rpx;
  color: $text-secondary;
  line-height: 2;
  display: block;
}

.bold { font-weight: 600; }

/* 关联钓场 */
.spot-card {
  background: $bg-card;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: $shadow-sm;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.spot-icon {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #457B9D, #A8DADC);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
}

.spot-info {
  flex: 1;
}

.spot-name {
  font-size: 30rpx;
  font-weight: 600;
  display: block;
}

.spot-meta {
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 6rpx;
  display: block;
}

.spot-distance {
  font-size: 24rpx;
  color: $text-tertiary;
  margin-top: 4rpx;
  display: block;
}

.spot-arrow {
  font-size: 32rpx;
  color: $text-tertiary;
}

/* 底部栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $bg-card;
  padding: 24rpx 32rpx 68rpx;
  border-top: 2rpx solid #E5E5E5;
  display: flex;
  align-items: center;
  gap: 24rpx;
  z-index: 100;
}

.bottom-fav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.fav-icon { font-size: 40rpx; }
.fav-label { font-size: 20rpx; color: $text-tertiary; }

.bottom-total {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.total-label {
  font-size: 24rpx;
  color: $text-tertiary;
}

.total-price {
  display: flex;
  align-items: baseline;
}

.btn-book {
  background: $accent;
  color: white;
  padding: 28rpx 64rpx;
  border-radius: $radius-full;
  font-size: 32rpx;
  font-weight: 700;
}
</style>
