import api from './index'

export const routeAdminApi = {
  list() {
    return api.get('/admin/routes')
  },
  update(id, data) {
    return api.put(`/admin/routes/${id}`, data)
  }
}
