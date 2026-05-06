import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, '标题不能为空'],
    trim: true,
    maxlength: [100, '标题最多100个字符']
  },
  content: {
    type: String,
    required: [true, '内容不能为空']
  },
  tags: [{
    type: String,
    trim: true
  }],
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// 标题文本索引用于搜索
postSchema.index({ title: 'text', content: 'text' })
// 标签索引用于筛选
postSchema.index({ tags: 1 })
// 创建时间倒序索引用于列表查询
postSchema.index({ createdAt: -1 })

export default mongoose.model('Post', postSchema)
