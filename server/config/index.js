import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// server 目录路径
const serverDir = resolve(__dirname, '..')

// 加载 server 目录下的 .env 文件
dotenv.config({ path: resolve(serverDir, '.env') })

export default {
  port: parseInt(process.env.PORT, 10) || 3000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-coding',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // 相对路径相对于 server/ 目录解析为绝对路径
  uploadDir: resolve(serverDir, process.env.UPLOAD_DIR || 'uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 2 * 1024 * 1024
}
