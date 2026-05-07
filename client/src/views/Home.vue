<template>
  <div class="home-page">
    <div class="home-layout">
      <!-- 左侧：帖子流 -->
      <div class="main-content">
        <!-- 排序 + 搜索栏 -->
        <div class="toolbar">
          <el-radio-group v-model="sort" size="small" @change="fetchPosts">
            <el-radio-button value="latest">最新</el-radio-button>
            <el-radio-button value="hot">热门</el-radio-button>
          </el-radio-group>
          <el-input
            v-model="searchQuery"
            placeholder="搜索帖子..."
            clearable
            size="small"
            style="width: 220px"
            @clear="fetchPosts"
            @keyup.enter="fetchPosts"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- 帖子列表 -->
        <div v-loading="loading" element-loading-text="加载中...">
          <template v-if="posts.length > 0">
            <PostCard
              v-for="post in posts"
              :key="post._id"
              :post="post"
              @tag-click="handleTagClick"
            />
            <!-- 分页 -->
            <div class="pagination-wrapper" v-if="total > limit">
              <el-pagination
                background
                layout="prev, pager, next"
                :total="total"
                :page-size="limit"
                v-model:current-page="page"
                @current-change="fetchPosts"
              />
            </div>
          </template>
          <el-empty v-else description="暂无帖子" />
        </div>
      </div>

      <!-- 右侧：标签 + 热门 -->
      <div class="side-bar">
        <el-card shadow="never">
          <template #header><span style="font-weight:600">热门标签</span></template>
          <div class="tag-cloud">
            <template v-if="tags.length > 0">
              <el-tag
                v-for="tag in tags"
                :key="tag"
                :type="activeTag === tag ? 'primary' : 'info'"
                :effect="activeTag === tag ? 'dark' : 'plain'"
                size="small"
                style="cursor:pointer;margin:3px"
                @click="handleTagClick(tag)"
              >
                {{ tag }}
                <span v-if="activeTag === tag" style="margin-left:2px">✕</span>
              </el-tag>
            </template>
            <span v-else style="color:#999;font-size:13px">暂无标签</span>
          </div>
        </el-card>

        <el-card shadow="never" style="margin-top:12px">
          <template #header><span style="font-weight:600">热门帖子</span></template>
          <div v-if="hotPosts.length > 0">
            <div
              v-for="post in hotPosts"
              :key="post._id"
              class="hot-item"
              @click="$router.push(`/post/${post._id}`)"
            >
              {{ post.title }}
              <span style="color:#c0c4cc;font-size:12px">👍 {{ post.likeCount || 0 }}</span>
            </div>
          </div>
          <span v-else style="color:#999;font-size:13px">暂无数据</span>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { postAPI } from '@/api'
import PostCard from '@/components/PostCard.vue'

const posts = ref([])
const hotPosts = ref([])
const tags = ref([])
const loading = ref(false)
const sort = ref('latest')
const searchQuery = ref('')
const activeTag = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)

onMounted(() => {
  fetchPosts()
  fetchHotPosts()
  fetchTags()
})

async function fetchPosts() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value, sort: sort.value }
    if (searchQuery.value) params.search = searchQuery.value
    if (activeTag.value) params.tag = activeTag.value

    const res = await postAPI.getList(params)
    posts.value = res.posts
    total.value = res.total
  } catch (e) {
    console.error('获取帖子列表失败', e)
  } finally {
    loading.value = false
  }
}

async function fetchHotPosts() {
  try {
    const res = await postAPI.getList({ sort: 'hot', limit: 5 })
    hotPosts.value = res.posts
  } catch (e) {
    // 静默失败
  }
}

async function fetchTags() {
  try {
    const res = await postAPI.getList({ limit: 50 })
    const tagSet = new Set()
    res.posts.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)))
    tags.value = [...tagSet].slice(0, 15)
  } catch (e) {
    // 静默失败
  }
}

function handleTagClick(tag) {
  if (activeTag.value === tag) {
    activeTag.value = ''
  } else {
    activeTag.value = tag
  }
  page.value = 1
  fetchPosts()
}
</script>

<style scoped>
.home-page {
  padding-top: 20px;
}
.home-layout {
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
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}
.tag-cloud {
  line-height: 2;
}
.hot-item {
  padding: 6px 0;
  font-size: 13px;
  cursor: pointer;
  color: #303133;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hot-item:last-child {
  border-bottom: none;
}
.hot-item:hover {
  color: #409eff;
}
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
@media (max-width: 768px) {
  .home-layout {
    flex-direction: column;
  }
  .side-bar {
    width: 100%;
  }
}
</style>
