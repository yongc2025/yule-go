import api from './index'

export const customerApi = {
  list(params) {
    return api.get('/admin/customers', { params })
  },
  detail(id) {
    return api.get(`/admin/customers/${id}`)
  }
}
