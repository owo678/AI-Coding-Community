<template>
  <div id="app">
    <!-- 临时导航栏 —— 用于阶段二测试，阶段五将替换为正式布局 -->
    <el-menu
      mode="horizontal"
      :router="true"
      style="margin-bottom: 20px"
    >
      <el-menu-item index="/">首页</el-menu-item>
      <template v-if="!authStore.isLoggedIn">
        <el-menu-item index="/login" style="margin-left: auto">登录</el-menu-item>
        <el-menu-item index="/register">注册</el-menu-item>
      </template>
      <template v-else>
        <el-menu-item
          :index="`/user/${authStore.user?._id}`"
          style="margin-left: auto"
        >
          {{ authStore.user?.username }}
        </el-menu-item>
        <el-menu-item index="/settings">设置</el-menu-item>
        <el-menu-item index="/post/create">发帖</el-menu-item>
        <el-menu-item @click="handleLogout">退出</el-menu-item>
      </template>
    </el-menu>
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>
