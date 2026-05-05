<template>
  <div class="customer-list">
    <h2>客户管理</h2>
    <el-card shadow="never">
      <el-form :inline="true" @submit.prevent="fetchCustomers">
        <el-form-item>
          <el-input v-model="keyword" placeholder="搜索昵称/手机号" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchCustomers">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="customers" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="member_level" label="会员等级" width="120">
          <template #default="{ row }">
            <el-tag :type="levelType(row.member_level)" size="small">{{ levelText(row.member_level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="100">
          <template #default="{ row }">¥{{ row.balance?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="total_recharge" label="累计充值" width="120">
          <template #default="{ row }">¥{{ row.total_recharge?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="invite_code" label="邀请码" width="100" />
        <el-table-column prop="created_at" label="注册时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          :total="total"
          :page-size="20"
          layout="total, prev, pager, next"
          @current-change="fetchCustomers"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { customerApi } from '../../api/customer'

const loading = ref(false)
const customers = ref([])
const page = ref(1)
const total = ref(0)
const keyword = ref('')

async function fetchCustomers() {
  loading.value = true
  try {
    const res = await customerApi.list({ page: page.value, page_size: 20, keyword: keyword.value })
    customers.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch {} finally {
    loading.value = false
  }
}

function levelText(l) {
  return ['普通用户', '银卡会员', '金卡会员', '钻石会员'][l] || '普通用户'
}
function levelType(l) {
  return ['info', '', 'warning', ''][l] || 'info'
}
function formatTime(t) {
  if (!t) return ''
  return t.replace('T', ' ').substring(0, 16)
}

onMounted(() => fetchCustomers())
</script>

<style scoped>
h2 { margin: 0 0 16px; font-size: 20px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
