import api from './index'

export const financeApi = {
  summary(period) {
    return api.get('/admin/finance/summary', { params: { period } })
  },
  byRoute() {
    return api.get('/admin/finance/by-route')
  }
}
