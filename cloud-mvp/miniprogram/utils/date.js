/**
 * 日期工具
 */

// 格式化日期：2026-05-10 → 5月10日 周六
function formatDate(dateStr) {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const weekDay = weekDays[d.getDay()]
  return `${month}月${day}日 周${weekDay}`
}

// 格式化日期时间
function formatDateTime(dateStr) {
  const d = new Date(dateStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

// 获取本周的起止日期（周一~周日）
function getWeekRange(offset = 0) {
  const now = new Date()
  const day = now.getDay() || 7 // 周日为 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1 + offset * 7)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return {
    start: monday,
    end: sunday,
    label: offset === 0 ? '本周' : offset === 1 ? '下周' : offset === -1 ? '上周' : `第${getWeekNumber(monday)}周`
  }
}

// 获取 ISO 周数
function getWeekNumber(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}

// 判断是否是今天或未来
function isFuture(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d >= today
}

module.exports = {
  formatDate,
  formatDateTime,
  getWeekRange,
  getWeekNumber,
  isFuture
}
