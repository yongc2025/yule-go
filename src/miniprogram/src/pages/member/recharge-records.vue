<template>
  <view class="records-page">
    <!-- 加载中 -->
    <view v-if="loading && !records.length" class="loading-wrap">
      <view class="loading-spinner"></view>
    </view>

    <!-- 空状态 -->
    <view v-else-if="!loading && !records.length" class="empty-wrap">
      <text class="empty-icon">📋</text>
      <text class="empty-title">暂无充值记录</text>
    </view>

    <!-- 记录列表 -->
    <view v-else class="record-list">
      <view v-for="item in records" :key="item.id" class="record-card">
        <view class="record-left">
          <text class="record-amount">+¥{{ item.amount.toFixed(2) }}</text>
          <text v-if="item.gift_amount > 0" class="record-gift">
            (含赠送 ¥{{ item.gift_amount.toFixed(2) }})
          </text>
        </view>
        <view class="record-right">
          <text class="record-status" :class="{ paid: item.payment_status === 1 }">
            {{ item.status_text }}
          </text>
          <text class="record-time">{{ item.created_at }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { memberApi } from '../../api/member'

const loading = ref(false)
const records = ref([])
const page = ref(1)

async function loadRecords(reset = false) {
  if (reset) {
    page.value = 1
    records.value = []
  }
  loading.value = true
  try {
    const res = await memberApi.recharges({ page: page.value, page_size: 20 })
    const list = res.data?.list || []
    if (reset) {
      records.value = list
    } else {
      records.value.push(...list)
    }
  } catch (e) {
    console.error('获取充值记录失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRecords(true)
})

onPullDownRefresh(() => {
  loadRecords(true).finally(() => {
    uni.stopPullDownRefresh()
  })
})
</script>

<style lang="scss" scoped>
.records-page {
  min-height: 100vh;
  background: #f5f5f5;
}

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
  color: #999;
}

.record-list {
  padding: 20rpx 24rpx;
}

.record-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
}

.record-left {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.record-amount {
  font-size: 34rpx;
  font-weight: 600;
  color: #52c41a;
}

.record-gift {
  font-size: 24rpx;
  color: #999;
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
}

.record-status {
  font-size: 24rpx;
  color: #faad14;

  &.paid {
    color: #52c41a;
  }
}

.record-time {
  font-size: 22rpx;
  color: #999;
}
</style>
