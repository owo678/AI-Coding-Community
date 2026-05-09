# AI编程经验社区系统 - 开发计划

## 1. 项目概述

- **项目名称**: AI编程经验社区 (AI-Coding Community)
- **项目类型**: 前后端分离的Web社区论坛系统
- **核心功能**: 用户注册登录、发布帖子、点赞、评论、关注
- **目标用户**: 程序员、AI爱好者、编程学习者

---

## 2. 技术栈选型

### 前端

| 技术         | 版本 | 用途     |
| ------------ | ---- | -------- |
| Vue 3        | ^3.4 | 核心框架 |
| Vue Router   | ^4.x | 路由管理 |
| Pinia        | ^2.x | 状态管理 |
| Element Plus | ^2.x | UI组件库 |
| Axios        | ^1.x | HTTP请求 |

### 后端

| 技术               | 版本  | 用途     |
| ------------------ | ----- | -------- |
| Node.js            | ^20.x | 运行时   |
| Express            | ^4.x  | Web框架  |
| MongoDB + Mongoose | ^7.x  | 数据库   |
| JWT                | ^9.x  | 身份认证 |
| bcryptjs           | ^2.x  | 密码加密 |
| express-validator  | ^7.x  | 输入验证 |
| express-rate-limit | ^7.x  | 频率限制 |
| multer             | ^1.x  | 文件上传 |

---

## 3. 功能模块

### 3.1 用户模块

- 用户注册（用户名、邮箱、密码）
- 用户登录（JWT Token + 过期刷新）
- 用户信息编辑（头像上传、简介）
- 用户主页（展示发布的所有帖子）
- 关注/取消关注用户
- 粉丝列表 / 关注列表

### 3.2 帖子模块

- 创建帖子（标题、内容、标签）
- 帖子列表（分页、按标签/热度/时间筛选）
- 帖子详情
- 编辑/删除自己的帖子（作者权限校验）
- 帖子搜索（标题关键词，MongoDB文本索引）

### 3.3 互动模块

- 点赞帖子/取消点赞
- 评论帖子（支持回复，二级评论结构）
- 收藏帖子/取消收藏

### 3.4 首页模块

- 热门帖子推荐（按点赞数 + 评论数排序）
- 最新帖子
- 标签筛选

---

## 4. 数据库设计

> **核心原则**: 避免嵌套数组膨胀，点赞、收藏、关注均拆分为独立集合。

### User（用户表）

```javascript
{
  username:   { type: String, unique: true, required: true },
  email:      { type: String, unique: true, required: true },
  password:   { type: String, required: true },
  avatar:     { type: String, default: '' },
  bio:        { type: String, default: '', maxlength: 200 },
  createdAt:  { type: Date, default: Date.now }
}
// 关注关系不放 User 中，拆分到 Follow 集合
```

### Post（帖子表）

```javascript
{
  author:    { type: ObjectId, ref: 'User', required: true, index: true },
  title:     { type: String, required: true, maxlength: 100 },
  content:   { type: String, required: true },
  tags:      [{ type: String, index: true }],
  viewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
// 点赞数/收藏数/评论数通过查询对应集合 countDocuments 获取，不在 Post 存冗余字段
```

### Comment（评论表）

```javascript
{
  post:          { type: ObjectId, ref: 'Post', required: true, index: true },
  author:        { type: ObjectId, ref: 'User', required: true },
  content:       { type: String, required: true, maxlength: 2000 },
  parentComment: { type: ObjectId, ref: 'Comment', default: null },  // null=一级评论
  createdAt:     { type: Date, default: Date.now }
}
```

### Like（点赞表）—— 独立集合

```javascript
{
  post:      { type: ObjectId, ref: 'Post', required: true },
  user:      { type: ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}
// 联合唯一索引: { post: 1, user: 1 }
```

### Collect（收藏表）—— 独立集合

```javascript
{
  post:      { type: ObjectId, ref: 'Post', required: true },
  user:      { type: ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}
// 联合唯一索引: { post: 1, user: 1 }
```

