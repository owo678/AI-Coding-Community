import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import connectDB from './config/db.js'
import config from './config/index.js'
import { globalLimiter } from './middleware/rateLimiter.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

// ---------- 基础中间件 ----------
app.use(cors())                          // 跨域
app.use(express.json({ limit: '1mb' })) // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))                   // HTTP 请求日志
app.use(globalLimiter)                   // 全局限流

// ---------- 路由 ----------
// 阶段二开始挂载业务路由，目前只留健康检查
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ---------- 错误处理（必须放在路由之后） ----------
app.use(errorHandler)

// ---------- 启动 ----------
async function start() {
  await connectDB()
  app.listen(config.port, () => {
    console.log(`[服务器] 运行在 http://localhost:${config.port}`)
  })
}

start()
