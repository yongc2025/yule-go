// 云函数：coupons
// 功能：优惠券管理（发放/查询/使用/过期）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// 券类型配置
const COUPON_TYPES = {
  newuser:   { name: '新人券',     amount: 10,  minAmount: 0,  expireDays: 30, desc: '新注册专享' },
  travel:    { name: '旅行券',     amount: 0,   minAmount: 0,  expireDays: 90, desc: '充值赠送' },
  repurchase:{ name: '复购券',     amount: 15,  minAmount: 0,  expireDays: 30, desc: '完成出行赠送' },
  invite:    { name: '邀请券',     amount: 15,  minAmount: 0,  expireDays: 30, desc: '受邀首单赠送' },
  wakeup:    { name: '唤醒券',     amount: 20,  minAmount: 0,  expireDays: 15, desc: '专属优惠' },
  equipment: { name: '装备租免券', amount: 0,   minAmount: 0,  expireDays: 60, desc: '装备免费租赁' }
}

exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 兼容平铺参数
  const params = event.data || event

  switch (action) {
    case 'list':
      return await listCoupons(openid, params)
    case 'available':
      return await getAvailableCoupons(openid, params)
    case 'grant':
      return await grantCoupon(openid, params)
    case 'use':
      return await useCoupon(openid, params)
    case 'count':
      return await countCoupons(openid)
    default:
      return { code: -1, message: '未知操作' }
  }
}

// 查询我的优惠券（分页 + Tab 筛选）
async function listCoupons(openid, { status = 'unused', page = 1, pageSize = 20 }) {
  try {
    const where = { openid }

    if (status === 'unused') {
      where.status = 'unused'
      where.expireAt = _.gte(new Date())
    } else if (status === 'used') {
      where.status = 'used'
    } else if (status === 'expired') {
      where.status = 'unused'
      where.expireAt = _.lt(new Date())
    }
    // status === 'all' 不加筛选

    const countRes = await db.collection('coupons').where(where).count()
    const dataRes = await db.collection('coupons')
      .where(where)
      .orderBy('createdAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 标记过期状态 + 补充类型名称
    const now = new Date()
    const list = dataRes.data.map(c => ({
      ...c,
      typeName: (COUPON_TYPES[c.type] || {}).name || c.type,
      expired: c.status === 'unused' && c.expireAt && new Date(c.expireAt) < now,
      desc: c.description || (COUPON_TYPES[c.type] || {}).desc || ''
    }))

    return {
      code: 0,
      data: { list, total: countRes.total, page, pageSize }
    }
  } catch (err) {
    return { code: -1, message: '查询失败: ' + err.message }
  }
}

// 查询可用优惠券（下单时选择）
async function getAvailableCoupons(openid, { orderType = 'travel', orderAmount = 0 }) {
  try {
    const now = new Date()
    const where = {
      openid,
      status: 'unused',
      expireAt: _.gte(now)
    }

    const res = await db.collection('coupons').where(where).get()

    // 筛选适用的券
    const available = res.data.filter(c => {
      // 装备券只能用于租赁订单
      if (c.type === 'equipment' && orderType !== 'equipment') return false
      // 旅行类券用于旅行订单
      if (c.type !== 'equipment' && orderType === 'equipment') return false
      // 最低消费校验
      if (c.minAmount && orderAmount < c.minAmount) return false
      return true
    }).map(c => ({
      ...c,
      typeName: (COUPON_TYPES[c.type] || {}).name || c.type,
      desc: c.description || (COUPON_TYPES[c.type] || {}).desc || ''
    }))

    return { code: 0, data: available }
  } catch (err) {
    return { code: -1, message: '查询失败: ' + err.message }
  }
}

// 发放优惠券（内部调用，供其他云函数使用）
async function grantCoupon(openid, { targetOpenid, type, amount, source, description, count = 1 }) {
  const target = targetOpenid || openid
  const typeConfig = COUPON_TYPES[type]
  if (!typeConfig) {
    return { code: -1, message: '无效的券类型' }
  }

  const couponAmount = amount || typeConfig.amount
  const now = new Date()
  const expireAt = new Date(now.getTime() + typeConfig.expireDays * 24 * 60 * 60 * 1000)

  try {
    const granted = []
    for (let i = 0; i < count; i++) {
      const res = await db.collection('coupons').add({
        data: {
          openid: target,
          type,
          amount: couponAmount,
          minAmount: typeConfig.minAmount,
          source: source || 'system',
          status: 'unused',
          description: description || typeConfig.desc,
          expireAt,
          createdAt: db.serverDate()
        }
      })
      granted.push(res._id)
    }

    return { code: 0, data: { ids: granted, count: granted.length } }
  } catch (err) {
    return { code: -1, message: '发放失败: ' + err.message }
  }
}

// 使用优惠券（下单时调用）
async function useCoupon(openid, { couponId, orderId }) {
  try {
    const res = await db.collection('coupons').doc(couponId).get()
    const coupon = res.data

    if (coupon.openid !== openid) {
      return { code: -1, message: '无权使用该券' }
    }
    if (coupon.status !== 'unused') {
      return { code: -1, message: '该券已使用或已过期' }
    }
    if (coupon.expireAt && new Date(coupon.expireAt) < new Date()) {
      return { code: -1, message: '该券已过期' }
    }

    await db.collection('coupons').doc(couponId).update({
      data: {
        status: 'used',
        orderId: orderId || '',
        usedAt: db.serverDate()
      }
    })

    return { code: 0, data: { amount: coupon.amount, type: coupon.type } }
  } catch (err) {
    return { code: -1, message: '使用失败: ' + err.message }
  }
}

// 统计可用券数量（我的页角标）
async function countCoupons(openid) {
  try {
    const now = new Date()
    const res = await db.collection('coupons').where({
      openid,
      status: 'unused',
      expireAt: _.gte(now)
    }).count()

    return { code: 0, data: { count: res.total } }
  } catch (err) {
    return { code: -1, message: '统计失败: ' + err.message }
  }
}
