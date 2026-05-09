import mongoose from 'mongoose'
import config from './index.js'

const MAX_RETRIES = 3
const RETRY_DELAY = 2000

const connectionOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default async function connectDB(retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(config.mongodbUri, connectionOptions)
      console.log(`[数据库] MongoDB 已连接: ${conn.connection.host}`)
      return conn
    } catch (error) {
      console.error(`[数据库] MongoDB 连接失败 (${attempt}/${retries}): ${error.message}`)
      if (attempt < retries) {
        console.log(`[数据库] ${RETRY_DELAY / 1000} 秒后重试...`)
        await sleep(RETRY_DELAY)
      }
    }
  }
  console.error('[数据库] MongoDB 连接重试耗尽，退出进程')
  process.exit(1)
}

mongoose.connection.on('error', (err) => {
  console.error(`[数据库] MongoDB 连接异常: ${err.message}`)
})
