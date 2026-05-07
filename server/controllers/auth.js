import User from '../models/User.js'
import { generateToken } from '../utils/token.js'
import AppError from '../utils/AppError.js'

// POST /api/v1/auth/register
export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body

    // 检查用户名和邮箱是否已存在
    const existing = await User.findOne({
      $or: [{ username }, { email }]
    })
    if (existing) {
      const field = existing.username === username ? '用户名' : '邮箱'
      throw new AppError(`${field}已被使用`, 409)
    }

    const user = await User.create({ username, email, password })
    const token = generateToken(user._id)

    res.status(201).json({ token, user })
  } catch (error) {
    next(error)
  }
}

// POST /api/v1/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    // findOne 默认不返回 password，需要显式 select
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      throw new AppError('邮箱或密码错误', 401)
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      throw new AppError('邮箱或密码错误', 401)
    }

    const token = generateToken(user._id)
    res.json({ token, user })
  } catch (error) {
    next(error)
  }
}

// GET /api/v1/auth/me
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }
    res.json({ user })
  } catch (error) {
    next(error)
  }
}
