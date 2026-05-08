// 云函数：wallet
// 功能：用户钱包管理（余额/会员等级/充值/退还/日志）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 会员等级配置
const MEMBER_LEVELS = [
  { level: 0, name: '普通用户', minRecharge: 0, travelDiscount: 0, equipDiscount: 1.0 },
  { level: 1, name: '银卡会员', minRecharge: 200, travelDiscount: 10, equipDiscount: 0.95 },
  { level: 2, name: '金卡会员', minRecharge: 500, travelDiscount: 20, equipDiscount: 0.90 },
  { level: 3, name: '钻石会员', minRecharge: 1000, travelDiscount: 30, equipDiscount: 0.85 }
]

// 充值档位
const RECHARGE_TIERS = [
  {
    id: 'silver',
    amount: 200,
    level: 1,
    levelName: '银卡',
    travelDiscount: 10,
    equipDiscount: '9.5折',
    gifts: ['旅行券 ¥10 ×1'],
    giftCoupons: [{ type: 'travel', amount: 10, count: 1 }]
  },
  {
    id: 'gold',
    amount: 500,
    level: 2,
    levelName: '金卡',
    travelDiscount: 20,
    equipDiscount: '9折',
    gifts: ['旅行券 ¥20 ×2', '装备免费租 ×1'],
    giftCoupons: [
      { type: 'travel', amount: 20, count: 2 },
      { type: 'equipment', amount: 0, count: 1, desc: '装备免费租赁1次' }
    ]
  },
  {
    id: 'diamond',
    amount: 1000,
    level: 3,
    levelName: '钻石',
    travelDiscount: 30,
    equipDiscount: '8.5折',
    gifts: ['免费出行 ×1', '装备免费租 ×3'],
    giftCoupons: [
      { type: 'travel_free', amount: 0, count: 1, desc: '免费单日出行1次' },
      { type: 'equipment', amount: 0, count: 3, desc: '装备免费租赁3次' }
    ]
  }
]

exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'getWallet':
      return await getWallet(openid, event.merchantId)
    case 'getWallets':
      return await getWallets(openid)
    case 'recharge':
      return await recharge(openid, event)
    case 'rechargeList':
      return await rechargeList(openid, event)
    case 'walletLogs':
      return await walletLogs(openid, event)
    case 'getTiers':
      return { code: 0, data: RECHARGE_TIERS }
    case 'refundBalance':
      return await refundBalance(openid, event)
    case 'adminRefund':
      return await adminRefund(openid, event)
    default:
      return { code: -1, message: '未知操作' }
  }
}

// 获取指定门店的钱包信息
async function getWallet(openid, merchantId) {
  try {
    const res = await db.collection('user_wallets')
      .where({ openid, merchantId })
      .get()

    if (res.data.length === 0) {
      // 没有钱包，返回默认值
      return {
        code: 0,
        data: {
          balance: 0,
          memberLevel: 0,
          memberName: '普通用户',
          totalRecharge: 0,
          travelDiscount: 0,
          equipDiscount: '无'
        }
      }
    }

    const wallet = res.data[0]
    const levelInfo = MEMBER_LEVELS.find(l => l.level === wallet.memberLevel) || MEMBER_LEVELS[0]

    return {
      code: 0,
      data: {
        _id: wallet._id,
        balance: wallet.balance || 0,
        memberLevel: wallet.memberLevel || 0,
        memberName: levelInfo.name,
        totalRecharge: wallet.totalRecharge || 0,
        travelDiscount: levelInfo.travelDiscount,
        equipDiscount: levelInfo.equipDiscount === 1.0 ? '无' : `${levelInfo.equipDiscount * 10}折`
      }
    }
  } catch (err) {
    return { code: -1, message: '查询失败: ' + err.message }
  }
}

// 获取用户所有门店的钱包
async function getWallets(openid) {
  try {
    const res = await db.collection('user_wallets')
      .where({ openid })
      .orderBy('updatedAt', 'desc')
      .get()

    const wallets = res.data.map(w => {
      const levelInfo = MEMBER_LEVELS.find(l => l.level === w.memberLevel) || MEMBER_LEVELS[0]
      return {
        ...w,
        memberName: levelInfo.name,
        travelDiscount: levelInfo.travelDiscount
      }
    })

    return { code: 0, data: wallets }
  } catch (err) {
    return { code: -1, message: '查询失败: ' + err.message }
  }
}

