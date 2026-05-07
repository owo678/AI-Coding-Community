import multer from 'multer'
import { extname, resolve } from 'path'
import User from '../models/User.js'
import config from '../config/index.js'

// multer 存储配置 —— 磁盘存储，按日期分目录
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = resolve(config.uploadDir)
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // avatar-{userId}-{timestamp}.{ext}
    const ext = extname(file.originalname) || '.png'
    const filename = `avatar-${req.userId}-${Date.now()}${ext}`
    cb(null, filename)
  }
})

// 文件类型校验
function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('只允许上传 JPG/PNG/GIF/WebP 格式的图片'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileSize }
})

// POST /api/v1/upload/avatar —— 上传头像
export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的文件' })
    }

    const avatarUrl = `/uploads/${req.file.filename}`
    await User.findByIdAndUpdate(req.userId, { avatar: avatarUrl })

    res.json({ avatar: avatarUrl })
  } catch (error) {
    next(error)
  }
}
