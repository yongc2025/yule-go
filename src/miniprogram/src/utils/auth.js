const TOKEN_KEY = 'token'

/**
 * 获取本地存储的 token
 */
export function getToken() {
  return uni.getStorageSync(TOKEN_KEY) || ''
}

/**
 * 保存 token 到本地
 */
export function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token)
}

/**
 * 清除 token
 */
export function clearToken() {
  uni.removeStorageSync(TOKEN_KEY)
}

/**
 * 检查是否有 token
 */
export function hasToken() {
  return !!getToken()
}

/**
 * 微信登录流程：wx.login → 后端换取 token → 存储
 * @returns {Promise<{token: string, user: object, is_new: boolean}>}
 */
export function wxLogin() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success(loginRes) {
        if (!loginRes.code) {
          reject(new Error('wx.login 获取 code 失败'))
          return
        }

        // 动态导入避免循环依赖
        import('../api/auth.js').then(({ authApi }) => {
          authApi.wxLogin(loginRes.code).then(res => {
            const { token, user, is_new } = res.data
            setToken(token)
            resolve({ token, user, is_new })
          }).catch(reject)
        }).catch(reject)
      },
      fail(err) {
        reject(new Error('wx.login 调用失败: ' + err.errMsg))
      }
    })
  })
}
