/**
 * 云函数调用封装
 * 统一错误处理 + loading + 重试
 */

// 调用云函数（带 loading）
function call(name, data = {}, { showLoading = true, retry = false } = {}) {
  if (showLoading) {
    wx.showLoading({ title: '加载中...', mask: true })
  }

  return wx.cloud.callFunction({
    name,
    data
  }).then(res => {
    if (showLoading) wx.hideLoading()

    // 云函数返回格式：{ code: 0, data: ..., message: 'ok' }
    const result = res.result
    if (result.code !== 0) {
      wx.showToast({ title: result.message || '请求失败', icon: 'none' })
      return Promise.reject(result)
    }
    return result.data
  }).catch(err => {
    if (showLoading) wx.hideLoading()
    console.error(`云函数 [${name}] 调用失败:`, err)

    // 简单重试一次
    if (retry) {
      return call(name, data, { showLoading: false, retry: false })
    }

    wx.showToast({ title: '网络异常，请重试', icon: 'none' })
    return Promise.reject(err)
  })
}

// 不带 loading 的静默调用
function callSilent(name, data = {}) {
  return call(name, data, { showLoading: false })
}

module.exports = {
  call,
  callSilent
}
