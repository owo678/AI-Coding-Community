// 用户接口集成测试
// 运行方式：NODE_ENV=test node --test tests/user.test.js

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

describe('GET /api/v1/users/:id', () => {
  it('应该返回用户公开信息和统计数', async () => {
    const reg = await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'publicuser', email: 'public@test.com', password: '123456' })

    const res = await request(server).get(`/api/v1/users/${reg.body.user._id}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.user.username, 'publicuser')
    assert.strictEqual(res.body.user.password, undefined)
    assert.strictEqual(typeof res.body.followersCount, 'number')
    assert.strictEqual(typeof res.body.followingCount, 'number')
    assert.strictEqual(typeof res.body.postCount, 'number')
  })

  it('不存在的用户返回 404', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(server).get(`/api/v1/users/${fakeId}`)
    assert.strictEqual(res.status, 404)
  })
})

describe('PUT /api/v1/users/profile', () => {
  let token, userId

  beforeEach(async () => {
    const reg = await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'edituser', email: 'edit@test.com', password: '123456' })
    token = reg.body.token
    userId = reg.body.user._id
  })

  it('应该成功更新用户名和简介', async () => {
    const res = await request(server)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'newusername', bio: 'Hello World' })

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.user.username, 'newusername')
    assert.strictEqual(res.body.user.bio, 'Hello World')
  })

  it('未认证时返回 401', async () => {
    const res = await request(server)
      .put('/api/v1/users/profile')
      .send({ username: 'hacker' })

    assert.strictEqual(res.status, 401)
  })

  it('用户名过短时返回 400', async () => {
    const res = await request(server)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'x' })

    assert.strictEqual(res.status, 400)
  })
})

describe('POST /api/v1/users/:id/follow', () => {
  let token1, token2, user1Id, user2Id

  beforeEach(async () => {
    const r1 = await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'follower', email: 'f1@test.com', password: '123456' })
    token1 = r1.body.token
    user1Id = r1.body.user._id

    const r2 = await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'target', email: 'f2@test.com', password: '123456' })
    token2 = r2.body.token
    user2Id = r2.body.user._id
  })

  it('关注成功返回 following: true', async () => {
    const res = await request(server)
      .post(`/api/v1/users/${user2Id}/follow`)
      .set('Authorization', `Bearer ${token1}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.following, true)
  })

  it('重复关注取消关注返回 following: false', async () => {
    // 先关注
    await request(server)
      .post(`/api/v1/users/${user2Id}/follow`)
      .set('Authorization', `Bearer ${token1}`)

    // 再取关
    const res = await request(server)
      .post(`/api/v1/users/${user2Id}/follow`)
      .set('Authorization', `Bearer ${token1}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.following, false)
  })

  it('不能关注自己', async () => {
    const res = await request(server)
      .post(`/api/v1/users/${user1Id}/follow`)
      .set('Authorization', `Bearer ${token1}`)

    assert.strictEqual(res.status, 400)
  })

  it('未认证时返回 401', async () => {
    const res = await request(server)
      .post(`/api/v1/users/${user2Id}/follow`)

    assert.strictEqual(res.status, 401)
  })
})

describe('GET /api/v1/users/:id/followers', () => {
  it('应该返回粉丝列表', async () => {
    const r1 = await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'star', email: 'star@test.com', password: '123456' })

    const r2 = await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'fan', email: 'fan@test.com', password: '123456' })

    await request(server)
      .post(`/api/v1/users/${r1.body.user._id}/follow`)
      .set('Authorization', `Bearer ${r2.body.token}`)

    const res = await request(server)
      .get(`/api/v1/users/${r1.body.user._id}/followers`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.total, 1)
    assert.strictEqual(res.body.users[0].username, 'fan')
  })
})
