<template>
  <div class="schedule-list">
    <!-- 页面标题 + 操作栏 -->
    <div class="page-header">
      <h2>团期管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        创建团期
      </el-button>
    </div>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" @submit.prevent="fetchSchedules">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="报名中" :value="1" />
            <el-option label="已满" :value="2" />
            <el-option label="已出发" :value="3" />
            <el-option label="已完成" :value="4" />
            <el-option label="已取消" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchSchedules">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="schedules" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="route_name" label="线路" min-width="180" />
        <el-table-column prop="trip_date" label="出行日期" width="130">
          <template #default="{ row }">
            {{ formatDate(row.trip_date) }}
          </template>
        </el-table-column>
        <el-table-column label="名额" width="150">
          <template #default="{ row }">
            <span>{{ row.booked_slots }} / {{ row.max_slots }}</span>
            <el-tag
              v-if="row.remaining_slots <= 3 && row.remaining_slots > 0"
              type="warning"
              size="small"
              style="margin-left: 6px"
            >
              仅剩{{ row.remaining_slots }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="guide_name" label="领队" width="100" />
        <el-table-column prop="guide_phone" label="领队电话" width="130" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1 || row.status === 2"
              type="primary"
              link
              size="small"
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status === 1 || row.status === 2"
              type="danger"
              link
              size="small"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
            <el-button
              type="info"
              link
              size="small"
              @click="viewDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchSchedules"
          @current-change="fetchSchedules"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑团期' : '创建团期'"
      width="520px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="线路" prop="route_id">
          <el-select v-model="form.route_id" placeholder="选择线路" :disabled="isEditing" style="width: 100%">
            <el-option
              v-for="r in routeOptions"
              :key="r.id"
              :label="r.name"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="出行日期" prop="trip_date">
          <el-date-picker
            v-model="form.trip_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            :disabled="isEditing"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="最大名额" prop="max_slots">
          <el-input-number v-model="form.max_slots" :min="1" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="领队姓名" prop="guide_name">
          <el-input v-model="form.guide_name" placeholder="输入领队姓名" />
        </el-form-item>
        <el-form-item label="领队电话" prop="guide_phone">
          <el-input v-model="form.guide_phone" placeholder="输入领队电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEditing ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="团期详情" width="520px">
      <el-descriptions :column="1" border v-if="detailData">
        <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="线路">{{ detailData.route_name }}</el-descriptions-item>
        <el-descriptions-item label="出行日期">{{ formatDate(detailData.trip_date) }}</el-descriptions-item>
        <el-descriptions-item label="名额">{{ detailData.booked_slots }} / {{ detailData.max_slots }}</el-descriptions-item>
        <el-descriptions-item label="剩余名额">{{ detailData.remaining_slots }}</el-descriptions-item>
        <el-descriptions-item label="领队">{{ detailData.guide_name }} ({{ detailData.guide_phone }})</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(detailData.status)">{{ detailData.status_text }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailData.created_at }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detailData.updated_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { scheduleApi } from '../../api/schedule'

// --- 状态 ---
const loading = ref(false)
const schedules = ref([])
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const filters = reactive({ status: null })

// 对话框
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const submitting = ref(false)
const formRef = ref(null)

// 详情
const detailVisible = ref(false)
const detailData = ref(null)

// 线路选项（后续从 API 获取，当前硬编码）
const routeOptions = ref([
  { id: 1, name: '成人钓友单日垂钓团' },
  { id: 2, name: '垂钓+露营一日套餐' },
  { id: 3, name: '亲子出游套餐' },
  { id: 4, name: '退休专属慢游单日团' }
])

// 表单
const defaultForm = {
  route_id: null,
  trip_date: '',
  max_slots: 20,
  guide_name: '',
  guide_phone: ''
}
const form = reactive({ ...defaultForm })

// 校验规则
const rules = {
  route_id: [{ required: true, message: '请选择线路', trigger: 'change' }],
  trip_date: [{ required: true, message: '请选择出行日期', trigger: 'change' }],
  max_slots: [{ required: true, message: '请输入最大名额', trigger: 'blur' }],
  guide_name: [{ required: true, message: '请输入领队姓名', trigger: 'blur' }],
  guide_phone: [{ required: true, message: '请输入领队电话', trigger: 'blur' }]
}

// --- 方法 ---
async function fetchSchedules() {
  loading.value = true
  try {
    const res = await scheduleApi.list({
      page: pagination.page,
      page_size: pagination.pageSize,
      ...(filters.status !== null ? { status: filters.status } : {})
    })
    schedules.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch {
    // 拦截器已处理错误
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.status = null
  pagination.page = 1
  fetchSchedules()
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
    route_id: row.route_id,
    trip_date: row.trip_date?.split('T')[0] || row.trip_date,
    max_slots: row.max_slots,
    guide_name: row.guide_name,
    guide_phone: row.guide_phone
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEditing.value) {
      await scheduleApi.update(editingId.value, {
        max_slots: form.max_slots,
        guide_name: form.guide_name,
        guide_phone: form.guide_phone
      })
      ElMessage.success('编辑成功')
    } else {
      await scheduleApi.create({ ...form })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchSchedules()
  } catch {
    // 拦截器已处理
  } finally {
    submitting.value = false
  }
}

async function handleCancel(row) {
  try {
    await ElMessageBox.confirm(
      `确定取消「${row.route_name}」${formatDate(row.trip_date)} 的团期？`,
      '确认取消',
      { type: 'warning' }
    )
    await scheduleApi.cancel(row.id)
    ElMessage.success('已取消')
    fetchSchedules()
  } catch {
    // 用户取消或请求失败
  }
}

function viewDetail(row) {
  detailData.value = row
  detailVisible.value = true
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

function statusType(status) {
  const map = { 0: 'info', 1: 'success', 2: 'warning', 3: '', 4: '' }
  return map[status] ?? 'info'
}

// --- 生命周期 ---
onMounted(() => {
  fetchSchedules()
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

.filter-card {
  margin-bottom: 16px;
}

.filter-card :deep(.el-card__body) {
  padding-bottom: 2px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
