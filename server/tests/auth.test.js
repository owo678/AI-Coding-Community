// 认证接口集成测试
// 运行方式：NODE_ENV=test node --test tests/auth.test.js

import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert'
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../index.js'

let server

before(async () => {
  server = app.listen(0)  // 随机端口
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
  // 每个测试前清理数据库
  const db = mongoose.connection.db
  const collections = await db.listCollections().toArray()
  for (const { name } of collections) {
    await db.collection(name).deleteMany({})
  }
})

describe('POST /api/v1/auth/register', () => {
  it('应该成功注册新用户并返回 token', async () => {
    const res = await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', email: 'test@example.com', password: '123456' })

    assert.strictEqual(res.status, 201)
    assert.ok(res.body.token)
    assert.strictEqual(res.body.user.username, 'testuser')
    assert.strictEqual(res.body.user.email, 'test@example.com')
    assert.strictEqual(res.body.user.password, undefined)  // 密码不应返回
  })

  it('用户名重复时返回 409', async () => {
    await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'dupe', email: 'a@test.com', password: '123456' })

    const res = await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'dupe', email: 'b@test.com', password: '123456' })

    assert.strictEqual(res.status, 409)
  })

  it('邮箱重复时返回 409', async () => {
    await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'aaa', email: 'same@test.com', password: '123456' })

    const res = await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'bbb', email: 'same@test.com', password: '123456' })

    assert.strictEqual(res.status, 409)
  })

  it('缺少必填字段时返回 400', async () => {
    const res = await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'x' })

    assert.strictEqual(res.status, 400)
  })

  it('密码少于 6 位时返回 400', async () => {
    const res = await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'test', email: 't@t.com', password: '123' })

    assert.strictEqual(res.status, 400)
  })
})

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'loginuser', email: 'login@test.com', password: 'correct123' })
  })

  it('正确的邮箱密码登录成功', async () => {
    const res = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'correct123' })

    assert.strictEqual(res.status, 200)
    assert.ok(res.body.token)
    assert.strictEqual(res.body.user.email, 'login@test.com')
  })

  it('错误密码返回 401', async () => {
    const res = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'wrongpassword' })

    assert.strictEqual(res.status, 401)
    assert.strictEqual(res.body.message, '邮箱或密码错误')
  })

  it('不存在的邮箱返回 401', async () => {
    const res = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: '12345678' })

    assert.strictEqual(res.status, 401)
  })
})

describe('GET /api/v1/auth/me', () => {
  let token

  beforeEach(async () => {
    const res = await request(server)
      .post('/api/v1/auth/register')
      .send({ username: 'meuser', email: 'me@test.com', password: '123456' })
    token = res.body.token
  })

  it('携带有效 Token 返回用户信息', async () => {
    const res = await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)

    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.body.user.username, 'meuser')
  })

  it('无 Token 返回 401', async () => {
    const res = await request(server).get('/api/v1/auth/me')
    assert.strictEqual(res.status, 401)
  })

  it('无效 Token 返回 401', async () => {
    const res = await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token-here')

    assert.strictEqual(res.status, 401)
  })
})