// 充值（模拟充值，MVP 阶段不走真实支付）
async function recharge(openid, { merchantId, tierId }) {
  try {
    // 查找充值档位
    const tier = RECHARGE_TIERS.find(t => t.id === tierId)
    if (!tier) {
      return { code: -1, message: '无效的充值档位' }
    }

    // 查询或创建钱包
    const walletRes = await db.collection('user_wallets')
      .where({ openid, merchantId })
      .get()

    let walletId
    const now = db.serverDate()

    if (walletRes.data.length === 0) {
      // 新建钱包
      const newWallet = await db.collection('user_wallets').add({
        data: {
          openid,
          merchantId,
          balance: tier.amount,
          memberLevel: tier.level,
          totalRecharge: tier.amount,
          createdAt: now,
          updatedAt: now
        }
      })
      walletId = newWallet._id
    } else {
      // 更新钱包
      const wallet = walletRes.data[0]
      walletId = wallet._id
      const newBalance = (wallet.balance || 0) + tier.amount
      const newTotal = (wallet.totalRecharge || 0) + tier.amount
      // 等级取累计充值对应的最高等级
      const newLevel = calcLevel(newTotal)

      await db.collection('user_wallets').doc(walletId).update({
        data: {
          balance: newBalance,
          memberLevel: newLevel,
          totalRecharge: newTotal,
          updatedAt: now
        }
      })
    }

    // 记录充值流水
    await db.collection('wallet_logs').add({
      data: {
        openid,
        merchantId,
        type: 'recharge',
        amount: tier.amount,
        balanceAfter: walletRes.data.length > 0
          ? (walletRes.data[0].balance || 0) + tier.amount
          : tier.amount,
        description: `充值 ¥${tier.amount}，升级为${tier.levelName}会员`,
        createdAt: now
      }
    })

    // 记录充值记录
    await db.collection('recharges').add({
      data: {
        openid,
        merchantId,
        amount: tier.amount,
        tierId: tier.id,
        levelName: tier.levelName,
        gifts: tier.gifts,
        status: 'paid', // MVP 模拟充值直接成功
        createdAt: now
      }
    })

    // 发放赠送优惠券
    const grantedCoupons = []
    if (tier.giftCoupons) {
      for (const gift of tier.giftCoupons) {
        for (let i = 0; i < (gift.count || 1); i++) {
          const coupon = {
            openid,
            merchantId,
            type: gift.type,
            amount: gift.amount,
            minAmount: 0,
            source: 'recharge',
            status: 'unused',
            expireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天
            createdAt: now
          }
          if (gift.desc) coupon.description = gift.desc
          const added = await db.collection('coupons').add({ data: coupon })
          grantedCoupons.push(added._id)
        }
      }
    }

    // 返回更新后的钱包
    const updatedWallet = await db.collection('user_wallets').doc(walletId).get()

    return {
      code: 0,
      data: {
        wallet: updatedWallet.data,
        rechargeAmount: tier.amount,
        levelName: tier.levelName,
        gifts: tier.gifts,
        couponCount: grantedCoupons.length
      },
      message: `充值成功！已升级为${tier.levelName}会员`
    }
  } catch (err) {
    return { code: -1, message: '充值失败: ' + err.message }
  }
}

// 充值记录
async function rechargeList(openid, { merchantId, page = 1, pageSize = 20 }) {
  try {
    const where = { openid }
    if (merchantId) where.merchantId = merchantId

    const countRes = await db.collection('recharges').where(where).count()
    const dataRes = await db.collection('recharges')
      .where(where)
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
    return { code: -1, message: '查询失败: ' + err.message }
  }
}

// 钱包流水日志
async function walletLogs(openid, { merchantId, page = 1, pageSize = 20 }) {
  try {
    const where = { openid }
    if (merchantId) where.merchantId = merchantId

    const countRes = await db.collection('wallet_logs').where(where).count()
    const dataRes = await db.collection('wallet_logs')
      .where(where)
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
    return { code: -1, message: '查询失败: ' + err.message }
  }
}

// 用户申请退还余额（销户前）
async function refundBalance(openid, { merchantId }) {
  try {
    const walletRes = await db.collection('user_wallets')
      .where({ openid, merchantId })
      .get()

    if (walletRes.data.length === 0) {
      return { code: -1, message: '无钱包记录' }
    }

    const wallet = walletRes.data[0]
    if (wallet.balance <= 0) {
      return { code: 0, data: { balance: 0 }, message: '余额为0，无需退还' }
    }

    return {
      code: 0,
      data: { balance: wallet.balance },
      message: `余额 ¥${wallet.balance}，请到门店办理退还`
    }
  } catch (err) {
    return { code: -1, message: '查询失败: ' + err.message }
  }
}

// 店主操作退还余额
async function adminRefund(openid, { merchantId, targetOpenid, amount }) {
  try {
    // 验证是否是该店管理员
    const adminRes = await db.collection('admins').where({ openid }).get()
    if (adminRes.data.length === 0) {
      return { code: -1, message: '无权限' }
    }

    if (!amount || amount <= 0) {
      return { code: -1, message: '退还金额不正确' }
    }

    const walletRes = await db.collection('user_wallets')
      .where({ openid: targetOpenid, merchantId })
      .get()

    if (walletRes.data.length === 0) {
      return { code: -1, message: '用户无钱包记录' }
    }

    const wallet = walletRes.data[0]
    if (amount > wallet.balance) {
      return { code: -1, message: `退还金额不能超过余额 ¥${wallet.balance}` }
    }

    const now = db.serverDate()
    const newBalance = wallet.balance - amount

    // 更新钱包余额
    await db.collection('user_wallets').doc(wallet._id).update({
      data: {
        balance: newBalance,
        updatedAt: now
      }
    })

    // 记录退还日志
    await db.collection('wallet_logs').add({
      data: {
        openid: targetOpenid,
        merchantId,
        type: 'refund',
        amount: -amount,
        balanceAfter: newBalance,
        description: `店主退还余额 ¥${amount}`,
        operatorOpenid: openid,
        createdAt: now
      }
    })

    return {
      code: 0,
      data: { refundAmount: amount, newBalance },
      message: `已退还 ¥${amount}`
    }
  } catch (err) {
    return { code: -1, message: '退还失败: ' + err.message }
  }
}

// 根据累计充值计算等级
function calcLevel(totalRecharge) {
  if (totalRecharge >= 1000) return 3
  if (totalRecharge >= 500) return 2
  if (totalRecharge >= 200) return 1
  return 0
}
