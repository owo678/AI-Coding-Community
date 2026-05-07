<template>
  <div class="user-settings">
    <el-row :gutter="20">
      <el-col :span="12" :offset="6">
        <el-card>
          <template #header>
            <h2>个人设置</h2>
          </template>

          <!-- 头像上传 -->
          <div class="avatar-section" style="text-align: center; margin-bottom: 24px">
            <el-avatar
              :size="100"
              :src="form.avatar || authStore.user?.avatar"
            >
              {{ authStore.user?.username?.[0] }}
            </el-avatar>
            <div style="margin-top: 12px">
              <el-upload
                :show-file-list="false"
                :before-upload="beforeUpload"
                :http-request="uploadAvatar"
                accept="image/*"
              >
                <el-button type="primary" size="small" :loading="uploadLoading">
                  更换头像
                </el-button>
              </el-upload>
              <p style="font-size: 12px; color: #909399; margin-top: 4px">
                支持 JPG/PNG/GIF/WebP，不超过 2MB
              </p>
            </div>
          </div>

          <!-- 资料编辑表单 -->
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            @submit.prevent="handleSave"
          >
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="2-20 个字符" />
            </el-form-item>
            <el-form-item label="个人简介" prop="bio">
              <el-input
                v-model="form.bio"
                type="textarea"
                :rows="3"
                placeholder="介绍一下自己"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" native-type="submit" :loading="saving">
                保存修改
              </el-button>
              <el-button @click="$router.push(`/user/${authStore.user?._id}`)">
                取消
              </el-button>
            </el-form-item>
          </el-form>

          <el-alert
            v-if="successMsg"
            :title="successMsg"
            type="success"
            show-icon
            closable
            @close="successMsg = ''"
            style="margin-bottom: 12px"
          />
          <el-alert
            v-if="errorMsg"
            :title="errorMsg"
            type="error"
            show-icon
            closable
            @close="errorMsg = ''"
            style="margin-bottom: 12px"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { userAPI, uploadAPI } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref(null)
const saving = ref(false)
const uploadLoading = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const form = reactive({
  username: '',
  bio: '',
  avatar: ''
})

const rules = {
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名需要 2-20 个字符', trigger: 'blur' }
  ]
}

onMounted(() => {
  if (authStore.user) {
    form.username = authStore.user.username || ''
    form.bio = authStore.user.bio || ''
    form.avatar = authStore.user.avatar || ''
  }
})

function beforeUpload(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const isImage = allowed.includes(file.type)
  if (!isImage) {
    ElMessage.error('只允许上传 JPG/PNG/GIF/WebP 格式')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('文件大小不能超过 2MB')
    return false
  }
  return true
}

async function uploadAvatar({ file }) {
  uploadLoading.value = true
  try {
    const res = await uploadAPI.uploadAvatar(file)
    form.avatar = res.avatar
    // 同步更新 store 中的用户信息
    await authStore.fetchUser()
    ElMessage.success('头像已更新')
  } catch (err) {
    ElMessage.error(err.message || '上传失败')
  } finally {
    uploadLoading.value = false
  }
}

async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const res = await userAPI.updateProfile({
      username: form.username,
      bio: form.bio
    })
    authStore.user = res.user
    localStorage.setItem('user', JSON.stringify(res.user))
    successMsg.value = '保存成功'
  } catch (err) {
    errorMsg.value = err.message || '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.user-settings {
  padding: 40px 0;
}
@media (max-width: 768px) {
  .user-settings {
    padding: 12px 0;
  }
  .user-settings .el-col-12 {
    max-width: 100%;
    flex: 0 0 100%;
  }
  .user-settings .el-col-offset-6 {
    margin-left: 0;
  }
}
</style>
