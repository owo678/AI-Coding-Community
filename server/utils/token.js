import jwt from 'jsonwebtoken'
import config from '../config/index.js'

// 生成 JWT Token，payload 只存最小必要信息
export function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  })
}
