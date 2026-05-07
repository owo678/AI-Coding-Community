<template>
  <div class="post-detail-page">
    <div class="detail-layout">
      <!-- 左侧：帖子内容 + 评论 -->
      <div class="main-content">
        <!-- 帖子主体 -->
        <el-card shadow="never" v-loading="loading">
          <h1 class="post-title">{{ post.title }}</h1>

          <div class="post-meta">
            <el-avatar :size="24" :src="post.author?.avatar">
              {{ post.author?.username?.[0] }}
            </el-avatar>
            <el-link type="primary" @click="$router.push(`/user/${post.author?._id}`)">
              {{ post.author?.username }}
            </el-link>
            <span class="meta-text">{{ formatTime(post.createdAt) }}</span>
            <span class="meta-text">浏览 {{ post.viewCount || 0 }}</span>
          </div>

          <div class="post-tags" v-if="post.tags?.length">
            <el-tag v-for="tag in post.tags" :key="tag" size="small" type="info">
              {{ tag }}
            </el-tag>
          </div>

          <div class="post-content">{{ post.content }}</div>

          <div class="post-actions">
            <el-button
              :type="post.liked ? 'primary' : 'default'"
              :icon="Star"
              size="small"
              @click="handleLike"
              :disabled="!authStore.isLoggedIn"
            >
              {{ post.liked ? '已赞' : '点赞' }} {{ post.likeCount || 0 }}
            </el-button>
            <el-button
              :type="post.collected ? 'warning' : 'default'"
              :icon="Collection"
              size="small"
              @click="handleCollect"
              :disabled="!authStore.isLoggedIn"
            >
              {{ post.collected ? '已收藏' : '收藏' }} {{ post.collectCount || 0 }}
            </el-button>
            <template v-if="isAuthor">
              <el-button size="small" @click="$router.push(`/post/${post._id}/edit`)">
                编辑
              </el-button>
              <el-popconfirm title="确定删除这个帖子吗？" @confirm="handleDelete">
                <template #reference>
                  <el-button type="danger" size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </div>
        </el-card>

        <!-- 评论区 -->
        <el-card shadow="never" style="margin-top: 16px">
          <template #header>
            <span style="font-weight:600">评论 ({{ post.commentCount || 0 }})</span>
          </template>
          <div v-if="comments.length > 0">
            <div v-for="c in comments" :key="c._id" class="comment-item">
              <div class="comment-header">
                <el-avatar :size="24" :src="c.author?.avatar">
                  {{ c.author?.username?.[0] }}
                </el-avatar>
                <span class="comment-author">{{ c.author?.username }}</span>
                <span class="comment-time">{{ formatTime(c.createdAt) }}</span>
              </div>
              <p class="comment-content">{{ c.content }}</p>
            </div>
          </div>
          <el-empty v-else description="暂无评论，来发表第一条评论吧" :image-size="60" />
        </el-card>
      </div>

      <!-- 右侧：作者信息 -->
      <div class="side-bar">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">关于作者</span></template>
          <div class="author-card">
            <el-avatar :size="56" :src="post.author?.avatar" @click="$router.push(`/user/${post.author?._id}`)" style="cursor:pointer">
              {{ post.author?.username?.[0] }}
            </el-avatar>
            <div class="author-name">{{ post.author?.username }}</div>
            <div class="author-bio" v-if="post.author?.bio">{{ post.author?.bio }}</div>
            <el-button
              size="small"
              style="width:100%;margin-top:8px"
              type="primary"
              plain
              @click="$router.push(`/user/${post.author?._id}`)"
            >
              查看主页
            </el-button>
          </div>
        </el-card>

        <el-card shadow="never" style="margin-top:12px">
          <template #header><span style="font-weight:600">互动</span></template>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-num">{{ post.likeCount || 0 }}</div>
              <div class="stat-label">点赞</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">{{ post.collectCount || 0 }}</div>
              <div class="stat-label">收藏</div>
            </div>
            <div class="stat-box">
              <div class="stat-num">{{ post.commentCount || 0 }}</div>
              <div class="stat-label">评论</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Star, Collection } from '@element-plus/icons-vue'
import { postAPI, commentAPI } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const post = ref({ author: {}, tags: [] })
const comments = ref([])
const loading = ref(false)

const isAuthor = computed(() => {
  return authStore.user?._id === post.value.author?._id
})

onMounted(() => fetchPost())
watch(() => route.params.id, () => fetchPost())

async function fetchPost() {
  loading.value = true
  try {
    const postRes = await postAPI.getDetail(route.params.id)
    post.value = postRes.post
  } catch (e) {
    ElMessage.error('帖子不存在或已被删除')
    router.push('/')
    return
  } finally {
    loading.value = false
  }

  // 评论独立加载，失败不影响帖子展示
  try {
    const commentRes = await commentAPI.getList(route.params.id)
    comments.value = commentRes.comments || []
  } catch (e) {
    // 评论接口阶段4实现，暂静默降级
    comments.value = []
  }
}

async function handleLike() {
  try {
    const res = await postAPI.toggleLike(post.value._id)
    post.value.liked = res.liked
    post.value.likeCount += res.liked ? 1 : -1
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function handleCollect() {
  try {
    const res = await postAPI.toggleCollect(post.value._id)
    post.value.collected = res.collected
    post.value.collectCount += res.collected ? 1 : -1
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

async function handleDelete() {
  try {
    await postAPI.delete(post.value._id)
    ElMessage.success('帖子已删除')
    router.push('/')
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

function formatTime(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.post-detail-page {
  padding-top: 20px;
}
.detail-layout {
  display: flex;
  gap: 20px;
}
.main-content {
  flex: 1;
  min-width: 0;
}
.side-bar {
  width: 240px;
  flex-shrink: 0;
}
.post-title {
  margin: 0 0 12px;
  font-size: 22px;
}
.post-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.meta-text {
  font-size: 13px;
  color: #909399;
}
.post-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}
.post-content {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 20px;
}
.post-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
/* 作者卡片 */
.author-card {
  text-align: center;
}
.author-name {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 600;
}
.author-bio {
  margin-top: 4px;
  font-size: 13px;
  color: #909399;
}
/* 互动统计 */
.stats-grid {
  display: flex;
  justify-content: space-around;
  text-align: center;
}
.stat-box {
  padding: 4px;
}
.stat-num {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.stat-label {
  font-size: 12px;
  color: #909399;
}
/* 评论 */
.comment-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.comment-item:last-child {
  border-bottom: none;
}
.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.comment-author {
  font-size: 13px;
  font-weight: 500;
}
.comment-time {
  font-size: 12px;
  color: #c0c4cc;
  margin-left: auto;
}
.comment-content {
  margin: 0;
  font-size: 14px;
  color: #303133;
  padding-left: 32px;
}

@media (max-width: 768px) {
  .detail-layout {
    flex-direction: column;
  }
  .side-bar {
    width: 100%;
  }
}
</style>
