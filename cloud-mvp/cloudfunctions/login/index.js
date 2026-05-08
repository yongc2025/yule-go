// 云函数：login
// 功能：获取用户 openid，自动创建用户记录，返回完整用户信息

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 检查用户是否已存在
    const userRes = await db.collection('users').where({ openid }).get()

    let user = null
    if (userRes.data.length === 0) {
      // 新用户，创建记录
      const newUser = {
        openid,
        nickname: event.nickname || '',
        avatar: event.avatar || '',
        phone: '',
        bio: '',
        album: [],
        balance: 0,
        memberLevel: 0,
        isGuide: false,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
      const addRes = await db.collection('users').add({ data: newUser })
      user = { _id: addRes._id, ...newUser }

      // 新用户自动发放新人券
      try {
        const expireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        await db.collection('coupons').add({
          data: {
            openid,
            type: 'newuser',
            amount: 10,
            minAmount: 0,
            source: 'register',
            status: 'unused',
            description: '新注册专享',
            expireAt,
            createdAt: db.serverDate()
          }
        })
      } catch (couponErr) {
        console.error('新人券发放失败（不影响登录）:', couponErr)
      }
    } else {
      user = userRes.data[0]

      // 如果登录时传了昵称/头像（首次授权），更新
      if (event.nickname || event.avatar) {
        const updates = {}
        if (event.nickname && !user.nickname) updates.nickname = event.nickname
        if (event.avatar && !user.avatar) updates.avatar = event.avatar
        if (Object.keys(updates).length > 0) {
          updates.updatedAt = db.serverDate()
          await db.collection('users').doc(user._id).update({ data: updates })
          Object.assign(user, updates)
        }
      }
    }

    return {
      code: 0,
      data: {
        openid,
        user: {
          _id: user._id,
          nickname: user.nickname || '',
          avatar: user.avatar || '',
          phone: user.phone || '',
          bio: user.bio || '',
          album: user.album || [],
          balance: user.balance || 0,
          memberLevel: user.memberLevel || 0,
          isGuide: user.isGuide || false
        }
      },
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
