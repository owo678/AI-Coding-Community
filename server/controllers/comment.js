import Comment from '../models/Comment.js'
import Post from '../models/Post.js'
import AppError from '../utils/AppError.js'

// GET /api/v1/posts/:id/comments —— 评论列表（含二级回复）
export async function getComments(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const skip = (page - 1) * limit

    // 先查一级评论
    const [parents, total] = await Promise.all([
      Comment.find({ post: req.params.id, parentComment: null })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username avatar'),
      Comment.countDocuments({ post: req.params.id, parentComment: null })
    ])

    // 查一级评论的所有回复
    const parentIds = parents.map((c) => c._id)
    let replies = []
    if (parentIds.length > 0) {
      replies = await Comment.find({ parentComment: { $in: parentIds } })
        .sort({ createdAt: 1 })
        .populate('author', 'username avatar')
        .populate('parentComment', '_id')
    }

    // 组装：replyMap[parentId] = [reply1, reply2, ...]
    const replyMap = {}
    for (const r of replies) {
      const pid = r.parentComment?._id?.toString() || r.parentComment?.toString()
      if (!replyMap[pid]) replyMap[pid] = []
      replyMap[pid].push(r)
    }

    const comments = parents.map((p) => ({
      ...p.toObject(),
      replies: replyMap[p._id.toString()] || []
    }))

    res.json({ comments, total, page, limit })
  } catch (error) {
    next(error)
  }
}

// POST /api/v1/posts/:id/comments —— 添加评论/回复
export async function createComment(req, res, next) {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      throw new AppError('帖子不存在', 404)
    }

    const { content, parentComment } = req.body

    // 如果是回复，校验父评论存在且属于同一帖子
    if (parentComment) {
      const parent = await Comment.findById(parentComment)
      if (!parent || parent.post.toString() !== req.params.id) {
        throw new AppError('父评论不存在', 404)
      }
    }

    const comment = await Comment.create({
      post: req.params.id,
      author: req.userId,
      content,
      parentComment: parentComment || null
    })

    const populated = await comment.populate([
      { path: 'author', select: 'username avatar' },
      { path: 'parentComment', select: '_id' }
    ])

    res.status(201).json({ comment: populated })
  } catch (error) {
    next(error)
  }
}

// DELETE /api/v1/comments/:id —— 删除评论（仅作者）
export async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) {
      throw new AppError('评论不存在', 404)
    }
    if (comment.author.toString() !== req.userId) {
      throw new AppError('只能删除自己的评论', 403)
    }

    // 级联删除该评论下的所有回复
    await Comment.deleteMany({ parentComment: comment._id })
    await Comment.deleteOne({ _id: comment._id })

    res.json({ message: '评论已删除' })
  } catch (error) {
    next(error)
  }
}
