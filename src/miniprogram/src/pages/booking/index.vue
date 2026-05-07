<template>
  <view class="page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">←</view>
      <text class="nav-title">确认预约</text>
    </view>

    <!-- 活动摘要 -->
    <view class="summary-card">
      <view class="summary-icon" :style="{ background: activity.gradient }">{{ activity.emoji }}</view>
      <view class="summary-info">
        <text class="summary-name">{{ activity.name }}</text>
        <text class="summary-meta">{{ merchant.name }} · {{ activity.date }} {{ activity.dayOfWeek }}</text>
        <text class="summary-time">{{ activity.time.split('-')[0] }} 集合 · {{ merchant.address }}</text>
      </view>
    </view>

    <!-- 人数选择 -->
    <view class="card">
      <text class="card-title">👥 选择人数</text>
      <view class="count-row">
        <view>
          <text class="count-label">成人</text>
          <text class="count-price">¥{{ activity.price }}/人</text>
        </view>
        <view class="count-control">
          <view class="count-btn" @tap="adultCount > 1 && adultCount--">−</view>
          <text class="count-value">{{ adultCount }}</text>
          <view class="count-btn add" @tap="adultCount++">+</view>
        </view>
      </view>
      <view class="count-row" v-if="activity.childPrice">
        <view>
          <text class="count-label">儿童</text>
          <text class="count-price">¥{{ activity.childPrice }}/人</text>
        </view>
        <view class="count-control">
          <view class="count-btn" @tap="childCount > 0 && childCount--">−</view>
          <text class="count-value">{{ childCount }}</text>
          <view class="count-btn add" @tap="childCount++">+</view>
        </view>
      </view>
    </view>

    <!-- 装备租赁 -->
    <view class="card">
      <text class="card-title">🎒 装备租赁（可选）</text>
      <view
        class="rental-row"
        v-for="item in rentalItems"
        :key="item.id"
        @tap="toggleRental(item.id)"
      >
        <view class="rental-left">
          <view class="rental-icon">{{ item.emoji }}</view>
          <view>
            <text class="rental-name">{{ item.name }}</text>
            <text class="rental-price">¥{{ item.price }}/{{ item.unit }}</text>
          </view>
        </view>
        <view class="checkbox" :class="{ checked: selectedRentals.includes(item.id) }">
          <text v-if="selectedRentals.includes(item.id)">✓</text>
        </view>
      </view>
    </view>

    <!-- 联系信息 -->
    <view class="card">
      <text class="card-title">📱 联系信息</text>
      <view class="info-row">
        <text class="info-label">联系人</text>
        <text class="info-value">李明 <text class="auto-fill">（自动填充）</text></text>
      </view>
      <view class="info-row">
        <text class="info-label">手机号</text>
        <text class="info-value">138****8888</text>
      </view>
    </view>

    <!-- 会员抵扣 -->
    <view class="card member-card">
      <view class="member-row">
        <view class="member-left">
          <text class="member-icon">💳</text>
          <text class="member-label">使用余额抵扣</text>
        </view>
        <view class="member-right">
          <text class="member-balance">可用 ¥{{ user.balance }}</text>
          <view class="toggle" :class="{ on: useBalance }" @tap="useBalance = !useBalance">
            <view class="toggle-dot"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 费用明细 -->
    <view class="card">
      <text class="card-title">💰 费用明细</text>
      <view class="fee-row">
        <text class="fee-label">团费（{{ adultCount }}成人{{ childCount > 0 ? ' + ' + childCount + '儿童' : '' }}）</text>
        <text class="fee-value">¥{{ teamFee.toFixed(2) }}</text>
      </view>
      <view class="fee-row" v-if="rentalFee > 0">
        <text class="fee-label">装备租赁</text>
        <text class="fee-value">¥{{ rentalFee.toFixed(2) }}</text>
      </view>
      <view class="fee-row discount" v-if="discount > 0">
        <text class="fee-label">金卡会员折扣（{{ (user.discount * 10).toFixed(0) }}折）</text>
        <text class="fee-value">-¥{{ discount.toFixed(2) }}</text>
      </view>
      <view class="fee-divider"></view>
      <view class="fee-row total">
        <text class="fee-label">实付金额</text>
        <text class="fee-total">¥{{ totalAmount.toFixed(2) }}</text>
      </view>
    </view>

    <!-- 底部支付栏 -->
    <view class="bottom-bar">
      <view class="pay-btn" @tap="goPay">
        微信支付 ¥{{ totalAmount.toFixed(2) }}
      </view>
      <text class="pay-hint">支付后将获得核销码，出行当天出示</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { mockActivities, mockRentalItems, mockMerchant, mockUser } from '@/mock/data.js'

const activity = ref(mockActivities[0])
const merchant = ref(mockMerchant)
const user = ref(mockUser)
const rentalItems = ref(mockRentalItems)

const adultCount = ref(2)
const childCount = ref(0)
const selectedRentals = ref([3]) // 默认选中天幕
const useBalance = ref(false)

