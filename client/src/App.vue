<template>
  <div id="app">
    <el-menu
      mode="horizontal"
      :router="true"
      class="app-nav"
      :ellipsis="false"
    >
      <el-menu-item index="/">首页</el-menu-item>
      <template v-if="!authStore.isLoggedIn">
        <div class="nav-right">
          <el-menu-item index="/login">登录</el-menu-item>
          <el-menu-item index="/register">注册</el-menu-item>
        </div>
      </template>
      <template v-else>
        <div class="nav-right">
          <el-menu-item index="/post/create">发帖</el-menu-item>
          <el-menu-item
            :index="`/user/${authStore.user?._id}`"
          >
            {{ authStore.user?.username }}
          </el-menu-item>
          <el-menu-item index="/settings">设置</el-menu-item>
          <el-menu-item @click="handleLogout">退出</el-menu-item>
        </div>
      </template>
    </el-menu>
    <div class="page-container">
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

<style>
.app-nav {
  display: flex;
  flex-wrap: wrap;
}
.app-nav .nav-right {
  display: flex;
  margin-left: auto;
}
@media (max-width: 768px) {
  .app-nav {
    font-size: 13px;
  }
  .app-nav .el-menu-item {
    padding: 0 10px;
  }
}
</style>
