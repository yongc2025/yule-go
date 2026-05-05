import request from './index'

/**
 * 订单 API
 */
export const orderApi = {
  /**
   * 创建订单
   */
  create(data) {
    return request({ url: '/orders', method: 'POST', data })
  },

  /**
   * 查询订单列表
   */
  list(params) {
    return request({ url: '/orders', data: params })
  },

  /**
   * 查询订单详情
   */
  detail(orderNo) {
    return request({ url: `/orders/${orderNo}` })
  },

  /**
   * 取消订单
   */
  cancel(orderNo, reason) {
    return request({ url: `/orders/${orderNo}/cancel`, method: 'POST', data: { reason } })
  }
}

/**
 * 租赁项 API
 */
export const rentalApi = {
  /**
   * 获取可租赁装备列表
   */
  list() {
    return request({ url: '/rental-items' })
  }
}

/**
 * 线路 API
 */
export const routeApi = {
  /**
   * 获取线路列表
   */
  list() {
    return request({ url: '/routes' })
  },

  /**
   * 获取线路详情
   */
  detail(id) {
    return request({ url: `/routes/${id}` })
  }
}
