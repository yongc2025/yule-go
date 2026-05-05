import request from './index'

/**
 * 会员 API
 */
export const memberApi = {
  /**
   * 获取充值方案
   */
  getPlans() {
    return request({ url: '/member/plans' })
  },

  /**
   * 获取会员信息
   */
  getInfo() {
    return request({ url: '/member/info' })
  },

  /**
   * 发起充值
   */
  recharge(plan) {
    return request({ url: '/member/recharge', method: 'POST', data: { plan } })
  },

  /**
   * 充值记录
   */
  recharges(params) {
    return request({ url: '/member/recharges', data: params })
  }
}
