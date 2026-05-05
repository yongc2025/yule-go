<template>
  <div class="route-list">
    <h2>线路管理</h2>
    <el-card shadow="never">
      <el-table :data="routes" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="线路名称" min-width="200" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="price" label="成人价" width="100">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="child_price" label="儿童价" width="100">
          <template #default="{ row }">¥{{ row.child_price }}</template>
        </el-table-column>
        <el-table-column prop="max_slots" label="默认名额" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑线路" width="600px" destroy-on-close>
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="线路名称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="成人价"><el-input-number v-model="editForm.price" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="儿童价"><el-input-number v-model="editForm.child_price" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="默认名额"><el-input-number v-model="editForm.max_slots" :min="1" /></el-form-item>
        <el-form-item label="线路描述"><el-input v-model="editForm.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="editForm.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { routeAdminApi } from '../../api/route'

const loading = ref(false)
const routes = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const editForm = reactive({ name: '', price: 0, child_price: 0, max_slots: 20, description: '', status: 1 })

async function fetchRoutes() {
  loading.value = true
  try {
    const res = await routeAdminApi.list()
    routes.value = res.data || []
  } catch {} finally {
    loading.value = false
  }
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(editForm, {
    name: row.name, price: row.price, child_price: row.child_price,
    max_slots: row.max_slots, description: row.description, status: row.status
  })
  dialogVisible.value = true
}

async function handleSave() {
  try {
    await routeAdminApi.update(editingId.value, { ...editForm })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchRoutes()
  } catch {}
}

onMounted(() => fetchRoutes())
</script>

<style scoped>
h2 { margin: 0 0 16px; font-size: 20px; }
</style>
