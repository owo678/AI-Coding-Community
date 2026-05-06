import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, '评论内容不能为空'],
    maxlength: [2000, '评论最多2000个字符']
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null   // null = 一级评论，非 null = 回复
  }
}, {
  timestamps: true
})

// 按帖子 + 创建时间查询评论列表
commentSchema.index({ post: 1, createdAt: 1 })

export default mongoose.model('Comment', commentSchema)