### Follow（关注表）—— 独立集合

```javascript
{
  follower:  { type: ObjectId, ref: 'User', required: true },  // 发起关注的人
  following: { type: ObjectId, ref: 'User', required: true },  // 被关注的人
  createdAt: { type: Date, default: Date.now }
}
// 联合唯一索引: { follower: 1, following: 1 }
// 单独索引: { follower: 1 } + { following: 1 } （查询关注列表/粉丝列表用）
```

---

## 5. API 设计

> 所有接口统一前缀 `/api/v1`，需要认证的接口标注 🔒。
> 所有请求参数和响应格式见各接口注释。

### 5.1 认证接口

| 方法 | 路径                    | 说明             | 认证 |
| ---- | ----------------------- | ---------------- | ---- |
| POST | `/api/v1/auth/register` | 注册             | -    |
| POST | `/api/v1/auth/login`    | 登录，返回 JWT   | -    |
| GET  | `/api/v1/auth/me`       | 获取当前用户信息 | 🔒   |

### 5.2 用户接口

| 方法 | 路径                          | 说明                         | 认证 |
| ---- | ----------------------------- | ---------------------------- | ---- |
| GET  | `/api/v1/users/:id`           | 获取用户公开信息             | -    |
| PUT  | `/api/v1/users/profile`       | 更新自己的资料（含头像上传） | 🔒   |
| POST | `/api/v1/users/:id/follow`    | 关注/取消关注                | 🔒   |
| GET  | `/api/v1/users/:id/followers` | 粉丝列表                     | -    |
| GET  | `/api/v1/users/:id/following` | 关注列表                     | -    |
| GET  | `/api/v1/users/:id/posts`     | 该用户发布的帖子             | -    |

### 5.3 帖子接口

| 方法   | 路径                        | 说明                         | 认证 |
| ------ | --------------------------- | ---------------------------- | ---- |
| GET    | `/api/v1/posts`             | 帖子列表（分页、筛选、排序） | -    |
| POST   | `/api/v1/posts`             | 创建帖子                     | 🔒   |
| GET    | `/api/v1/posts/:id`         | 帖子详情                     | -    |
| PUT    | `/api/v1/posts/:id`         | 更新帖子（仅作者）           | 🔒   |
| DELETE | `/api/v1/posts/:id`         | 删除帖子（仅作者）           | 🔒   |
| POST   | `/api/v1/posts/:id/like`    | 点赞/取消点赞                | 🔒   |
| POST   | `/api/v1/posts/:id/collect` | 收藏/取消收藏                | 🔒   |

### 5.4 评论接口

| 方法   | 路径                         | 说明                 | 认证 |
| ------ | ---------------------------- | -------------------- | ---- |
| GET    | `/api/v1/posts/:id/comments` | 获取评论列表（分页） | -    |
| POST   | `/api/v1/posts/:id/comments` | 添加评论（含回复）   | 🔒   |
| DELETE | `/api/v1/comments/:id`       | 删除评论（仅作者）   | 🔒   |

### 5.5 文件上传接口

| 方法 | 路径                    | 说明     | 认证 |
| ---- | ----------------------- | -------- | ---- |
| POST | `/api/v1/upload/avatar` | 上传头像 | 🔒   |

---

## 6. 中间件设计

| 中间件         | 用途                                                  |
| -------------- | ----------------------------------------------------- |
| `auth`         | JWT Token 校验，解析用户信息注入 `req.user`           |
| `errorHandler` | 统一错误处理，返回 `{ code, message, errors }`        |
| `rateLimiter`  | 接口频率限制（登录/注册 5次/分钟，普通API 60次/分钟） |
| `validate`     | 包装 express-validator 校验结果，不通过直接返回 400   |
| `optionalAuth` | 可选认证（未登录也可访问，但登录后注入 req.user）     |

---

## 7. 前端设计要点

### 7.1 路由守卫

