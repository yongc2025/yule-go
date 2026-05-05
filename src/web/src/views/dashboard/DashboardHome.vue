<template>
  <div class="dashboard">
    <h2>运营概览</h2>
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card revenue">
          <div class="stat-label">今日营收</div>
          <div class="stat-value">¥{{ data.today_revenue?.toFixed(2) || '0.00' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card orders">
          <div class="stat-label">今日订单</div>
          <div class="stat-value">{{ data.today_orders || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card pending">
          <div class="stat-label">待处理订单</div>
          <div class="stat-value">{{ data.pending_orders || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card users">
          <div class="stat-label">总用户数</div>
          <div class="stat-value">{{ data.total_users || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-label">本周营收</div>
          <div class="stat-value secondary">¥{{ data.week_revenue?.toFixed(2) || '0.00' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-label">本月营收</div>
          <div class="stat-value secondary">¥{{ data.month_revenue?.toFixed(2) || '0.00' }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-label">本周团期</div>
          <div class="stat-value secondary">{{ data.week_schedules || 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-label">本月订单</div>
          <div class="stat-value secondary">{{ data.month_orders || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '../../api/admin'

const data = ref({})

onMounted(async () => {
  try {
    const res = await adminApi.dashboard()
    data.value = res.data
  } catch {}
})
</script>

<style scoped>
.dashboard h2 { margin: 0 0 20px; font-size: 20px; }
.stat-card { text-align: center; }
.stat-label { font-size: 14px; color: #999; margin-bottom: 8px; }
.stat-value { font-size: 32px; font-weight: 700; color: #333; }
.stat-value.secondary { font-size: 24px; color: #666; }
.stat-card.revenue .stat-value { color: #ff4d4f; }
.stat-card.orders .stat-value { color: #1890ff; }
.stat-card.pending .stat-value { color: #faad14; }
.stat-card.users .stat-value { color: #52c41a; }
</style>
