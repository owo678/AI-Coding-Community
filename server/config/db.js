import mongoose from 'mongoose'
import config from './index.js'

export default async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongodbUri)
    console.log(`[数据库] MongoDB 已连接: ${conn.connection.host}`)
  } catch (error) {
    console.error(`[数据库] MongoDB 连接失败: ${error.message}`)
    process.exit(1)
  }

  mongoose.connection.on('error', (err) => {
    console.error(`[数据库] MongoDB 连接异常: ${err.message}`)
  })
}
