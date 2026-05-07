<template>
  <el-card class="post-card" shadow="hover" @click="$router.push(`/post/${post._id}`)">
    <div class="post-card-header">
      <div class="author-info">
        <el-avatar :size="32" :src="post.author?.avatar" @click.stop="$router.push(`/user/${post.author?._id}`)">
          {{ post.author?.username?.[0] }}
        </el-avatar>
        <div class="author-meta">
          <el-link type="primary" @click.stop="$router.push(`/user/${post.author?._id}`)">
            {{ post.author?.username }}
          </el-link>
          <span class="post-time">{{ formatTime(post.createdAt) }}</span>
        </div>
      </div>
    </div>

    <h3 class="post-title">{{ post.title }}</h3>
    <p class="post-excerpt">{{ excerpt }}</p>

    <div class="post-card-footer">
      <div class="post-tags">
        <el-tag
          v-for="tag in post.tags"
          :key="tag"
          size="small"
          type="info"
          @click.stop="$emit('tag-click', tag)"
        >
          {{ tag }}
        </el-tag>
      </div>
      <div class="post-stats">
        <span class="stat-item">
          <el-icon><View /></el-icon> {{ post.viewCount || 0 }}
        </span>
        <span class="stat-item">
          <el-icon><Star /></el-icon> {{ post.likeCount || 0 }}
        </span>
        <span class="stat-item">
          <el-icon><ChatDotRound /></el-icon> {{ post.commentCount || 0 }}
        </span>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { View, Star, ChatDotRound } from '@element-plus/icons-vue'

const props = defineProps({
  post: { type: Object, required: true }
})

defineEmits(['tag-click'])

const excerpt = computed(() => {
  const text = props.post.content || ''
  return text.length > 120 ? text.slice(0, 120) + '...' : text
})

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
.post-card {
  margin-bottom: 12px;
  cursor: pointer;
  transition: transform 0.1s;
}
.post-card:hover {
  transform: translateY(-1px);
}
.post-card-header {
  margin-bottom: 8px;
}
.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.author-meta {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #909399;
}
.post-title {
  margin: 0 0 8px;
  font-size: 17px;
  color: #303133;
}
.post-excerpt {
  margin: 0 0 12px;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}
.post-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.post-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.post-stats {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #909399;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
