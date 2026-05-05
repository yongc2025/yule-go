import api from './index'

export const scheduleApi = {
  // 创建团期
  create(data) {
    return api.post('/admin/schedules', data)
  },

  // 编辑团期
  update(id, data) {
    return api.put(`/admin/schedules/${id}`, data)
  },

  // 取消团期
  cancel(id) {
    return api.put(`/admin/schedules/${id}/cancel`)
  },

  // 团期详情
  getById(id) {
    return api.get(`/admin/schedules/${id}`)
  },

  // 团期列表（分页）
  list(params) {
    return api.get('/admin/schedules', { params })
  },

  // 按周查询（小程序端）
  listByWeek(week) {
    return api.get('/schedules', { params: { week } })
  }
}
