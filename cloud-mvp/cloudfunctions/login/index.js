// 云函数：login
// 功能：获取用户 openid，自动创建用户记录，返回完整用户信息
// 裂变：新用户自动生成唯一邀请码 + 支持绑定邀请关系

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 生成 6 位随机邀请码（大写字母+数字，排除易混淆字符 O/0/I/1/L）
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
function generateInviteCode() {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length))
  }
  return code
}

// 生成唯一邀请码（冲突自动重试，最多 5 次）
async function generateUniqueInviteCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode()
    const existing = await db.collection('users').where({ inviteCode: code }).count()
    if (existing.total === 0) {
      return code
    }
  }
  // 极端情况：附加时间戳后缀兜底
  return generateInviteCode() + Date.now().toString(36).slice(-2).toUpperCase()
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 检查用户是否已存在
    const userRes = await db.collection('users').where({ openid }).get()

    let user = null
    if (userRes.data.length === 0) {
      // 新用户，生成唯一邀请码
      const inviteCode = await generateUniqueInviteCode()

      // 新用户，创建记录（含邀请码）
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
        inviteCode,
        invitedBy: '',
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

      // 如果携带了邀请码，绑定邀请关系
      if (event.inviteCode) {
        try {
          await bindInvite(event.inviteCode, openid)
        } catch (bindErr) {
          console.error('邀请绑定失败（不影响登录）:', bindErr)
        }
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
          isGuide: user.isGuide || false,
          inviteCode: user.inviteCode || ''
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

// 绑定邀请关系（新用户被邀请）
async function bindInvite(inviteCode, inviteeOpenid) {
  // 1. 查找邀请人
  const inviterRes = await db.collection('users').where({ inviteCode }).get()
  if (inviterRes.data.length === 0) {
    console.error('邀请码无效:', inviteCode)
    return
  }
  const inviter = inviterRes.data[0]

  // 2. 不能自己邀请自己
  if (inviter.openid === inviteeOpenid) {
    console.log('不能自己邀请自己')
    return
  }

  // 3. 检查被邀请人是否已被邀请过（每个新用户只能被邀请一次）
  const inviteeUser = await db.collection('users').where({ openid: inviteeOpenid }).get()
  if (inviteeUser.data.length > 0 && inviteeUser.data[0].invitedBy) {
    console.log('该用户已被邀请过')
    return
  }

  // 4. 更新被邀请人的 invitedBy 字段
  await db.collection('users').where({ openid: inviteeOpenid }).update({
    data: { invitedBy: inviter.openid, updatedAt: db.serverDate() }
  })

  // 5. 创建 referral 记录（待被邀请人首单支付后完成）
  await db.collection('referrals').add({
    data: {
      inviterOpenid: inviter.openid,
      inviteeOpenid,
      inviteCode,
      rewardAmount: 20,
      newUserDiscount: 15,
      status: 'pending',
      orderId: '',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }
  })
}
