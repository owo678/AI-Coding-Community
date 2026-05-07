import { Router } from 'express'
import { upload, uploadAvatar } from '../controllers/upload.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.post('/avatar', auth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: '文件大小不能超过 2MB' })
      }
      return res.status(400).json({ message: err.message })
    }
    next()
  })
}, uploadAvatar)

export default router
