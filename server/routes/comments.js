import { Router } from 'express'
import { deleteComment } from '../controllers/comment.js'
import { auth } from '../middleware/auth.js'

const router = Router()

// 删除评论（仅作者）
router.delete('/:id', auth, deleteComment)

export default router
