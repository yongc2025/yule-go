// 云函数：activities
// 功能：活动 CRUD（管理员创建/编辑，用户查询）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    case 'list':
      return await listActivities(data)
    case 'detail':
      return await getActivityDetail(data)
    case 'create':
      return await createActivity(data, openid)
    case 'update':
      return await updateActivity(data, openid)
    default:
      return { code: -1, message: '未知操作' }
  }
}

// 查询活动列表（按周）
async function listActivities({ weekStart, weekEnd, page = 1, pageSize = 20 }) {
  try {
    let query = db.collection('activities').where({
      status: 'active'
    })

    if (weekStart && weekEnd) {
      query = db.collection('activities').where({
        status: 'active',
        date: _.gte(weekStart).and(_.lte(weekEnd))
      })
    }

    const countRes = await query.count()
    const dataRes = await query
      .orderBy('date', 'asc')
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

// 活动详情
async function getActivityDetail({ id }) {
  try {
    const res = await db.collection('activities').doc(id).get()
    return { code: 0, data: res.data }
  } catch (err) {
    return { code: -1, message: '活动不存在' }
  }
}

// 创建活动（管理员）
async function createActivity(data, openid) {
  if (!await isAdmin(openid)) {
    return { code: -1, message: '无权限' }
  }

  try {
    const activity = {
      name: data.name,
      type: data.type, // fishing / camping / family / senior / wild_fishing
      price: data.price,
      childPrice: data.childPrice || 0,
      maxSlots: data.maxSlots || 20,
      bookedSlots: 0,
      coverImage: data.coverImage || '',
      images: data.images || [],
      highlights: data.highlights || [],
      itinerary: data.itinerary || [],
      includes: data.includes || [],
      excludes: data.excludes || [],
      notes: data.notes || '',
      merchantId: data.merchantId || '',
      status: 'active',
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }

    const res = await db.collection('activities').add({ data: activity })
    return { code: 0, data: { _id: res._id } }
  } catch (err) {
    return { code: -1, message: '创建失败: ' + err.message }
  }
}

// 更新活动（管理员）
async function updateActivity({ id, ...updates }, openid) {
  if (!await isAdmin(openid)) {
    return { code: -1, message: '无权限' }
  }

  try {
    updates.updatedAt = db.serverDate()
    await db.collection('activities').doc(id).update({ data: updates })
    return { code: 0, message: '更新成功' }
  } catch (err) {
    return { code: -1, message: '更新失败: ' + err.message }
  }
}

// 检查是否是管理员
async function isAdmin(openid) {
  const res = await db.collection('admins').where({ openid }).get()
  return res.data.length > 0
}
