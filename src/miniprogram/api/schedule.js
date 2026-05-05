import request from './index'

/**
 * 团期 API
 */
export const scheduleApi = {
  /**
   * 按周查询团期列表
   * @param {string} week - 格式: 2026-W18
   */
  listByWeek(week) {
    return request({ url: '/schedules', data: { week } })
  }
}
