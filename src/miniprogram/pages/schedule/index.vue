<template>
  <view class="schedule-page">
    <!-- 顶部周切换 -->
    <view class="week-nav">
      <view class="nav-btn" :class="{ disabled: isCurrentWeek }" @tap="goPrevWeek">
        <text class="arrow">‹</text>
      </view>
      <view class="week-title" @tap="goCurrentWeek">
        <text class="week-label">{{ weekTitle }}</text>
        <text v-if="!isCurrentWeek" class="back-today">回到本周</text>
      </view>
      <view class="nav-btn" @tap="goNextWeek">
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 快捷周选择 -->
    <view class="week-tabs">
      <view
        v-for="(w, i) in weekTabs"
        :key="w.value"
        class="tab-item"
        :class="{ active: w.value === currentWeek }"
        @tap="switchWeek(w.value)"
      >
        <text class="tab-label">{{ w.label }}</text>
        <text class="tab-date">{{ w.dateRange }}</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading && !schedules.length" class="loading-wrap">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="!loading && !schedules.length" class="empty-wrap">
      <text class="empty-icon">🎣</text>
      <text class="empty-title">本周暂无团期</text>
      <text class="empty-desc">下拉切换其他周看看</text>
    </view>

    <!-- 团期列表 -->
    <view v-else class="schedule-list">
      <ScheduleCard
        v-for="item in schedules"
        :key="item.id"
        :schedule="item"
        @book="handleBook"
      />
    </view>

    <!-- 底部提示 -->
    <view v-if="schedules.length" class="footer-hint">
      <text>— 共 {{ schedules.length }} 个团期 —</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { scheduleApi } from '../../api/schedule'
import { getWeekString, offsetWeek, formatWeekTitle } from '../../utils/date'
import ScheduleCard from '../../components/ScheduleCard.vue'

// --- 状态 ---
const loading = ref(false)
const schedules = ref([])
const currentWeek = ref(getWeekString())

// --- 计算属性 ---
const isCurrentWeek = computed(() => currentWeek.value === getWeekString())
const weekTitle = computed(() => formatWeekTitle(currentWeek.value))

const weekTabs = computed(() => {
  const tabs = []
  for (let i = -1; i <= 2; i++) {
    const w = offsetWeek(currentWeek.value, i)
    tabs.push({
      value: w,
      label: i === 0 ? '本周' : i === 1 ? '下周' : i === 2 ? '后周' : '上周',
      dateRange: formatWeekTitle(w).replace(/第\d+周\s*/, '')
    })
  }
  return tabs
})

// --- 方法 ---
async function fetchSchedules() {
  loading.value = true
  try {
    const res = await scheduleApi.listByWeek(currentWeek.value)
    schedules.value = res.data?.schedules || []
  } catch (e) {
    console.error('获取团期失败:', e)
    schedules.value = []
  } finally {
    loading.value = false
  }
}

function switchWeek(week) {
  currentWeek.value = week
  fetchSchedules()
}

function goPrevWeek() {
  currentWeek.value = offsetWeek(currentWeek.value, -1)
  fetchSchedules()
}

function goNextWeek() {
  currentWeek.value = offsetWeek(currentWeek.value, 1)
  fetchSchedules()
}

function goCurrentWeek() {
  if (!isCurrentWeek.value) {
    currentWeek.value = getWeekString()
    fetchSchedules()
  }
}

function handleBook(schedule) {
  // TODO: 跳转到预约页面（Task 0002 实现）
  uni.showToast({
    title: `报名: ${schedule.route_name}`,
    icon: 'none'
  })
}

// --- 生命周期 ---
onMounted(() => {
  fetchSchedules()
})

// 下拉刷新
onPullDownRefresh(() => {
  fetchSchedules().finally(() => {
    uni.stopPullDownRefresh()
  })
})
</script>

<style lang="scss" scoped>
.schedule-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: env(safe-area-inset-bottom);
}

/* 周导航 */
.week-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: #fff;
}

.nav-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);

  &.disabled {
    opacity: 0.4;
  }

  &:active {
    background: rgba(255, 255, 255, 0.3);
  }
}

.arrow {
  font-size: 40rpx;
  font-weight: bold;
  line-height: 1;
}

.week-title {
  text-align: center;
  flex: 1;
}

.week-label {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
}

.back-today {
  display: block;
  font-size: 22rpx;
  opacity: 0.8;
  margin-top: 4rpx;
}

/* 周标签 */
.week-tabs {
  display: flex;
  padding: 16rpx 24rpx;
  background: #fff;
  gap: 16rpx;
  border-bottom: 1rpx solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 8rpx;
  border-radius: 16rpx;
  background: #f5f5f5;
  transition: all 0.2s;

  &.active {
    background: #e6f7ff;
    border: 2rpx solid #1890ff;
  }
}

.tab-label {
  display: block;
  font-size: 26rpx;
  font-weight: 500;
  color: #333;

  .active & {
    color: #1890ff;
  }
}

.tab-date {
  display: block;
  font-size: 20rpx;
  color: #999;
  margin-top: 4rpx;
}

/* 加载中 */
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #e6f7ff;
  border-top-color: #1890ff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #999;
}

/* 空状态 */
.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 160rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 24rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
}

/* 团期列表 */
.schedule-list {
  padding: 24rpx;
}

/* 底部提示 */
.footer-hint {
  text-align: center;
  padding: 24rpx 0 48rpx;
  font-size: 24rpx;
  color: #ccc;
}
</style>
