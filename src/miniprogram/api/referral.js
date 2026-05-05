import request from './index'

/**
 * 裂变 API
 */
export const referralApi = {
  /**
   * 获取邀请信息
   */
  getMy() {
    return request({ url: '/referral/my' })
  },

  /**
   * 绑定邀请关系
   */
  bind(inviteCode) {
    return request({ url: '/referral/bind', method: 'POST', data: { invite_code: inviteCode } })
  }
}
