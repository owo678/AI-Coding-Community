import mongoose from 'mongoose'

const collectSchema = new mongoose.Schema({
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

collectSchema.index({ post: 1, user: 1 }, { unique: true })

export default mongoose.model('Collect', collectSchema)
