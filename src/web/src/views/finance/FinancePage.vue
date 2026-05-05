<template>
  <div class="finance-page">
    <h2>财务统计</h2>

    <el-radio-group v-model="period" @change="fetchSummary" style="margin-bottom: 20px">
      <el-radio-button value="today">今日</el-radio-button>
      <el-radio-button value="week">本周</el-radio-button>
      <el-radio-button value="month">本月</el-radio-button>
    </el-radio-group>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-label">总营收</div>
          <div class="stat-value revenue">¥{{ summary.total_revenue?.toFixed(2) || '0.00' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-label">订单数</div>
          <div class="stat-value">{{ summary.order_count || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-label">充值收入</div>
          <div class="stat-value">¥{{ summary.recharge_revenue?.toFixed(2) || '0.00' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-label">新增用户</div>
          <div class="stat-value">{{ summary.new_users || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top: 20px">
      <template #header>按线路营收</template>
      <el-table :data="routeStats" v-loading="loading" stripe>
        <el-table-column prop="route_name" label="线路" min-width="200" />
        <el-table-column prop="order_count" label="订单数" width="100" />
        <el-table-column prop="revenue" label="营收" width="150">
          <template #default="{ row }">¥{{ row.revenue?.toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { financeApi } from '../../api/finance'

const period = ref('week')
const summary = ref({})
const routeStats = ref([])
const loading = ref(false)

async function fetchSummary() {
  try {
    const res = await financeApi.summary(period.value)
    summary.value = res.data
  } catch {}
}

async function fetchRouteStats() {
  loading.value = true
  try {
    const res = await financeApi.byRoute()
    routeStats.value = res.data || []
  } catch {} finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSummary()
  fetchRouteStats()
})
</script>

<style scoped>
h2 { margin: 0 0 16px; font-size: 20px; }
.stat-label { font-size: 14px; color: #999; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; color: #333; }
.stat-value.revenue { color: #ff4d4f; }
</style>
