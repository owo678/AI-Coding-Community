// 统一错误处理中间件
// Express 通过参数个数（4个）识别错误处理中间件
export default function errorHandler(err, req, res, _next) {
  console.error(`[错误] ${req.method} ${req.path}:`, err.message)

  // Mongoose 校验错误
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ message: '参数校验失败', errors })
  }

  // Mongoose 重复键错误（唯一索引冲突）
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(409).json({ message: `${field} 已被使用` })
  }

  // Mongoose 文档未找到
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({ message: '资源不存在' })
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: '无效的 Token' })
  }

  // 自定义业务错误（在控制器中 throw 的）
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message })
  }

  // 未知错误
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message || '服务器内部错误'
  })
}
