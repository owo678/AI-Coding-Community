import rateLimit from 'express-rate-limit'

// 全局频率限制：所有接口共用，60次/分钟
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '请求过于频繁，请稍后再试' }
})

// 认证接口频率限制：注册/登录等敏感接口，5次/分钟
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '操作过于频繁，请1分钟后再试' }
})
