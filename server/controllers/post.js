import Post from '../models/Post.js'
import Like from '../models/Like.js'
import Collect from '../models/Collect.js'
import Comment from '../models/Comment.js'
import AppError from '../utils/AppError.js'

// GET /api/v1/posts —— 帖子列表（分页、排序、搜索、标签筛选）
export async function getPosts(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 50)
    const skip = (page - 1) * limit
    const { sort, tag, search } = req.query

    const filter = {}
    if (tag) filter.tags = tag
    if (search) filter.$text = { $search: search }

    let sortOption = {}
    if (sort === 'hot') {
      sortOption = { viewCount: -1, createdAt: -1 }
    } else {
      sortOption = { createdAt: -1 }
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('author', 'username avatar'),
      Post.countDocuments(filter)
    ])

    // 批量查询每个帖子的点赞数和评论数
    const postIds = posts.map((p) => p._id)
    const [likeCounts, commentCounts] = await Promise.all([
      Like.aggregate([
        { $match: { post: { $in: postIds } } },
        { $group: { _id: '$post', count: { $sum: 1 } } }
      ]),
      Comment.aggregate([
        { $match: { post: { $in: postIds } } },
        { $group: { _id: '$post', count: { $sum: 1 } } }
      ])
    ])

    const likeMap = Object.fromEntries(likeCounts.map((l) => [l._id.toString(), l.count]))
    const commentMap = Object.fromEntries(commentCounts.map((c) => [c._id.toString(), c.count]))

    const postsWithCounts = posts.map((p) => {
      const obj = p.toObject()
      obj.likeCount = likeMap[p._id.toString()] || 0
      obj.commentCount = commentMap[p._id.toString()] || 0
      return obj
    })

    res.json({ posts: postsWithCounts, total, page, limit })
  } catch (error) {
    next(error)
  }
}

// GET /api/v1/posts/:id —— 帖子详情
export async function getPost(req, res, next) {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('author', 'username avatar bio')

    if (!post) {
      throw new AppError('帖子不存在', 404)
    }

    // 查询点赞数、评论数、收藏数
    const [likeCount, commentCount, collectCount] = await Promise.all([
      Like.countDocuments({ post: post._id }),
      Comment.countDocuments({ post: post._id }),
      Collect.countDocuments({ post: post._id })
    ])

    let liked = false
    let collected = false
    if (req.userId) {
      const [likeDoc, collectDoc] = await Promise.all([
        Like.findOne({ post: post._id, user: req.userId }),
        Collect.findOne({ post: post._id, user: req.userId })
      ])
      liked = !!likeDoc
      collected = !!collectDoc
    }

    res.json({
      post: { ...post.toObject(), likeCount, commentCount, collectCount, liked, collected }
    })
  } catch (error) {
    next(error)
  }
}

// POST /api/v1/posts —— 创建帖子
export async function createPost(req, res, next) {
  try {
    const { title, content, tags } = req.body

    const post = await Post.create({
      author: req.userId,
      title,
      content,
      tags: tags || []
    })

    const populated = await post.populate('author', 'username avatar')
    res.status(201).json({ post: populated })
  } catch (error) {
    next(error)
  }
}

// PUT /api/v1/posts/:id —— 更新帖子（仅作者）
export async function updatePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      throw new AppError('帖子不存在', 404)
    }
    if (post.author.toString() !== req.userId) {
      throw new AppError('只能编辑自己的帖子', 403)
    }

    const { title, content, tags } = req.body
    if (title !== undefined) post.title = title
    if (content !== undefined) post.content = content
    if (tags !== undefined) post.tags = tags

    await post.save()
    const populated = await post.populate('author', 'username avatar')
    res.json({ post: populated })
  } catch (error) {
    next(error)
  }
}

// DELETE /api/v1/posts/:id —— 删除帖子（仅作者）
export async function deletePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      throw new AppError('帖子不存在', 404)
    }
    if (post.author.toString() !== req.userId) {
      throw new AppError('只能删除自己的帖子', 403)
    }

    await Post.deleteOne({ _id: post._id })
    // 删除关联数据
    await Promise.all([
      Like.deleteMany({ post: post._id }),
      Collect.deleteMany({ post: post._id }),
      Comment.deleteMany({ post: post._id })
    ])

    res.json({ message: '帖子已删除' })
  } catch (error) {
    next(error)
  }
}

// POST /api/v1/posts/:id/like —— 点赞/取消点赞（toggle 模式）
export async function toggleLike(req, res, next) {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      throw new AppError('帖子不存在', 404)
    }

    const existing = await Like.findOne({ post: post._id, user: req.userId })
    if (existing) {
      await Like.deleteOne({ _id: existing._id })
      res.json({ liked: false })
    } else {
      await Like.create({ post: post._id, user: req.userId })
      res.json({ liked: true })
    }
  } catch (error) {
    next(error)
  }
}

// POST /api/v1/posts/:id/collect —— 收藏/取消收藏（toggle 模式）
export async function toggleCollect(req, res, next) {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      throw new AppError('帖子不存在', 404)
    }

    const existing = await Collect.findOne({ post: post._id, user: req.userId })
    if (existing) {
      await Collect.deleteOne({ _id: existing._id })
      res.json({ collected: false })
    } else {
      await Collect.create({ post: post._id, user: req.userId })
      res.json({ collected: true })
    }
  } catch (error) {
    next(error)
  }
}
