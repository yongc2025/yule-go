// 云函数：schedules
// 功能：团期管理（管理员编辑/取消，含自动退款 + 通知）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'update':
      return await updateSchedule(data, openid)
    case 'cancel':
      return await cancelSchedule(data, openid)
    case 'detail':
      return await getScheduleDetail(data)
    case 'changelog':
      return await getChangelog(data, openid)
    default:
      return { code: -1, message: '未知操作' }
  }
}

// 编辑团期（日期/名额/集合地点）
async function updateSchedule({ id, date, maxSlots, location }, openid) {
  if (!await isAdmin(openid)) {
    return { code: -1, message: '无权限' }
  }

  try {
    // 获取原团期
    const oldRes = await db.collection('schedules').doc(id).get()
    const old = oldRes.data

    if (old.status === 'cancelled') {
      return { code: -1, message: '已取消的团期不可编辑' }
    }

    // 构建更新字段
    const updates = { updatedAt: db.serverDate() }
    const changes = []

    if (date && date !== old.date) {
      updates.date = date
      changes.push(`日期: ${old.date} → ${date}`)
    }
    if (maxSlots !== undefined && maxSlots !== old.maxSlots) {
      updates.maxSlots = maxSlots
      changes.push(`名额: ${old.maxSlots} → ${maxSlots}`)
    }
    if (location !== undefined && location !== (old.location || '')) {
      updates.location = location
      changes.push(`集合地点: ${old.location || '未设置'} → ${location}`)
    }

    if (changes.length === 0) {
      return { code: 0, message: '无变更' }
    }

    // 写入变更记录
    const changelog = {
      scheduleId: id,
      activityId: old.activityId,
      activityName: old.activityName || '',
      type: 'update',
      changes,
      operatorOpenid: openid,
      createdAt: db.serverDate()
    }

    await db.collection('schedule_changelogs').add({ data: changelog })

    // 更新团期
    await db.collection('schedules').doc(id).update({ data: updates })

    // 发送通知给已报名用户（异步，不阻塞返回）
    notifyBookedUsers(id, 'update', changes).catch(err => {
      console.error('通知发送失败:', err)
    })

    return { code: 0, message: '更新成功', data: { changes } }
  } catch (err) {
    return { code: -1, message: '更新失败: ' + err.message }
  }
}

