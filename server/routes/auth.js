import { Router } from 'express'
import { body } from 'express-validator'
import { register, login, getMe } from '../controllers/auth.js'
import { auth } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import validate from '../middleware/validate.js'

const router = Router()

// 注册
router.post('/register', authLimiter, [
  body('username')
    .trim()
    .isLength({ min: 2, max: 20 }).withMessage('用户名需要 2-20 个字符'),
  body('email')
    .trim()
    .isEmail().withMessage('邮箱格式不正确'),
  body('password')
    .isLength({ min: 6 }).withMessage('密码至少 6 个字符')
], validate, register)

// 登录
router.post('/login', authLimiter, [
  body('email')
    .trim()
    .notEmpty().withMessage('邮箱不能为空'),
  body('password')
    .notEmpty().withMessage('密码不能为空')
], validate, login)

// 获取当前用户
router.get('/me', auth, getMe)

export default router
