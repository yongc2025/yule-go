// 云函数：checkin
// 功能：核销（扫码 + 手动输入）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'scan':
      return await checkinByCode(event, openid)
    case 'manual':
      return await checkinByCode(event, openid)
    case 'stats':
      return await getCheckinStats(event, openid)
    default:
      return { code: -1, message: '未知操作' }
  }
}

// 核销（通过核销码）
async function checkinByCode({ checkinCode, scheduleId }, openid) {
  // 1. 验证管理员权限
  if (!await isAdmin(openid)) {
    return { code: -1, message: '无核销权限' }
  }

  try {
    // 2. 查找订单
    const orderRes = await db.collection('orders').where({
      checkinCode: checkinCode,
      status: 'paid'
    }).get()

    if (orderRes.data.length === 0) {
      return { code: -1, message: '核销码无效或已使用' }
    }

    const order = orderRes.data[0]

    // 3. 校验是否是当前团期的订单
    if (scheduleId && order.scheduleId !== scheduleId) {
      return { code: -1, message: '该订单不属于当前团期' }
    }

    // 4. 执行核销
    await db.collection('orders').doc(order._id).update({
      data: {
        status: 'completed',
        checkedInAt: db.serverDate(),
        checkedInBy: openid,
        updatedAt: db.serverDate()
      }
    })

    return {
      code: 0,
      data: {
        orderNo: order.orderNo,
        activityName: order.activityName,
        contactName: order.contactName,
        adults: order.adults,
        children: order.children,
        totalFee: order.totalFee
      },
      message: '核销成功'
    }
  } catch (err) {
    return { code: -1, message: '核销失败: ' + err.message }
  }
}

// 核销统计（某团期）
async function getCheckinStats({ scheduleId }, openid) {
  if (!await isAdmin(openid)) {
    return { code: -1, message: '无权限' }
  }

  try {
    // 总订单数
    const totalRes = await db.collection('orders').where({
      scheduleId,
      status: _.in(['paid', 'completed'])
    }).count()

    // 已核销数
    const checkedRes = await db.collection('orders').where({
      scheduleId,
      status: 'completed'
    }).count()

    // 未核销数（已支付但未核销）
    const uncheckedRes = await db.collection('orders').where({
      scheduleId,
      status: 'paid'
    }).count()

    // 已核销人员列表
    const checkedList = await db.collection('orders').where({
      scheduleId,
      status: 'completed'
    }).orderBy('checkedInAt', 'desc').get()

    return {
      code: 0,
      data: {
        total: totalRes.total,
        checkedIn: checkedRes.total,
        unchecked: uncheckedRes.total,
        checkedList: checkedList.data.map(o => ({
          orderNo: o.orderNo,
          contactName: o.contactName,
          adults: o.adults,
          children: o.children,
          checkedInAt: o.checkedInAt
        }))
      }
    }
  } catch (err) {
    return { code: -1, message: '查询失败' }
  }
}

// 检查是否是管理员
async function isAdmin(openid) {
  const res = await db.collection('admins').where({ openid }).get()
  return res.data.length > 0
}
