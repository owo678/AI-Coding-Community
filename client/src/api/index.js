import http from './http'

// 后续各模块 API 函数在此定义并导出
export const authAPI = {
  register: (data) => http.post('/auth/register', data),
  login: (data) => http.post('/auth/login', data),
  getMe: () => http.get('/auth/me')
}

export const postAPI = {
  getList: (params) => http.get('/posts', { params }),
  getDetail: (id) => http.get(`/posts/${id}`),
  create: (data) => http.post('/posts', data),
  update: (id, data) => http.put(`/posts/${id}`, data),
  delete: (id) => http.delete(`/posts/${id}`),
  toggleLike: (id) => http.post(`/posts/${id}/like`),
  toggleCollect: (id) => http.post(`/posts/${id}/collect`)
}

export const commentAPI = {
  getList: (postId, params) => http.get(`/posts/${postId}/comments`, { params }),
  create: (postId, data) => http.post(`/posts/${postId}/comments`, data),
  delete: (id) => http.delete(`/comments/${id}`)
}

export const userAPI = {
  getProfile: (id) => http.get(`/users/${id}`),
  updateProfile: (data) => http.put('/users/profile', data),
  toggleFollow: (id) => http.post(`/users/${id}/follow`),
  getFollowers: (id) => http.get(`/users/${id}/followers`),
  getFollowing: (id) => http.get(`/users/${id}/following`),
  getUserPosts: (id, params) => http.get(`/users/${id}/posts`, { params })
}

export const uploadAPI = {
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}