- 未登录用户访问发帖/个人中心等页面 → 重定向到登录页
- 已登录用户访问登录/注册页 → 重定向到首页

### 7.2 Axios 拦截器

- **请求拦截**: 自动附带 `Authorization: Bearer <token>`
- **响应拦截**:
  - 401 → 清除 Token，跳转登录页
  - 网络错误 → 统一 Toast 提示

### 7.3 状态管理（Pinia）

- `useAuthStore`: 用户登录状态、Token、用户信息
- `usePostStore`: 帖子列表缓存、当前帖子

---

## 8. 项目结构

```
ai-coding/
├── client/                    # 前端项目
│   ├── src/
│   │   ├── api/              # API 请求封装（axios 实例 + 各模块请求函数）
│   │   ├── components/       # 公共组件（PostCard、CommentItem、UserAvatar...）
│   │   ├── views/            # 页面视图
│   │   │   ├── Home.vue
│   │   │   ├── Login.vue
│   │   │   ├── Register.vue
│   │   │   ├── PostDetail.vue
│   │   │   ├── PostCreate.vue
│   │   │   ├── PostEdit.vue
│   │   │   ├── UserProfile.vue
│   │   │   └── UserSettings.vue
│   │   ├── router/           # 路由配置（含路由守卫）
│   │   ├── stores/           # Pinia 状态管理
│   │   ├── utils/            # 工具函数
│   │   └── App.vue
│   └── package.json
│
├── server/                    # 后端项目
│   ├── config/
│   │   └── index.js          # 环境变量统一管理（dotenv）
│   ├── controllers/          # 控制器（auth、user、post、comment、upload）
│   ├── models/               # Mongoose 数据模型
│   ├── routes/               # 路由定义
│   ├── middleware/            # 中间件（auth、errorHandler、rateLimiter、validate）
│   ├── utils/                # 工具函数（token生成、密码加密）
│   └── index.js              # 入口文件
│
├── uploads/                   # 上传文件存储目录（头像等）
├── .env.example              # 环境变量模板
├── .gitignore
└── package.json              # 根配置（npm workspaces）
```

---

## 9. 开发阶段

### 阶段一：基础架构（1-2天）

- 初始化前后端项目（Vite + Express）
- 配置环境变量（.env）、MongoDB 连接
- 搭建中间件体系（auth、errorHandler、rateLimiter、validate）
- 前端路由骨架 + Axios 拦截器

### 阶段二：用户系统（2-3天）

- User 模型 + 注册/登录接口（含输入验证）
- JWT 认证中间件 + GET /auth/me
- 用户资料编辑 + 头像上传（multer）
- 前端：登录/注册页 + Pinia authStore + 路由守卫
- **本阶段写完接口测试**

### 阶段三：帖子系统（3-4天）

- Post 模型 + CRUD 接口（含作者权限校验）
- 帖子列表分页、排序、搜索
- 标签筛选功能
- 前端：首页帖子流 + 帖子详情页 + 发帖/编辑页
- **本阶段写完接口测试**

### 阶段四：互动功能（2-3天）

- Like、Collect 模型 + 点赞/收藏接口（toggle 模式）
- Comment 模型 + 评论列表/发表/删除接口
- Follow 模型 + 关注/粉丝接口
- 前端：帖子详情页接入互动功能、用户主页关注按钮
- **本阶段写完接口测试**

### 阶段五：前端界面完善（3-4天）

- 首页热门推荐聚合
- Element Plus 组件统一风格
- 响应式适配（移动端基本可用）
- 加载态、空态、错误态处理

### 阶段六：联调与部署（1-2天）✅ 已完成

- 生产模式：后端 serve 前端静态文件
- 一键构建 + 启动脚本
- 部署文档
- 最终回归测试（59 个单元测试 + 35 个验收测试通过）

---

## 10. 环境变量设计

```bash
# .env.example
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ai-coding
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE=2097152          # 2MB
```

---

## 11. 后续可扩展功能

