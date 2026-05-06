/**
 * API 配置
 * 开发环境：修改 DEV_API_BASE 为本机地址
 * 生产环境：修改 PROD_API_BASE 为线上地址
 */
const DEV_API_BASE = 'http://localhost:8080/api/v1'
const PROD_API_BASE = 'https://api.yule-go.com/api/v1'

// 当前环境：开发环境用 DEV，构建后用 PROD
const API_BASE = DEV_API_BASE

/**
 * 统一请求封装
 */
function request(options) {
  return new Promise((resolve, reject) => {
    // 从缓存读取 token
    const token = uni.getStorageSync('token')
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    }
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    uni.request({
      url: API_BASE + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success(res) {
        if (res.statusCode === 200 && res.data.code === 0) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // token 过期，清除并跳转登录
          uni.removeStorageSync('token')
          uni.showToast({ title: '登录已过期', icon: 'none' })
          reject(new Error('未登录'))
        } else {
          const msg = res.data?.message || '请求失败'
          uni.showToast({ title: msg, icon: 'none' })
          reject(new Error(msg))
        }
      },
      fail(err) {
        uni.showToast({ title: '网络异常', icon: 'none' })
        reject(err)
      }
    })
  })
}

export default request
