import { validationResult } from 'express-validator'

// 包装 express-validator 的校验结果检查
export default function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: '参数校验失败',
      errors: errors.array().map((e) => e.msg)
    })
  }
  next()
}
