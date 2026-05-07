import request from './index'

/**
 * 认证 API
 */
export const authApi = {
  /**
   * 微信登录（code 换 token）
   * @param {string} code — wx.login() 获取的 code
   */
  wxLogin(code) {
    return request({
      url: '/auth/wx-login',
      method: 'POST',
      data: { code }
    })
  }
}
