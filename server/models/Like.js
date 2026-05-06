import mongoose from 'mongoose'

const likeSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// 联合唯一索引：同一用户对同一帖子只能点赞一次
likeSchema.index({ post: 1, user: 1 }, { unique: true })

export default mongoose.model('Like', likeSchema)
