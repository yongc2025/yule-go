<template>
  <div class="rental-list">
    <div class="page-header">
      <h2>装备管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        添加装备
      </el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="items" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="装备名称" min-width="150" />
        <el-table-column prop="price_per_day" label="日租金(元)" width="120">
          <template #default="{ row }">¥{{ row.price_per_day }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100">
          <template #default="{ row }">
            <el-tag :type="row.stock > 0 ? 'success' : 'danger'" size="small">
              {{ row.stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑装备' : '添加装备'"
      width="460px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="装备名称" prop="name">
          <el-input v-model="form.name" placeholder="如：鱼竿套装" />
        </el-form-item>
        <el-form-item label="日租金(元)" prop="price_per_day">
          <el-input-number v-model="form.price_per_day" :min="1" :max="9999" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :max="9999" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { rentalAdminApi } from '../../api/rental'

const loading = ref(false)
const items = ref([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = { name: '', price_per_day: 30, stock: 10 }
const form = reactive({ ...defaultForm })

const rules = {
  name: [{ required: true, message: '请输入装备名称', trigger: 'blur' }],
  price_per_day: [{ required: true, message: '请输入日租金', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存数量', trigger: 'blur' }]
}

async function fetchItems() {
  loading.value = true
  try {
    const res = await rentalAdminApi.list()
    items.value = res.data || []
  } catch {} finally {
    loading.value = false
  }
}

function openCreateDialog() {
  isEditing.value = false
  editingId.value = null
  Object.assign(form, defaultForm)
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEditing.value = true
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    price_per_day: row.price_per_day,
    stock: row.stock
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEditing.value) {
      await rentalAdminApi.update(editingId.value, { ...form })
      ElMessage.success('编辑成功')
    } else {
      await rentalAdminApi.create({ ...form })
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchItems()
  } catch {} finally {
    submitting.value = false
  }
}

async function handleStatusChange(row) {
  try {
    await rentalAdminApi.update(row.id, { status: row.status })
    ElMessage.success(row.status ? '已上架' : '已下架')
  } catch {
    row.status = row.status ? 0 : 1
  }
}

onMounted(() => {
  fetchItems()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
}
</style>
