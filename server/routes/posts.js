import { Router } from 'express'
import { body } from 'express-validator'
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleCollect
} from '../controllers/post.js'
import { getComments, createComment } from '../controllers/comment.js'
import { auth, optionalAuth } from '../middleware/auth.js'
import validate from '../middleware/validate.js'

const router = Router()

// 帖子列表 —— 公开访问
router.get('/', getPosts)

// 帖子详情 —— 可选认证（登录后可获取是否已点赞/收藏）
router.get('/:id', optionalAuth, getPost)

// 创建帖子 —— 需要登录
router.post('/', auth, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('标题需要 1-100 个字符'),
  body('content')
    .trim()
    .notEmpty().withMessage('内容不能为空'),
  body('tags')
    .optional()
    .isArray().withMessage('标签必须是数组')
], validate, createPost)

// 更新帖子 —— 需要登录
router.put('/:id', auth, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('标题需要 1-100 个字符'),
  body('content')
    .optional()
    .trim()
    .notEmpty().withMessage('内容不能为空'),
  body('tags')
    .optional()
    .isArray().withMessage('标签必须是数组')
], validate, updatePost)

// 删除帖子 —— 需要登录
router.delete('/:id', auth, deletePost)

// 点赞/取消点赞 —— 需要登录
router.post('/:id/like', auth, toggleLike)

// 收藏/取消收藏 —— 需要登录
router.post('/:id/collect', auth, toggleCollect)

// 评论列表 —— 公开访问
router.get('/:id/comments', getComments)

// 添加评论/回复 —— 需要登录
router.post('/:id/comments', auth, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage('评论内容需要 1-2000 个字符')
], validate, createComment)

export default router
