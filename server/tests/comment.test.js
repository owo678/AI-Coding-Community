// 评论接口集成测试
// 运行方式：node --test tests/comment.test.js

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

async function registerUser(username, email) {
  const res = await request(server)
    .post('/api/v1/auth/register')
    .send({ username, email, password: '123456' })
  return { token: res.body.token, userId: res.body.user._id }
}

async function createPost(token, data = {}) {
  const res = await request(server)
    .post('/api/v1/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: data.title || '测试帖子',
      content: data.content || '测试内容',
      tags: data.tags || []
    })
  return res.body.post._id
}

describe('POST /api/v1/posts/:id/comments', () => {
  let token, postId

  beforeEach(async () => {
    const user = await registerUser('commenter', 'commenter@test.com')
    token = user.token
    postId = await createPost(token)
  })

  it('创建一级评论成功返回 201', async () => {
    const res = await request(server)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '这是一条测试评论' })

    assert.strictEqual(res.status, 201)
    assert.strictEqual(res.body.comment.content, '这是一条测试评论')
    assert.strictEqual(res.body.comment.parentComment, null)
    assert.ok(res.body.comment.author.username)
  })

  it('创建回复评论成功', async () => {
    const parent = await request(server)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '父评论' })

    const res = await request(server)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '回复评论', parentComment: parent.body.comment._id })

    assert.strictEqual(res.status, 201)
    assert.strictEqual(res.body.comment.parentComment._id, parent.body.comment._id)
  })

  it('未登录返回 401', async () => {
    const res = await request(server)
      .post(`/api/v1/posts/${postId}/comments`)
      .send({ content: 'test' })

    assert.strictEqual(res.status, 401)
  })

  it('内容为空返回 400', async () => {
    const res = await request(server)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '' })

    assert.strictEqual(res.status, 400)
  })

  it('帖子不存在返回 404', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(server)
      .post(`/api/v1/posts/${fakeId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'test' })

    assert.strictEqual(res.status, 404)
  })
})

describe('GET /api/v1/posts/:id/comments', () => {
  let token, postId

  beforeEach(async () => {
    const user = await registerUser('lister2', 'lister2@test.com')
    token = user.token
    postId = await createPost(token)

    // 创建几条评论
    await request(server)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '评论 1' })

    const parentRes = await request(server)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '评论 2' })

    // 回复评论2
    await request(server)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '回复 2-1', parentComment: parentRes.body.comment._id })
  })

  it('返回评论列表包含回复', async () => {
    const res = await request(server).get(`/api/v1/posts/${postId}/comments`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.total, 2) // 只有2条一级评论
    assert.strictEqual(res.body.comments.length, 2)

    // 找到有回复的那条
    const commentWithReply = res.body.comments.find((c) => c.replies.length > 0)
    assert.ok(commentWithReply)
    assert.strictEqual(commentWithReply.replies[0].content, '回复 2-1')
  })

  it('支持分页', async () => {
    const res = await request(server)
      .get(`/api/v1/posts/${postId}/comments?page=1&limit=1`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.comments.length, 1)
    assert.strictEqual(res.body.total, 2)
  })

  it('不存在的帖子返回空列表', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(server).get(`/api/v1/posts/${fakeId}/comments`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.comments.length, 0)
  })
})

describe('DELETE /api/v1/comments/:id', () => {
  let token1, token2, commentId, postId

  beforeEach(async () => {
    const u1 = await registerUser('owner', 'owner@test.com')
    token1 = u1.token
    const u2 = await registerUser('intruder2', 'intruder2@test.com')
    token2 = u2.token
    postId = await createPost(token1)

    const res = await request(server)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ content: '待删除评论' })
    commentId = res.body.comment._id
  })

  it('评论作者可以删除', async () => {
    const res = await request(server)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${token1}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.message, '评论已删除')
  })

  it('非作者删除返回 403', async () => {
    const res = await request(server)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${token2}`)

    assert.strictEqual(res.status, 403)
  })

  it('未登录返回 401', async () => {
    const res = await request(server).delete(`/api/v1/comments/${commentId}`)

    assert.strictEqual(res.status, 401)
  })

  it('级联删除回复', async () => {
    // 先创建回复
    const replyRes = await request(server)
      .post(`/api/v1/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ content: '回复', parentComment: commentId })
    const replyId = replyRes.body.comment._id

    // 删除父评论
    await request(server)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${token1}`)

    // 回复也应被删除
    const reply = await request(server)
      .delete(`/api/v1/comments/${replyId}`)
      .set('Authorization', `Bearer ${token1}`)

    assert.strictEqual(reply.status, 404)
  })
})
