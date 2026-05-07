/**
 * API 配置
 * 开发环境：修改 DEV_API_BASE 为本机地址
 * 生产环境：修改 PROD_API_BASE 为线上地址
 */
const DEV_API_BASE = 'http://localhost:8080/api/v1'
const PROD_API_BASE = 'https://api.yule-go.com/api/v1'

// 当前环境：开发环境用 DEV，构建后用 PROD
const API_BASE = DEV_API_BASE

// 防止并发重复登录
let isRelogining = false
let reloginQueue = []

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
          // token 过期，尝试自动重新登录
          handleUnauthorized(options, resolve, reject)
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

/**
 * 处理 401：自动重新登录后重试原请求
 */
function handleUnauthorized(originalOptions, resolve, reject) {
  if (isRelogining) {
    // 已有登录进行中，排队等待
    reloginQueue.push({ originalOptions, resolve, reject })
    return
  }

  isRelogining = true
  uni.removeStorageSync('token')

  import('../utils/auth.js').then(({ wxLogin }) => {
    wxLogin().then(() => {
      isRelogining = false
      // 重试原请求
      request(originalOptions).then(resolve).catch(reject)
      // 处理排队的请求
      reloginQueue.forEach(item => {
        request(item.originalOptions).then(item.resolve).catch(item.reject)
      })
      reloginQueue = []
    }).catch(err => {
      isRelogining = false
      reloginQueue = []
      uni.showToast({ title: '登录失败，请重试', icon: 'none' })
      reject(err)
    })
  }).catch(err => {
    isRelogining = false
    reloginQueue = []
    reject(err)
  })
}

export default request
