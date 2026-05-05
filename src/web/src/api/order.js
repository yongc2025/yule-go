import api from './index'

export const orderAdminApi = {
  list(params) {
    return api.get('/admin/orders', { params })
  },
  detail(id) {
    return api.get(`/admin/orders/${id}`)
  }
}
