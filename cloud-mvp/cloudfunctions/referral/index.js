// 云函数：referral
// 功能：老带新裂变（邀请信息查询 / 绑定邀请关系 / 发放奖励）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'getInviteInfo':
      return await getInviteInfo(openid)
    case 'bindInvite':
      return await bindInvite(event.inviteCode, openid)
    case 'grantReward':
      return await grantReward(event.orderId, event.inviteeOpenid)
    case 'getInviteList':
      return await getInviteList(openid)
    default:
      return { code: -1, message: '未知操作' }
  }
}

// 查询邀请信息（我的邀请码 + 邀请记录 + 累计奖励）
async function getInviteInfo(openid) {
  try {
    // 1. 获取当前用户的邀请码
    const userRes = await db.collection('users').where({ openid }).get()
    if (userRes.data.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const user = userRes.data[0]
    const inviteCode = user.inviteCode || ''

    // 2. 查询邀请记录（我邀请了谁）
    const referralsRes = await db.collection('referrals')
      .where({ inviterOpenid: openid })
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    const referrals = referralsRes.data

    // 3. 统计奖励
    let totalReward = 0
    let completedCount = 0
    let pendingCount = 0

    for (const r of referrals) {
      if (r.status === 'completed') {
        totalReward += (r.rewardAmount || 0)
        completedCount++
      } else {
        pendingCount++
      }
    }

    // 4. 补充被邀请人昵称头像
    const inviteeOpenids = [...new Set(referrals.map(r => r.inviteeOpenid).filter(Boolean))]
    const inviteeMap = {}
    if (inviteeOpenids.length > 0) {
      // 云数据库 where in 最多 20 条，分批查询
      for (let i = 0; i < inviteeOpenids.length; i += 20) {
        const batch = inviteeOpenids.slice(i, i + 20)
        const usersRes = await db.collection('users')
          .where({ openid: _.in(batch) })
          .field({ openid: true, nickname: true, avatar: true })
          .get()
        for (const u of usersRes.data) {
          inviteeMap[u.openid] = u
        }
      }
    }

    const list = referrals.map(r => {
      const invitee = inviteeMap[r.inviteeOpenid] || {}
      return {
        _id: r._id,
        inviteeNickname: invitee.nickname || '微信用户',
        inviteeAvatar: invitee.avatar || '',
        rewardAmount: r.rewardAmount || 0,
        newUserDiscount: r.newUserDiscount || 0,
        status: r.status,
        orderId: r.orderId || '',
        createdAt: r.createdAt
      }
    })

    return {
      code: 0,
      data: {
        inviteCode,
        totalReward,
        completedCount,
        pendingCount,
        list
      }
    }
  } catch (err) {
    console.error('查询邀请信息失败:', err)
    return { code: -1, message: '查询失败' }
  }
}

// 绑定邀请关系（新用户通过邀请码注册）
async function bindInvite(inviteCode, inviteeOpenid) {
  try {
    if (!inviteCode) {
      return { code: -1, message: '缺少邀请码' }
    }

    // 1. 查找邀请人
    const inviterRes = await db.collection('users').where({ inviteCode }).get()
    if (inviterRes.data.length === 0) {
      return { code: -1, message: '邀请码无效' }
    }
    const inviter = inviterRes.data[0]

    // 2. 不能自己邀请自己
    if (inviter.openid === inviteeOpenid) {
      return { code: -1, message: '不能邀请自己' }
    }

    // 3. 检查被邀请人是否已被邀请过（每个新用户只能被邀请一次）
    const inviteeRes = await db.collection('users').where({ openid: inviteeOpenid }).get()
    if (inviteeRes.data.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    if (inviteeRes.data[0].invitedBy) {
      return { code: -1, message: '你已被其他人邀请' }
    }

    // 4. 更新被邀请人的 invitedBy 字段
    await db.collection('users').where({ openid: inviteeOpenid }).update({
      data: { invitedBy: inviter.openid, updatedAt: db.serverDate() }
    })

    // 5. 创建 referral 记录
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

    return { code: 0, message: '绑定成功', data: { inviterNickname: inviter.nickname || '微信用户' } }
  } catch (err) {
    console.error('绑定邀请关系失败:', err)
    return { code: -1, message: '绑定失败' }
  }
}

// 发放邀请奖励（被邀请人首单支付成功后调用）
// AC-04: 被邀请人首单立减 ¥15（在下单时已处理）
// AC-05: 邀请人余额增加 ¥20（本函数处理）
async function grantReward(orderId, inviteeOpenid) {
  try {
    if (!inviteeOpenid) {
      return { code: -1, message: '缺少被邀请人openid' }
    }

    // 1. 查询被邀请人的邀请关系
    const inviteeRes = await db.collection('users').where({ openid: inviteeOpenid }).get()
    if (inviteeRes.data.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    const invitee = inviteeRes.data[0]
    const inviterOpenid = invitee.invitedBy
    if (!inviterOpenid) {
      return { code: 0, message: '无邀请关系，跳过' }
    }

    // 2. 查询待完成的 referral 记录
    const referralRes = await db.collection('referrals')
      .where({
        inviterOpenid,
        inviteeOpenid,
        status: 'pending'
      })
      .get()

    if (referralRes.data.length === 0) {
      return { code: 0, message: '无待完成的邀请记录或已发放' }
    }

    const referral = referralRes.data[0]

    // 3. 更新 referral 记录为已完成
    await db.collection('referrals').doc(referral._id).update({
      data: {
        status: 'completed',
        orderId: orderId || '',
        updatedAt: db.serverDate()
      }
    })

    // 4. 邀请人余额增加 ¥20
    await db.collection('users').where({ openid: inviterOpenid }).update({
      data: {
        balance: _.inc(20),
        updatedAt: db.serverDate()
      }
    })

    // 5. 记录钱包日志
    await db.collection('wallet_logs').add({
      data: {
        openid: inviterOpenid,
        type: 'invite_reward',
        amount: 20,
        description: `邀请好友奖励（${invitee.nickname || '微信用户'}首单成功）`,
        orderId: orderId || '',
        createdAt: db.serverDate()
      }
    })

    return {
      code: 0,
      message: '奖励发放成功',
      data: {
        rewardAmount: 20,
        inviterOpenid
      }
    }
  } catch (err) {
    console.error('发放邀请奖励失败:', err)
    return { code: -1, message: '奖励发放失败' }
  }
}

// 查询邀请记录列表（分页）
async function getInviteList(openid, { page = 1, pageSize = 20 } = {}) {
  try {
    const countRes = await db.collection('referrals')
      .where({ inviterOpenid: openid })
      .count()

    const dataRes = await db.collection('referrals')
      .where({ inviterOpenid: openid })
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    return {
      code: 0,
      data: {
        list: dataRes.data,
        total: countRes.total,
        page,
        pageSize
      }
    }
  } catch (err) {
    console.error('查询邀请列表失败:', err)
    return { code: -1, message: '查询失败' }
  }
}
