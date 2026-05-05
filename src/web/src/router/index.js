import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/LoginPage.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/DashboardHome.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'schedules',
        name: 'ScheduleList',
        component: () => import('../views/schedule/ScheduleList.vue'),
        meta: { title: '团期管理' }
      },
      {
        path: 'orders',
        name: 'OrderList',
        component: () => import('../views/order/OrderList.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'customers',
        name: 'CustomerList',
        component: () => import('../views/customer/CustomerList.vue'),
        meta: { title: '客户管理' }
      },
      {
        path: 'routes',
        name: 'RouteList',
        component: () => import('../views/route/RouteList.vue'),
        meta: { title: '线路管理' }
      },
      {
        path: 'rentals',
        name: 'RentalList',
        component: () => import('../views/rental/RentalList.vue'),
        meta: { title: '装备管理' }
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('../views/finance/FinancePage.vue'),
        meta: { title: '财务统计' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：未登录跳转登录页
router.beforeEach((to, from, next) => {
  if (to.path !== '/login' && !localStorage.getItem('admin_token')) {
    next('/login')
  } else {
    next()
  }
})

export default router
