App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      // env 参数说明：
      // 填入云开发环境 ID（在云开发控制台获取）
      // 如果不填则使用默认环境
      env: 'yule-prod', // TODO: 替换为实际环境 ID
      traceUser: true
    })

    // 自动登录
    this.autoLogin()
  },

  globalData: {
    userInfo: null,
    openid: null,
    isAdmin: false // 是否是店主（管理员）
  },

  // 自动登录：调用云函数获取 openid
  autoLogin() {
    wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then(res => {
      this.globalData.openid = res.result.openid
      console.log('登录成功，openid:', res.result.openid)

      // 检查是否是管理员
      this.checkAdmin(res.result.openid)
    }).catch(err => {
      console.error('登录失败:', err)
    })
  },

  // 检查管理员身份
  checkAdmin(openid) {
    const db = wx.cloud.database()
    db.collection('admins').where({
      openid: openid
    }).get().then(res => {
      if (res.data.length > 0) {
        this.globalData.isAdmin = true
        console.log('当前用户是管理员')
      }
    })
  }
})
