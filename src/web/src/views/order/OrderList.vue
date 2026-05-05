<template>
  <div class="order-list">
    <h2>订单管理</h2>
    <el-card shadow="never">
      <el-form :inline="true" :model="filters" @submit.prevent="fetchOrders">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="待支付" :value="0" />
            <el-option label="已确认" :value="1" />
            <el-option label="已出行" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
            <el-option label="已退款" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchOrders">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="route_name" label="线路" min-width="150" />
        <el-table-column prop="trip_date" label="出行日期" width="120" />
        <el-table-column label="人数" width="100">
          <template #default="{ row }">{{ row.adults }}+{{ row.children }}</template>
        </el-table-column>
        <el-table-column prop="total_amount" label="金额" width="100">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="status_text" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status_text }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          :total="total"
          :page-size="20"
          layout="total, prev, pager, next"
          @current-change="fetchOrders"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { orderAdminApi } from '../../api/order'

const loading = ref(false)
const orders = ref([])
const page = ref(1)
const total = ref(0)
const filters = reactive({ status: null })

async function fetchOrders() {
  loading.value = true
  try {
    const params = { page: page.value, page_size: 20 }
    if (filters.status !== null) params.status = filters.status
    const res = await orderAdminApi.list(params)
    orders.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch {} finally {
    loading.value = false
  }
}

function statusType(s) {
  const map = { 0: 'warning', 1: 'primary', 2: '', 3: 'success', 4: 'info', 5: 'danger' }
  return map[s] ?? 'info'
}

function formatTime(t) {
  if (!t) return ''
  return t.replace('T', ' ').substring(0, 16)
}

onMounted(() => fetchOrders())
</script>

<style scoped>
h2 { margin: 0 0 16px; font-size: 20px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
