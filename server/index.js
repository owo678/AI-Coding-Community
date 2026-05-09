import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import fs from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
import connectDB from './config/db.js'
import mongoose from 'mongoose'
import config from './config/index.js'
import { globalLimiter } from './middleware/rateLimiter.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

// ---------- 基础中间件 ----------
const allowedOrigins = config.corsOrigin === '*'
  ? '*'
  : config.corsOrigin.split(',').map(s => s.trim())
app.use(cors({ origin: allowedOrigins, credentials: true }))

if (config.nodeEnv === 'production') {
  app.use(helmet())
}
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
if (process.env.NODE_ENV !== 'test') {
  if (config.nodeEnv === 'production') {
    const logDir = resolve(projectRoot, 'server', 'logs')
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
    const accessLogStream = fs.createWriteStream(resolve(logDir, 'access.log'), { flags: 'a' })
    app.use(morgan('combined', { stream: accessLogStream }))
  } else {
    app.use(morgan('dev'))
  }
}
app.use(globalLimiter)

// ---------- 静态文件 ----------
app.use('/uploads', express.static(config.uploadDir))

// ---------- 路由 ----------
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import postRoutes from './routes/posts.js'
import commentRoutes from './routes/comments.js'
import uploadRoutes from './routes/upload.js'

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/posts', postRoutes)
app.use('/api/v1/comments', commentRoutes)
app.use('/api/v1/upload', uploadRoutes)

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ---------- 生产模式：serve 前端静态文件 ----------
if (process.env.NODE_ENV === 'production') {
  const clientDist = resolve(projectRoot, 'client', 'dist')
  app.use(express.static(clientDist))
  // SPA 回退：非 API 路径都返回 index.html
  app.get('*', (req, res) => {
    res.sendFile(resolve(clientDist, 'index.html'))
  })
  console.log('[生产模式] 前端静态文件:', clientDist)
}

// ---------- 错误处理 ----------
app.use(errorHandler)

// ---------- 启动 ----------
async function start() {
  // 确保上传目录存在
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true })
    console.log('[启动] 创建上传目录:', config.uploadDir)
  }

  // JWT 密钥安全检查
  const weakSecrets = ['fallback-secret', 'your-secret-key', 'dev-secret-change-in-production']
  if (config.nodeEnv === 'production' && weakSecrets.includes(config.jwtSecret)) {
    console.warn('[警告] 生产环境使用了不安全的 JWT_SECRET，请在 .env 中设置强随机字符串')
  }

  await connectDB()
  const server = app.listen(config.port, () => {
    console.log(`[服务器] 运行在 http://localhost:${config.port}`)
  })

  // ---------- 优雅关闭 ----------
  async function shutdown(signal) {
    console.log(`\n[服务器] 收到 ${signal}，正在关闭...`)
    server.close(() => {
      mongoose.connection.close().then(() => {
        console.log('[服务器] MongoDB 已断开')
        process.exit(0)
      })
    })
    // 强制退出（10 秒后）
    setTimeout(() => {
      console.error('[服务器] 强制退出')
      process.exit(1)
    }, 10000)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

// 直接运行时启动服务，被 import 时只导出 app（供测试用）
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (isMainModule) {
  start()
}

export default app
