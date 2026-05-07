<template>
  <div class="user-profile">
    <el-row :gutter="20">
      <!-- 左侧：用户信息卡片 -->
      <el-col :span="6">
        <el-card v-loading="loading">
          <div class="user-info">
            <el-avatar :size="80" :src="profile.user?.avatar">
              {{ profile.user?.username?.[0] }}
            </el-avatar>
            <h2>{{ profile.user?.username }}</h2>
            <p class="bio">{{ profile.user?.bio || '这个人很懒，什么都没写' }}</p>
            <el-divider />
            <div class="stats">
              <div class="stat-item">
                <span class="stat-num">{{ profile.postCount }}</span>
                <span class="stat-label">帖子</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">{{ profile.followersCount }}</span>
                <span class="stat-label">粉丝</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">{{ profile.followingCount }}</span>
                <span class="stat-label">关注</span>
              </div>
            </div>
            <!-- 关注按钮：已登录、非本人 -->
            <el-button
              v-if="authStore.isLoggedIn && authStore.user?._id !== userId"
              :type="isFollowing ? 'default' : 'primary'"
              :loading="followLoading"
              @click="handleFollow"
              style="width: 100%; margin-top: 12px"
            >
              {{ isFollowing ? '已关注' : '关注' }}
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：用户帖子列表 -->
      <el-col :span="18">
        <el-card>
          <template #header>
            <span>{{ profile.user?.username }} 的帖子</span>
          </template>
          <div v-if="posts.length === 0" class="empty-state">
            <el-empty description="暂无帖子" />
          </div>
          <div v-else class="post-list">
            <div
              v-for="post in posts"
              :key="post._id"
              class="post-item"
              @click="$router.push(`/post/${post._id}`)"
            >
              <h3>{{ post.title }}</h3>
              <div class="post-meta">
                <span>{{ formatDate(post.createdAt) }}</span>
                <el-tag
                  v-for="tag in post.tags"
                  :key="tag"
                  size="small"
                  style="margin-left: 6px"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
          <el-pagination
            v-if="total > limit"
            v-model:current-page="page"
            :page-size="limit"
            :total="total"
            layout="prev, pager, next"
            @current-change="fetchPosts"
            style="margin-top: 20px; justify-content: center"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userAPI } from '@/api'

const route = useRoute()
const authStore = useAuthStore()

const userId = computed(() => route.params.id)
const loading = ref(false)
const followLoading = ref(false)
const isFollowing = ref(false)

const page = ref(1)
const limit = 10
const total = ref(0)
const posts = ref([])

const profile = reactive({
  user: null,
  followersCount: 0,
  followingCount: 0,
  postCount: 0
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

async function fetchProfile() {
  loading.value = true
  try {
    const data = await userAPI.getProfile(userId.value)
    Object.assign(profile, data)
    // 检查当前用户是否已关注
    if (authStore.isLoggedIn && authStore.user?._id !== userId.value) {
      checkFollowStatus()
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
  } finally {
    loading.value = false
  }
}

async function checkFollowStatus() {
  // 通过查询关注列表判断是否已关注
  try {
    const { users } = await userAPI.getFollowing(authStore.user._id)
    isFollowing.value = users.some((u) => u._id === userId.value)
  } catch {
    // 忽略
  }
}

async function fetchPosts() {
  try {
    const data = await userAPI.getUserPosts(userId.value, {
      page: page.value,
      limit
    })
    posts.value = data.posts
    total.value = data.total
  } catch (err) {
    console.error('获取帖子失败:', err)
  }
}

async function handleFollow() {
  followLoading.value = true
  try {
    const res = await userAPI.toggleFollow(userId.value)
    isFollowing.value = res.following
    // 更新粉丝数
    if (res.following) {
      profile.followersCount++
    } else {
      profile.followersCount--
    }
  } catch (err) {
    console.error('操作失败:', err)
  } finally {
    followLoading.value = false
  }
}

watch(userId, () => {
  fetchProfile()
  fetchPosts()
}, { immediate: true })
</script>

<style scoped>
.user-info {
  text-align: center;
}
.user-info h2 {
  margin: 12px 0 8px;
}
.bio {
  color: #909399;
  font-size: 14px;
}
.stats {
  display: flex;
  justify-content: space-around;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-num {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}
.stat-label {
  font-size: 12px;
  color: #909399;
}
.post-item {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
}
.post-item:hover h3 {
  color: #409eff;
}
.post-item h3 {
  margin: 0 0 8px;
}
.post-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
}
.empty-state {
  padding: 40px;
}
</style>
