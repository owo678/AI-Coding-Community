// 帖子接口集成测试
// 运行方式：node --test tests/post.test.js

process.env.NODE_ENV = 'test'

import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../index.js'

let server

before(async () => {
  server = app.listen(0)
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-coding-test')
  }
})

after(async () => {
  server.close()
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close()
  }
})

beforeEach(async () => {
  const db = mongoose.connection.db
  const collections = await db.listCollections().toArray()
  for (const { name } of collections) {
    await db.collection(name).deleteMany({})
  }
})

// 辅助函数：注册并获取 token
async function registerUser(username, email) {
  const res = await request(server)
    .post('/api/v1/auth/register')
    .send({ username, email, password: '123456' })
  return { token: res.body.token, userId: res.body.user._id }
}

// 辅助函数：创建帖子
async function createPost(token, data = {}) {
  const res = await request(server)
    .post('/api/v1/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: data.title || '测试帖子标题',
      content: data.content || '测试帖子内容',
      tags: data.tags || ['test']
    })
  return res
}

describe('POST /api/v1/posts', () => {
  let token

  beforeEach(async () => {
    const user = await registerUser('poster', 'poster@test.com')
    token = user.token
  })

  it('创建帖子成功返回 201', async () => {
    const res = await createPost(token)
    assert.strictEqual(res.status, 201)
    assert.ok(res.body.post._id)
    assert.strictEqual(res.body.post.title, '测试帖子标题')
    assert.strictEqual(res.body.post.author.username, 'poster')
  })

  it('未登录时返回 401', async () => {
    const res = await request(server)
      .post('/api/v1/posts')
      .send({ title: 'x', content: 'y' })

    assert.strictEqual(res.status, 401)
  })

  it('标题为空返回 400', async () => {
    const res = await request(server)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '', content: 'y' })

    assert.strictEqual(res.status, 400)
  })

  it('内容为空返回 400', async () => {
    const res = await request(server)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x', content: '' })

    assert.strictEqual(res.status, 400)
  })

  it('标签为空数组时创建成功', async () => {
    const res = await createPost(token, { tags: [] })
    assert.strictEqual(res.status, 201)
  })
})

describe('GET /api/v1/posts', () => {
  let token

  beforeEach(async () => {
    const user = await registerUser('lister', 'lister@test.com')
    token = user.token
    // 创建多条帖子
    await createPost(token, { title: 'Vue 教程', content: 'Vue3 入门指南', tags: ['Vue', '前端'] })
    await createPost(token, { title: 'Node 教程', content: 'Express 实战', tags: ['Node', '后端'] })
    await createPost(token, { title: 'MongoDB 教程', content: '聚合管道详解', tags: ['MongoDB'] })
    await createPost(token, { title: 'AI 编程', content: 'Copilot 使用技巧', tags: ['AI'] })
  })

  it('返回帖子列表和分页信息', async () => {
    const res = await request(server).get('/api/v1/posts')

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.posts.length, 4)
    assert.strictEqual(res.body.total, 4)
    assert.strictEqual(res.body.page, 1)
    assert.strictEqual(res.body.limit, 10)
  })

  it('支持标签筛选', async () => {
    const res = await request(server).get('/api/v1/posts?tag=Vue')

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.total, 1)
    assert.strictEqual(res.body.posts[0].title, 'Vue 教程')
  })

  it('支持文本搜索', async () => {
    const res = await request(server).get('/api/v1/posts?search=MongoDB')

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.total, 1)
  })

  it('支持分页', async () => {
    const res = await request(server).get('/api/v1/posts?page=1&limit=2')

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.posts.length, 2)
    assert.strictEqual(res.body.total, 4)
  })

  it('帖子包含点赞数和评论数', async () => {
    const res = await request(server).get('/api/v1/posts')

    assert.strictEqual(res.status, 200)
    assert.ok(res.body.posts.length > 0)
    assert.strictEqual(typeof res.body.posts[0].likeCount, 'number')
    assert.strictEqual(typeof res.body.posts[0].commentCount, 'number')
  })
})

