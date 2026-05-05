import api from './index'

export const adminApi = {
  login(username, password) {
    return api.post('/admin/auth/login', { username, password })
  },
  dashboard() {
    return api.get('/admin/dashboard')
  }
}