// 取消团期（自动退款 + 通知）
async function cancelSchedule({ id, reason }, openid) {
  if (!await isAdmin(openid)) {
    return { code: -1, message: '无权限' }
  }

  try {
    const scheduleRes = await db.collection('schedules').doc(id).get()
    const schedule = scheduleRes.data

    if (schedule.status === 'cancelled') {
      return { code: -1, message: '该团期已取消' }
    }

    // 1. 标记团期为已取消
    await db.collection('schedules').doc(id).update({
      data: {
        status: 'cancelled',
        cancelReason: reason || '',
        cancelledAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })

    // 2. 写入变更记录
    await db.collection('schedule_changelogs').add({
      data: {
        scheduleId: id,
        activityId: schedule.activityId,
        activityName: schedule.activityName || '',
        type: 'cancel',
        changes: [`团期取消${reason ? '，原因: ' + reason : ''}`],
        operatorOpenid: openid,
        createdAt: db.serverDate()
      }
    })

    // 3. 查询该团期所有已支付订单，自动退款
    const paidOrders = await db.collection('orders')
      .where({
        scheduleId: id,
        status: 'paid'
      })
      .get()

    let refundCount = 0
    let refundTotal = 0
    const refundErrors = []

    for (const order of paidOrders.data) {
      try {
        const refundAmount = order.totalFee || 0
        const refundNo = 'RF' + Date.now() + String(Math.random()).slice(2, 6)

        // 模拟支付直接标记退款，真实支付调 cloudPay
        const isMockPay = !order.paymentParams ||
          (order.paymentParams.package && order.paymentParams.package.includes('mock'))

        if (!isMockPay && order.paymentParams && order.paymentParams.transactionId) {
          try {
            await cloud.cloudPay.refund({
              subMchId: process.env.SUB_MCH_ID,
              transactionId: order.paymentParams.transactionId,
              outTradeNo: order.orderNo,
              outRefundNo: refundNo,
              totalFee: Math.round(refundAmount * 100),
              refundFee: Math.round(refundAmount * 100)
            })
          } catch (refundErr) {
            console.error(`订单 ${order.orderNo} 退款接口失败:`, refundErr)
          }
        }

        // 更新订单状态
        await db.collection('orders').doc(order._id).update({
          data: {
            status: 'refunded',
            refundNo,
            refundAmount,
            refundReason: '团期取消自动退款',
            refundAt: db.serverDate(),
            updatedAt: db.serverDate()
          }
        })

        // 退还名额
        const totalPeople = (order.adults || 0) + (order.children || 0)
        await db.collection('schedules').doc(id).update({
          data: { bookedSlots: _.inc(-totalPeople) }
        })

        refundCount++
        refundTotal += refundAmount
      } catch (err) {
        refundErrors.push(`${order.orderNo}: ${err.message}`)
      }
    }

    // 4. 发送取消通知（异步）
    notifyBookedUsers(id, 'cancel', [reason || '团期取消']).catch(err => {
      console.error('取消通知发送失败:', err)
    })

    return {
      code: 0,
      message: '团期已取消',
      data: {
        refundCount,
        refundTotal,
        refundErrors: refundErrors.length > 0 ? refundErrors : undefined
      }
    }
  } catch (err) {
    return { code: -1, message: '取消失败: ' + err.message }
  }
}

// 查询团期详情
async function getScheduleDetail({ id }) {
  try {
    const res = await db.collection('schedules').doc(id).get()
    return { code: 0, data: res.data }
  } catch (err) {
    return { code: -1, message: '团期不存在' }
  }
}

// 查询变更记录
async function getChangelog({ scheduleId, activityId }, openid) {
  if (!await isAdmin(openid)) {
    return { code: -1, message: '无权限' }
  }

  try {
    let query = {}
    if (scheduleId) query.scheduleId = scheduleId
    if (activityId) query.activityId = activityId

    const res = await db.collection('schedule_changelogs')
      .where(query)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    return { code: 0, data: res.data }
  } catch (err) {
    return { code: -1, message: '查询失败: ' + err.message }
  }
}

// 通知已报名用户（微信订阅消息）
async function notifyBookedUsers(scheduleId, changeType, changes) {
  try {
    // 获取团期信息
    const scheduleRes = await db.collection('schedules').doc(scheduleId).get()
    const schedule = scheduleRes.data

    // 获取该团期所有已支付订单
    const ordersRes = await db.collection('orders')
      .where({
        scheduleId,
        status: 'paid'
      })
      .get()

    if (ordersRes.data.length === 0) return

    // 去重 openid
    const openidSet = new Set(ordersRes.data.map(o => o.openid))

    // 获取用户订阅授权状态
    const openids = Array.from(openidSet)
    const subscribersRes = await db.collection('subscriptions')
      .where({
        openid: _.in(openids),
        status: 'authorized'
      })
      .get()

    const authorizedOpenids = new Set(subscribersRes.data.map(s => s.openid))

    // 构建通知内容
    let templateId = ''
    let data = {}

    if (changeType === 'cancel') {
      templateId = process.env.TEMPLATE_SCHEDULE_CANCEL || ''
      data = {
        thing1: { value: schedule.activityName || '活动' },    // 活动名称
        date2: { value: schedule.date || '' },                   // 原定日期
        thing3: { value: changes[0] || '团期取消' },             // 取消原因
        amount4: { value: '已自动退款' }                          // 退款说明
      }
    } else {
      templateId = process.env.TEMPLATE_SCHEDULE_CHANGE || ''
      data = {
        thing1: { value: schedule.activityName || '活动' },    // 活动名称
        date2: { value: schedule.date || '' },                   // 团期日期
        thing3: { value: changes.join('；') }                    // 变更内容
      }
    }

    if (!templateId) {
      console.log('未配置订阅消息模板 ID，跳过通知')
      return
    }

    // 发送消息
    let sendCount = 0
    for (const openid of authorizedOpenids) {
      try {
        await cloud.openapi.subscribeMessage.send({
          touser: openid,
          templateId,
          data,
          page: `/pages/orders/orders`
        })
        sendCount++
      } catch (sendErr) {
        console.error(`发送通知给 ${openid} 失败:`, sendErr)
      }
    }

    console.log(`通知发送完成: ${sendCount}/${authorizedOpenids.size} 成功`)
  } catch (err) {
    console.error('通知流程失败:', err)
  }
}

// 检查是否是管理员
async function isAdmin(openid) {
  const res = await db.collection('admins').where({ openid }).get()
  return res.data.length > 0
}
