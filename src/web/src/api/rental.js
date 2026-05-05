import api from './index'

export const rentalAdminApi = {
  list() {
    return api.get('/admin/rental-items')
  },
  create(data) {
    return api.post('/admin/rental-items', data)
  },
  update(id, data) {
    return api.put(`/admin/rental-items/${id}`, data)
  }
}
