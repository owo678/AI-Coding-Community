import User from '../models/User.js'
import Post from '../models/Post.js'
import Follow from '../models/Follow.js'
import AppError from '../utils/AppError.js'

// GET /api/v1/users/:id —— 获取用户公开信息
export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    // 并行查询关注数、粉丝数、帖子数
    const [followingCount, followersCount, postCount] = await Promise.all([
      Follow.countDocuments({ follower: user._id }),
      Follow.countDocuments({ following: user._id }),
      Post.countDocuments({ author: user._id })
    ])

    res.json({
      user,
      followingCount,
      followersCount,
      postCount
    })
  } catch (error) {
    next(error)
  }
}

// PUT /api/v1/users/profile —— 更新自己的资料
export async function updateProfile(req, res, next) {
  try {
    const { username, bio } = req.body
    const updateData = {}
    if (username !== undefined) updateData.username = username
    if (bio !== undefined) updateData.bio = bio
    // avatar 由上传接口单独处理，也可以在这里接收上传后的 URL

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    )
    if (!user) {
      throw new AppError('用户不存在', 404)
    }

    res.json({ user })
  } catch (error) {
    next(error)
  }
}

// POST /api/v1/users/:id/follow —— 关注/取消关注（toggle 模式）
export async function toggleFollow(req, res, next) {
  try {
    // 不能关注自己
    if (req.params.id === req.userId) {
      throw new AppError('不能关注自己', 400)
    }

    const targetUser = await User.findById(req.params.id)
    if (!targetUser) {
      throw new AppError('用户不存在', 404)
    }

    const existing = await Follow.findOne({
      follower: req.userId,
      following: req.params.id
    })

    if (existing) {
      // 已关注 → 取消关注
      await Follow.deleteOne({ _id: existing._id })
      res.json({ following: false })
    } else {
      // 未关注 → 关注
      await Follow.create({ follower: req.userId, following: req.params.id })
      res.json({ following: true })
    }
  } catch (error) {
    next(error)
  }
}

// GET /api/v1/users/:id/followers —— 粉丝列表
export async function getFollowers(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const skip = (page - 1) * limit

    const [follows, total] = await Promise.all([
      Follow.find({ following: req.params.id })
        .skip(skip)
        .limit(limit)
        .populate('follower', 'username avatar'),
      Follow.countDocuments({ following: req.params.id })
    ])

    const users = follows.map((f) => f.follower)
    res.json({ users, total, page, limit })
  } catch (error) {
    next(error)
  }
}

// GET /api/v1/users/:id/following —— 关注列表
export async function getFollowing(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const skip = (page - 1) * limit

    const [follows, total] = await Promise.all([
      Follow.find({ follower: req.params.id })
        .skip(skip)
        .limit(limit)
        .populate('following', 'username avatar'),
      Follow.countDocuments({ follower: req.params.id })
    ])

    const users = follows.map((f) => f.following)
    res.json({ users, total, page, limit })
  } catch (error) {
    next(error)
  }
}

// GET /api/v1/users/:id/posts —— 获取用户发布的帖子
export async function getUserPosts(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 50)
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      Post.find({ author: req.params.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username avatar'),
      Post.countDocuments({ author: req.params.id })
    ])

    res.json({ posts, total, page, limit })
  } catch (error) {
    next(error)
  }
}
