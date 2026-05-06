<template>
  <view class="schedule-card" :class="{ 'is-full': isFull, 'is-cancelled': isCancelled }">
    <!-- 状态角标 -->
    <view class="card-badge" :class="badgeClass">
      {{ schedule.status_text }}
    </view>

    <!-- 线路名称 -->
    <view class="card-header">
      <text class="route-name">{{ schedule.route_name }}</text>
      <text class="trip-date">{{ formattedDate }}</text>
    </view>

    <!-- 名额信息 -->
    <view class="card-body">
      <view class="slots-info">
        <view class="slots-bar">
          <view class="slots-fill" :style="{ width: fillPercent + '%' }" :class="fillClass"></view>
        </view>
        <view class="slots-text">
          <text class="booked">{{ schedule.booked_slots }}</text>
          <text class="divider">/</text>
          <text class="max">{{ schedule.max_slots }} 人</text>
          <text v-if="!isFull && !isCancelled && schedule.remaining_slots <= 3" class="remaining-warn">
            仅剩{{ schedule.remaining_slots }}位
          </text>
          <text v-else-if="!isFull && !isCancelled" class="remaining">
            剩余{{ schedule.remaining_slots }}位
          </text>
        </view>
      </view>
    </view>

    <!-- 领队信息 -->
    <view class="card-footer">
      <view class="guide-info">
        <text class="guide-icon">👤</text>
        <text class="guide-name">{{ schedule.guide_name }}</text>
      </view>
      <view
        v-if="!isFull && !isCancelled"
        class="btn-book"
        @tap="$emit('book', schedule)"
      >
        立即报名
      </view>
      <view v-else class="btn-disabled">
        {{ isFull ? '已满' : '已取消' }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { formatDateCN } from '../utils/date'

const props = defineProps({
  schedule: { type: Object, required: true }
})

defineEmits(['book'])

const isFull = computed(() => props.schedule.status === 2)
const isCancelled = computed(() => props.schedule.status === 0)
const formattedDate = computed(() => formatDateCN(props.schedule.trip_date))

const fillPercent = computed(() => {
  const { booked_slots, max_slots } = props.schedule
  if (!max_slots) return 0
  return Math.min(100, Math.round((booked_slots / max_slots) * 100))
})

const fillClass = computed(() => {
  if (fillPercent.value >= 90) return 'fill-danger'
  if (fillPercent.value >= 70) return 'fill-warning'
  return 'fill-normal'
})

const badgeClass = computed(() => {
  const map = {
    0: 'badge-cancelled',
    1: 'badge-enrolling',
    2: 'badge-full',
    3: 'badge-departed',
    4: 'badge-completed'
  }
  return map[props.schedule.status] ?? 'badge-default'
})
</script>

<style lang="scss" scoped>
.schedule-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;

  &.is-full,
  &.is-cancelled {
    opacity: 0.75;
  }
}

/* 状态角标 */
.card-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 6rpx 24rpx;
  font-size: 22rpx;
  color: #fff;
  border-radius: 0 0 0 24rpx;
}

.badge-enrolling {
  background: linear-gradient(135deg, #52c41a, #73d13d);
}

.badge-full {
  background: linear-gradient(135deg, #faad14, #ffc53d);
}

.badge-cancelled {
  background: linear-gradient(135deg, #999, #bbb);
}

.badge-departed {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
}

.badge-completed {
  background: linear-gradient(135deg, #666, #888);
}

/* 头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24rpx;
  padding-right: 120rpx;
}

.route-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.trip-date {
  font-size: 26rpx;
  color: #1890ff;
  font-weight: 500;
  white-space: nowrap;
  margin-left: 16rpx;
}

/* 名额进度条 */
.card-body {
  margin-bottom: 24rpx;
}

.slots-info {
  width: 100%;
}

.slots-bar {
  height: 12rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 12rpx;
}

.slots-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.fill-normal {
  background: linear-gradient(90deg, #52c41a, #73d13d);
}

.fill-warning {
  background: linear-gradient(90deg, #faad14, #ffc53d);
}

.fill-danger {
  background: linear-gradient(90deg, #ff4d4f, #ff7875);
}

.slots-text {
  display: flex;
  align-items: baseline;
  font-size: 26rpx;
  color: #666;
}

.booked {
  font-weight: 600;
  color: #333;
  font-size: 30rpx;
}

.divider {
  margin: 0 4rpx;
  color: #ccc;
}

.max {
  color: #999;
}

.remaining {
  margin-left: 16rpx;
  color: #52c41a;
  font-size: 24rpx;
}

.remaining-warn {
  margin-left: 16rpx;
  color: #faad14;
  font-size: 24rpx;
  font-weight: 500;
}

/* 底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.guide-info {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #666;
}

.guide-icon {
  margin-right: 8rpx;
  font-size: 28rpx;
}

.btn-book {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: #fff;
  font-size: 28rpx;
  font-weight: 500;
  padding: 14rpx 40rpx;
  border-radius: 40rpx;
  letter-spacing: 2rpx;

  &:active {
    opacity: 0.85;
    transform: scale(0.97);
  }
}

.btn-disabled {
  background: #f0f0f0;
  color: #999;
  font-size: 28rpx;
  padding: 14rpx 40rpx;
  border-radius: 40rpx;
}
</style>