describe('GET /api/v1/posts/:id', () => {
  let token, postId

  beforeEach(async () => {
    const user = await registerUser('detailer', 'detailer@test.com')
    token = user.token
    const res = await createPost(token)
    postId = res.body.post._id
  })

  it('返回帖子详情包含统计', async () => {
    const res = await request(server).get(`/api/v1/posts/${postId}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.post._id, postId)
    assert.strictEqual(typeof res.body.post.likeCount, 'number')
    assert.strictEqual(typeof res.body.post.commentCount, 'number')
    assert.strictEqual(typeof res.body.post.collectCount, 'number')
    assert.strictEqual(res.body.post.liked, false)
    assert.strictEqual(res.body.post.collected, false)
  })

  it('浏览计数加 1', async () => {
    await request(server).get(`/api/v1/posts/${postId}`)
    const res = await request(server).get(`/api/v1/posts/${postId}`)

    assert.strictEqual(res.body.post.viewCount, 2)
  })

  it('不存在的帖子返回 404', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(server).get(`/api/v1/posts/${fakeId}`)

    assert.strictEqual(res.status, 404)
  })

  it('登录用户可获取点赞/收藏状态', async () => {
    const res = await request(server)
      .get(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.post.liked, false)
    assert.strictEqual(res.body.post.collected, false)
  })
})

describe('PUT /api/v1/posts/:id', () => {
  let token1, token2, postId

  beforeEach(async () => {
    const u1 = await registerUser('editor', 'editor@test.com')
    token1 = u1.token
    const u2 = await registerUser('other', 'other@test.com')
    token2 = u2.token
    const res = await createPost(token1)
    postId = res.body.post._id
  })

  it('作者可以更新帖子', async () => {
    const res = await request(server)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: '更新后的标题', content: '更新后的内容' })

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.post.title, '更新后的标题')
    assert.strictEqual(res.body.post.content, '更新后的内容')
  })

  it('非作者更新返回 403', async () => {
    const res = await request(server)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'hacked' })

    assert.strictEqual(res.status, 403)
  })

  it('未登录时返回 401', async () => {
    const res = await request(server)
      .put(`/api/v1/posts/${postId}`)
      .send({ title: 'hacked' })

    assert.strictEqual(res.status, 401)
  })

  it('可以更新标签', async () => {
    const res = await request(server)
      .put(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ tags: ['Vue', 'React'] })

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.post.tags.length, 2)
  })
})

describe('DELETE /api/v1/posts/:id', () => {
  let token1, token2, postId

  beforeEach(async () => {
    const u1 = await registerUser('deleter', 'deleter@test.com')
    token1 = u1.token
    const u2 = await registerUser('intruder', 'intruder@test.com')
    token2 = u2.token
    const res = await createPost(token1)
    postId = res.body.post._id
  })

  it('作者可以删除帖子', async () => {
    const res = await request(server)
      .delete(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${token1}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.message, '帖子已删除')

    // 确认已删除
    const check = await request(server).get(`/api/v1/posts/${postId}`)
    assert.strictEqual(check.status, 404)
  })

  it('非作者删除返回 403', async () => {
    const res = await request(server)
      .delete(`/api/v1/posts/${postId}`)
      .set('Authorization', `Bearer ${token2}`)

    assert.strictEqual(res.status, 403)
  })

  it('未登录时返回 401', async () => {
    const res = await request(server).delete(`/api/v1/posts/${postId}`)

    assert.strictEqual(res.status, 401)
  })
})

describe('POST /api/v1/posts/:id/like', () => {
  let token, postId

  beforeEach(async () => {
    const user = await registerUser('liker', 'liker@test.com')
    token = user.token
    const res = await createPost(token)
    postId = res.body.post._id
  })

  it('点赞成功返回 liked: true', async () => {
    const res = await request(server)
      .post(`/api/v1/posts/${postId}/like`)
      .set('Authorization', `Bearer ${token}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.liked, true)
  })

  it('重复点赞取消返回 liked: false', async () => {
    await request(server)
      .post(`/api/v1/posts/${postId}/like`)
      .set('Authorization', `Bearer ${token}`)

    const res = await request(server)
      .post(`/api/v1/posts/${postId}/like`)
      .set('Authorization', `Bearer ${token}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.liked, false)
  })

  it('不存在的帖子返回 404', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(server)
      .post(`/api/v1/posts/${fakeId}/like`)
      .set('Authorization', `Bearer ${token}`)

    assert.strictEqual(res.status, 404)
  })
})

describe('POST /api/v1/posts/:id/collect', () => {
  let token, postId

  beforeEach(async () => {
    const user = await registerUser('collector', 'collector@test.com')
    token = user.token
    const res = await createPost(token)
    postId = res.body.post._id
  })

  it('收藏成功返回 collected: true', async () => {
    const res = await request(server)
      .post(`/api/v1/posts/${postId}/collect`)
      .set('Authorization', `Bearer ${token}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.collected, true)
  })

  it('重复收藏取消返回 collected: false', async () => {
    await request(server)
      .post(`/api/v1/posts/${postId}/collect`)
      .set('Authorization', `Bearer ${token}`)

    const res = await request(server)
      .post(`/api/v1/posts/${postId}/collect`)
      .set('Authorization', `Bearer ${token}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.collected, false)
  })
})
