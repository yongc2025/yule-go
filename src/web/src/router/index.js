import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/schedules',
    children: [
      {
        path: 'schedules',
        name: 'ScheduleList',
        component: () => import('../views/schedule/ScheduleList.vue'),
        meta: { title: '团期管理' }
      },
      {
        path: 'orders',
        name: 'OrderList',
        component: () => import('../views/Placeholder.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'customers',
        name: 'CustomerList',
        component: () => import('../views/Placeholder.vue'),
        meta: { title: '客户管理' }
      },
      {
        path: 'routes',
        name: 'RouteList',
        component: () => import('../views/Placeholder.vue'),
        meta: { title: '线路管理' }
      },
      {
        path: 'rentals',
        name: 'RentalList',
        component: () => import('../views/Placeholder.vue'),
        meta: { title: '装备管理' }
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('../views/Placeholder.vue'),
        meta: { title: '财务统计' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
