import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import User from '../models/User.js'

// 强制认证中间件 —— 未登录返回 401
export function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: '请先登录' })
  }

  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ message: '登录已过期，请重新登录' })
  }
}

// 可选认证中间件 —— 登录与否均可访问，登录后注入 req.userId
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return next()
  }

  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.userId = decoded.userId
  } catch (error) {
    // Token 无效也继续，当作未登录处理
  }
  next()
}
