import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import config from './config/index.js'
import { globalLimiter } from './middleware/rateLimiter.js'
import errorHandler from './middleware/errorHandler.js'

const app = express()

// ---------- 基础中间件 ----------
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}
app.use(globalLimiter)

// ---------- 静态文件 ----------
app.use('/uploads', express.static(config.uploadDir))

// ---------- 路由 ----------
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import postRoutes from './routes/posts.js'
import uploadRoutes from './routes/upload.js'

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/posts', postRoutes)
app.use('/api/v1/upload', uploadRoutes)

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ---------- 错误处理 ----------
app.use(errorHandler)

// ---------- 启动 ----------
async function start() {
  await connectDB()
  app.listen(config.port, () => {
    console.log(`[服务器] 运行在 http://localhost:${config.port}`)
  })
}

// 直接运行时启动服务，被 import 时只导出 app（供测试用）
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (isMainModule) {
  start()
}

export default app
