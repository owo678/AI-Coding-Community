import mongoose from 'mongoose'

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// 联合唯一索引：同一个人不能重复关注另一个人
followSchema.index({ follower: 1, following: 1 }, { unique: true })
// 独立索引：查"我的粉丝"和"我关注的人"
followSchema.index({ follower: 1 })
followSchema.index({ following: 1 })

export default mongoose.model('Follow', followSchema)
