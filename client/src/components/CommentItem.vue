<template>
  <div class="comment-item" :class="{ 'is-reply': isReply }">
    <div class="comment-header">
      <el-avatar :size="28" :src="comment.author?.avatar" style="cursor:pointer" @click="$router.push(`/user/${comment.author?._id}`)">
        {{ comment.author?.username?.[0] }}
      </el-avatar>
      <span class="comment-author" style="cursor:pointer" @click="$router.push(`/user/${comment.author?._id}`)">
        {{ comment.author?.username }}
      </span>
      <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
      <template v-if="authStore.user?._id === comment.author?._id">
        <el-popconfirm title="确定删除这条评论吗？" @confirm="$emit('delete', comment._id)">
          <template #reference>
            <el-button type="danger" link size="small">删除</el-button>
          </template>
        </el-popconfirm>
      </template>
      <el-button v-if="!isReply && authStore.isLoggedIn" type="primary" link size="small" @click="showReplyInput = !showReplyInput">
        回复
      </el-button>
    </div>
    <p class="comment-content" :class="{ 'reply-content': isReply }">{{ comment.content }}</p>

    <!-- 回复输入框 -->
    <div v-if="showReplyInput" class="reply-input-area">
      <el-input
        v-model="replyContent"
        size="small"
        placeholder="写下你的回复..."
        @keyup.enter="handleReply"
      />
      <el-button size="small" type="primary" :loading="replyLoading" @click="handleReply" style="margin-top:4px">
        发表回复
      </el-button>
    </div>

    <!-- 子回复列表 -->
    <div v-if="comment.replies?.length" class="replies">
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply._id"
        :comment="reply"
        :is-reply="true"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  comment: { type: Object, required: true },
  isReply: { type: Boolean, default: false }
})

const emit = defineEmits(['delete', 'reply'])

const authStore = useAuthStore()
const showReplyInput = ref(false)
const replyContent = ref('')
const replyLoading = ref(false)

function handleReply() {
  if (replyContent.value.trim()) {
    emit('reply', { parentId: props.comment._id, content: replyContent.value.trim() })
    replyContent.value = ''
    showReplyInput.value = false
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
.comment-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.comment-item:last-child {
  border-bottom: none;
}
.comment-item.is-reply {
  margin-left: 32px;
  border-bottom: none;
  padding: 6px 0;
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
  padding-left: 36px;
  line-height: 1.6;
}
.comment-content.reply-content {
  padding-left: 36px;
}
.reply-input-area {
  margin-top: 8px;
  padding-left: 36px;
}
.replies {
  margin-top: 4px;
}
</style>
