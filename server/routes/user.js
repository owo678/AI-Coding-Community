import { Router } from 'express'
import { body } from 'express-validator'
import {
  getProfile,
  updateProfile,
  getUserPosts,
  toggleFollow,
  getFollowers,
  getFollowing
} from '../controllers/user.js'
import { auth } from '../middleware/auth.js'
import validate from '../middleware/validate.js'

const router = Router()

// 注意：/profile 放在 /:id 之前，避免 Express 把 "profile" 当作 :id
router.put('/profile', auth, [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 }).withMessage('用户名需要 2-20 个字符'),
  body('bio')
    .optional()
    .isLength({ max: 200 }).withMessage('简介最多 200 个字符')
], validate, updateProfile)

router.get('/:id', getProfile)
router.get('/:id/posts', getUserPosts)
router.get('/:id/followers', getFollowers)
router.get('/:id/following', getFollowing)
router.post('/:id/follow', auth, toggleFollow)

export default router
