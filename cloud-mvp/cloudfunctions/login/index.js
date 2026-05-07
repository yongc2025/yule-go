// 云函数：login
// 功能：获取用户 openid，自动创建用户记录

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 检查用户是否已存在
    const userRes = await db.collection('users').where({ openid }).get()

    if (userRes.data.length === 0) {
      // 新用户，创建记录
      await db.collection('users').add({
        data: {
          openid,
          nickname: '',
          avatar: '',
          phone: '',
          balance: 0,
          memberLevel: 0,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
    }

    return {
      code: 0,
      data: { openid },
      message: 'ok'
    }
  } catch (err) {
    console.error('登录失败:', err)
    return {
      code: -1,
      data: null,
      message: '登录失败'
    }
  }
}
