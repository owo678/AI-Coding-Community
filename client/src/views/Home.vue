<template>
  <div class="home-page">
    <el-card style="margin-top: 40px">
      <template #header>
        <h2 style="text-align: center">AI编程经验社区 —— 阶段二测试</h2>
      </template>
      <div style="text-align: center; padding: 20px">
        <p v-if="!authStore.isLoggedIn" style="font-size: 16px; color: #606266">
          请先
          <el-link type="primary" @click="$router.push('/register')">注册</el-link>
          或
          <el-link type="primary" @click="$router.push('/login')">登录</el-link>
        </p>
        <div v-else style="font-size: 16px; color: #606266">
          <p>欢迎回来，<strong>{{ authStore.user?.username }}</strong>！</p>
          <p>当前可测试的功能：</p>
          <el-space wrap style="margin-top: 16px">
            <el-button type="primary" @click="$router.push('/settings')">
              个人设置
            </el-button>
            <el-button @click="$router.push(`/user/${authStore.user?._id}`)">
              我的主页
            </el-button>
          </el-space>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
</script>
