<template>
  <el-container class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo" @click="isCollapse = !isCollapse">
        <img src="/logo-miniprogram-120.png" alt="渔乐" class="logo-img" />
        <span v-show="!isCollapse" class="logo-text">渔乐管理后台</span>
      </div>
      <el-menu
        :default-active="$route.path"
        :collapse="isCollapse"
        router
        background-color="#001529"
        text-color="#ffffffb3"
        active-text-color="#409eff"
        class="sidebar-menu"
      >
        <el-menu-item index="/schedules">
          <el-icon><Calendar /></el-icon>
          <template #title>团期管理</template>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>
        <el-menu-item index="/customers">
          <el-icon><User /></el-icon>
          <template #title>客户管理</template>
        </el-menu-item>
        <el-menu-item index="/routes">
          <el-icon><MapLocation /></el-icon>
          <template #title>线路管理</template>
        </el-menu-item>
        <el-menu-item index="/rentals">
          <el-icon><Box /></el-icon>
          <template #title>装备管理</template>
        </el-menu-item>
        <el-menu-item index="/finance">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>财务统计</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <span class="admin-name">管理员</span>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'

const isCollapse = ref(false)
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px solid #ffffff1a;
}

.logo-img {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  margin-left: 10px;
  white-space: nowrap;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8e8e8;
  background: #fff;
}

.header-left {
  display: flex;
  align-items: center;
}

.admin-name {
  color: #666;
  font-size: 14px;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
