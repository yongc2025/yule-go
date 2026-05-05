/**
 * 日期工具函数
 */

/**
 * 获取当前日期是第几周（ISO 8601）
 * @param {Date} date
 * @returns {string} 格式: 2026-W18
 */
export function getWeekString(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // ISO 8601: 周四所在的周是当年第一周
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNo = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * 计算偏移周
 * @param {string} baseWeek - 基准周，格式: 2026-W18
 * @param {number} offset - 偏移量（正数向后，负数向前）
 * @returns {string}
 */
export function offsetWeek(baseWeek, offset) {
  const [yearStr, weekStr] = baseWeek.split('-W')
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)

  // 简化处理：直接加减周数
  let newWeek = week + offset
  let newYear = year

  if (newWeek < 1) {
    newYear -= 1
    newWeek += 52 // 近似
  } else if (newWeek > 52) {
    newYear += 1
    newWeek -= 52
  }

  return `${newYear}-W${String(newWeek).padStart(2, '0')}`
}

/**
 * 格式化日期为中文
 * @param {string} dateStr - 格式: 2026-05-10
 * @returns {string} 如: 5月10日 周六
 */
export function formatDateCN(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('T')[0].split('-')
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
}

/**
 * 格式化周标题
 * @param {string} week - 格式: 2026-W18
 * @returns {string} 如: 第18周 (5.4 - 5.10)
 */
export function formatWeekTitle(week) {
  const [yearStr, weekStr] = week.split('-W')
  const year = parseInt(yearStr)
  const weekNum = parseInt(weekStr)

  // 计算该周的周六日期
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dayOfWeek + 1)
  monday.setDate(monday.getDate() + (weekNum - 1) * 7)

  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d) => `${d.getMonth() + 1}.${d.getDate()}`
  return `第${weekNum}周 (${fmt(saturday)} - ${fmt(sunday)})`
}
