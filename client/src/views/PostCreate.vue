<template>
  <div class="post-form-page">
    <el-card shadow="never" class="form-card">
      <template #header>
        <h2 style="margin:0;font-size:18px">发布新帖子</h2>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入标题（最多100字）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <div class="tag-input-area">
            <el-tag
              v-for="tag in form.tags"
              :key="tag"
              closable
              size="small"
              @close="removeTag(tag)"
              style="margin-right:6px;margin-bottom:4px"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="showTagInput"
              ref="tagInputRef"
              v-model="tagInput"
              size="small"
              style="width:100px"
              placeholder="输入标签"
              @keyup.enter="addTag"
              @blur="addTag"
            />
            <el-button
              v-else
              size="small"
              @click="showTagInput = true"
            >
              + 添加标签
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="12"
            placeholder="分享你的AI编程经验..."
          />
        </el-form-item>

        <el-form-item>
          <div class="form-actions">
            <el-button @click="$router.push('/')">取消</el-button>
            <el-button type="primary" native-type="submit" :loading="submitting">
              发布
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { postAPI } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref(null)
const tagInputRef = ref(null)
const submitting = ref(false)
const tagInput = ref('')
const showTagInput = ref(false)

const form = reactive({
  title: '',
  content: '',
  tags: []
})

const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { max: 100, message: '标题最多100个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' }
  ]
}

function addTag() {
  const val = tagInput.value.trim()
  if (val && !form.tags.includes(val)) {
    form.tags.push(val)
  }
  tagInput.value = ''
  showTagInput.value = false
}

function removeTag(tag) {
  form.tags = form.tags.filter((t) => t !== tag)
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const res = await postAPI.create({
      title: form.title.trim(),
      content: form.content.trim(),
      tags: form.tags
    })
    ElMessage.success('发布成功')
    router.push(`/post/${res.post._id}`)
  } catch (e) {
    ElMessage.error(e.message || '发布失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.post-form-page {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  padding-left: 16px;
  padding-right: 16px;
}
.form-card {
  width: 100%;
  max-width: 600px;
}
@media (max-width: 768px) {
  .post-form-page {
    padding-top: 8px;
    padding-left: 8px;
    padding-right: 8px;
  }
  .form-actions {
    flex-direction: column;
  }
  .form-actions .el-button {
    width: 100%;
    margin-left: 0;
  }
}
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  width: 100%;
}
.tag-input-area {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