const toggleRental = (id) => {
  const idx = selectedRentals.value.indexOf(id)
  if (idx >= 0) {
    selectedRentals.value.splice(idx, 1)
  } else {
    selectedRentals.value.push(id)
  }
}

const teamFee = computed(() => {
  let fee = adultCount.value * activity.value.price
  if (activity.value.childPrice) {
    fee += childCount.value * activity.value.childPrice
  }
  return fee
})

const rentalFee = computed(() => {
  return selectedRentals.value.reduce((sum, id) => {
    const item = rentalItems.value.find(r => r.id === id)
    return sum + (item ? item.price : 0)
  }, 0)
})

const discount = computed(() => {
  return (teamFee.value + rentalFee.value) * (1 - user.value.discount)
})

const totalAmount = computed(() => {
  return teamFee.value + rentalFee.value - discount.value
})

const goBack = () => uni.navigateBack()
const goPay = () => {
  uni.showToast({ title: '支付功能开发中', icon: 'none' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-tokens.scss';

.page {
  background: $bg-page;
  min-height: 100vh;
  padding-bottom: 220rpx;
}

.nav-bar {
  background: $bg-card;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-bottom: 2rpx solid #F0F0F0;
}

.back-btn {
  position: absolute;
  left: 32rpx;
  font-size: 40rpx;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 600;
}

/* 活动摘要 */
.summary-card {
  background: $bg-card;
  padding: 28rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.summary-icon {
  width: 128rpx;
  height: 128rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
}

.summary-info { flex: 1; }

.summary-name {
  font-size: 30rpx;
  font-weight: 600;
  display: block;
}

.summary-meta {
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 6rpx;
  display: block;
}

.summary-time {
  font-size: 24rpx;
  color: $text-secondary;
  margin-top: 4rpx;
  display: block;
}

/* 卡片 */
.card {
  background: $bg-card;
  padding: 32rpx;
  margin-bottom: 16rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 28rpx;
}

/* 人数选择 */
.count-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;

  &:last-child { margin-bottom: 0; }
}

.count-label {
  font-size: 30rpx;
  display: block;
}

.count-price {
  font-size: 24rpx;
  color: $text-tertiary;
  display: block;
}

.count-control {
  display: flex;
  align-items: center;
  gap: 32rpx;
}

.count-btn {
  width: 64rpx;
  height: 64rpx;
  background: $bg-page;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;

  &.add {
    background: $primary;
    color: white;
  }
}

.count-value {
  font-size: 36rpx;
  font-weight: 700;
  min-width: 40rpx;
  text-align: center;
}

/* 装备租赁 */
.rental-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #F0F0F0;

  &:last-child { border-bottom: none; }
}

.rental-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.rental-icon {
  width: 72rpx;
  height: 72rpx;
  background: $primary-bg;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.rental-name {
  font-size: 28rpx;
  display: block;
}

.rental-price {
  font-size: 24rpx;
  color: $text-tertiary;
  display: block;
}

.checkbox {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #D1D5DB;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;

  &.checked {
    border-color: $primary;
    background: $primary;
    color: white;
  }
}

/* 联系信息 */
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #F0F0F0;

  &:last-child { border-bottom: none; }
}

.info-label {
  font-size: 28rpx;
  color: $text-secondary;
}

.info-value {
  font-size: 28rpx;
}

.auto-fill {
  font-size: 24rpx;
  color: $text-tertiary;
}

/* 会员抵扣 */
.member-card {
  background: $accent-bg;
}

.member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.member-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.member-icon { font-size: 36rpx; }
.member-label { font-size: 28rpx; font-weight: 600; }

.member-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.member-balance {
  font-size: 24rpx;
  color: $text-secondary;
}

.toggle {
  width: 88rpx;
  height: 52rpx;
  background: #D1D5DB;
  border-radius: 26rpx;
  position: relative;

  &.on {
    background: $primary;
  }
}

.toggle-dot {
  width: 44rpx;
  height: 44rpx;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  box-shadow: $shadow-sm;

  .on & {
    left: 40rpx;
  }
}

/* 费用明细 */
.fee-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;

  &.total {
    margin-bottom: 0;
    align-items: center;
  }
}

.fee-label {
  font-size: 28rpx;
  color: $text-secondary;

  .discount & { color: $primary; }
}

.fee-value {
  font-size: 28rpx;

  .discount & { color: $primary; }
}

.fee-divider {
  height: 2rpx;
  background: #F0F0F0;
  margin: 24rpx 0;
}

.fee-label {
  .total & {
    font-size: 32rpx;
    font-weight: 700;
    color: $text-primary;
  }
}

.fee-total {
  font-size: 48rpx;
  font-weight: 800;
  color: $accent;
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
}

.pay-btn {
  background: $accent;
  color: white;
  text-align: center;
  padding: 32rpx;
  border-radius: $radius-full;
  font-size: 34rpx;
  font-weight: 700;
}

.pay-hint {
  text-align: center;
  font-size: 22rpx;
  color: $text-tertiary;
  margin-top: 16rpx;
  display: block;
}
</style>