- 通知系统（点赞/评论/关注触发通知）
- 帖子置顶/精华
- Markdown 编辑器 + 代码高亮
- OAuth 第三方登录（GitHub）
- 后台管理系统
- 数据统计面板
- 全文搜索升级（Elasticsearch）

---

## 12. 总结

这是一个典型的社区论坛系统，采用前后端分离架构，适合学习全栈开发。项目难度适中，涵盖了用户认证、CRUD 操作、社交互动等核心功能。

相比初版，主要改进点：

- **数据模型**: 点赞/收藏/关注拆分为独立集合，避免文档膨胀
- **安全性**: 引入输入验证、频率限制、统一错误处理中间件
- **API 设计**: 添加版本前缀 `/api/v1`，明确认证标注、文件上传接口
- **前端架构**: 明确路由守卫、Axios 拦截器、状态管理职责
- **测试策略**: 测试贯穿每个开发阶段，不放到最后
- **环境管理**: 统一 .env 配置，消除硬编码

建议严格按照阶段顺序推进，每做完一个阶段验证所有接口后再进入下一阶段。

---

## 13. 部署指南

### 13.1 环境要求

- **Node.js** >= 20.x
- **MongoDB** >= 7.x（本地运行或使用 MongoDB Atlas）
- **Git Bash**（Windows 推荐，支持 Unix 风格环境变量）

### 13.2 快速启动（开发模式）

```bash
# 1. 启动 MongoDB
& "D:/mongodb-win32-x86_64-windows-8.3.1/bin/mongod.exe" --dbpath "D:/mongodb-win32-x86_64-windows-8.3.1/data"

# 2. 安装依赖（首次）
npm run setup

# 3. 配置环境变量
cp server/.env.example server/.env
# 编辑 server/.env，至少修改 JWT_SECRET 为随机字符串

# 4. 启动后端（端口 3000）
npm run dev:server

# 5. 启动前端（端口 5173，新开终端）
npm run dev:client
```

浏览器访问 `http://localhost:5173`

### 13.3 生产部署

```bash
# 1. 安装依赖 + 构建前端
npm run setup
npm run build

# 2. 启动生产模式（后端 serve 前端静态文件）
cd server
NODE_ENV=production node index.js

# 或使用根目录脚本
npm run deploy
```

生产模式下：

- 后端同时 serve 前端静态文件（`client/dist/`）
- 所有非 `/api/v1` 路径返回 `index.html`（SPA 路由回退）
- 错误详情不再暴露给客户端
- 浏览器访问 `http://localhost:3000`

### 13.4 环境变量参考

| 变量             | 说明               | 默认值                                |
| ---------------- | ------------------ | ------------------------------------- |
| `PORT`           | 后端端口           | `3000`                                |
| `MONGODB_URI`    | MongoDB 连接串     | `mongodb://localhost:27017/ai-coding` |
| `JWT_SECRET`     | JWT 签名密钥       | `fallback-secret`（生产必须修改）     |
| `JWT_EXPIRES_IN` | Token 有效期       | `7d`                                  |
| `UPLOAD_DIR`     | 上传文件目录       | `uploads`（相对于 server/）           |
| `MAX_FILE_SIZE`  | 上传文件最大字节数 | `2097152`（2MB）                      |

### 13.5 常用命令

```bash
# 开发
npm run dev:server      # 后端开发模式（--watch 热重启）
npm run dev:client      # 前端开发模式（Vite HMR）

# 构建
npm run build           # 构建前端到 client/dist/

# 生产
npm run deploy          # 构建前端 + 启动生产服务

# 测试
cd server && npm test   # 后端 59 个接口测试
```

### 13.6 Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 上传文件
    location /uploads/ {
        alias /path/to/ai-coding/server/uploads/;
    }

    # API 和前端都代理到 Node
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 13.7 PM2 进程守护（可选）

```bash
npm install -g pm2
cd server
pm2 start index.js --name ai-coding --env production
pm2 save
pm2 startup   # 设置开机自启
```
