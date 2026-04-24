# myTags - 个人成分标签分享平台

一个帮助年轻人展示"自己是什么成分"的工具。创建个人标签页面，分享给新朋友，让他们快速了解你。

## 功能特性

- **多标签页面管理**：创建多个独立页面展示不同面的自己
- **层级分类系统**：支持多级分类（2-3层），方便组织标签
- **置信度滑块**：每个标签可设置 -20%~120% 的置信度
- **拖拽排序**：标签和分类都支持拖拽移动和排序
- **导航链接**：标签可附加外部链接
- **分享链接**：可设置时效性（永久/24h/7天/30天/自定义）
- **选择性分享**：可选择只显示部分分类/标签
- **Neo-Brutalist 设计风格**：大胆的边框、厚重的阴影、温暖的配色

## 技术栈

- **前端**: React 18 + TypeScript + Vite 5 + Tailwind CSS v3 + Zustand + @dnd-kit
- **后端**: Node.js + Express + TypeScript + Prisma ORM
- **数据库**: MySQL 8.0

## 快速开始

### 前置条件

- Node.js 18+
- MySQL 8.0+

### 1. 配置数据库

创建 MySQL 数据库：

```sql
CREATE DATABASE mytags CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

然后修改 `backend/.env` 中的数据库连接：

```
DATABASE_URL="mysql://root:你的密码@localhost:3306/mytags"
```

### 2. 初始化后端

```bash
cd backend
npm install
npx prisma db push    # 创建数据库表
npm run dev           # 启动后端 (http://localhost:3001)
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev           # 启动前端 (http://localhost:5173)
```

## 项目结构

```
myTags/
├── frontend/          # 前端 (React + TypeScript)
│   └── src/
│       ├── api/       # API 调用层
│       ├── components/ # UI 组件
│       ├── pages/      # 页面组件
│       ├── stores/     # Zustand 状态管理
│       └── types/      # TypeScript 类型
├── backend/           # 后端 (Node.js + Express)
│   └── src/
│       ├── routes/    # API 路由
│       ├── middleware/ # 中间件
│       └── utils/     # 工具函数
├── deploy/            # 部署相关文件
│   ├── server-setup.sh # 服务器初始化脚本
│   └── nginx.conf      # Nginx 配置
├── .github/workflows/  # GitHub Actions 自动部署
├── SPEC.md             # 设计规范文档
└── README.md
```

## 部署到阿里云

### 前置条件

- 阿里云服务器（已安装 Node.js、MySQL、PM2、Nginx）
- GitHub 账号（用于配置 Actions Secrets）

### 1. 服务器端初始化（首次）

SSH 登录服务器后执行：

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE mytags CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 拉取项目（仅首次，之后由 CI 自动部署）
git clone https://github.com/你的用户名/myTags.git /root/mytags

# 初始化目录
mkdir -p /var/www/mytags
mkdir -p /root/mytags-backend

# 配置后端 .env
cat > /root/mytags-backend/.env << 'EOF'
DATABASE_URL="mysql://用户名:密码@localhost:3306/mytags"
JWT_SECRET="你的随机密钥（至少32字符）"
PORT=3001
EOF

# 安装后端依赖
cd /root/mytags-backend
npm install
npx prisma generate
npx prisma db push   # 创建数据库表

# 配置 PM2
pm2 start dist/index.js --name mytags_backend
pm2 save

# 配置 Nginx（参考 deploy/nginx.conf）
```

### 2. 配置 GitHub Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：

| Secret 名称 | 说明 |
|---|---|
| `SERVER_IP` | 阿里云服务器 IP |
| `SERVER_SSH_USER` | SSH 用户名（如 `root`） |
| `SERVER_SSH_KEY` | SSH 私钥（使用部署密钥的私钥） |
| `SERVER_WEB_ROOT` | 前端目录（如 `/var/www/mytags`） |
| `SERVER_BACKEND_DIR` | 后端目录（如 `/root/mytags-backend`） |

### 3. 配置 GitHub Actions 部署密钥

1. 在服务器上生成部署密钥对：
   ```bash
   ssh-keygen -t ed25519 -f /root/.ssh/deploy_key -N ""
   ```
2. 将公钥添加到 `~/.ssh/authorized_keys`
3. 将私钥内容粘贴到 GitHub Secret `SERVER_SSH_KEY`

### 4. 推送代码触发部署

```bash
git add .
git commit -m "feat: initial deployment setup"
git push origin main
```

推送后，GitHub Actions 会自动：
1. 构建前端（生产环境）
2. 通过 SCP 将前端 dist 文件上传到服务器
3. 通过 SSH 重启后端 PM2 服务

### 手动部署（不通过 GitHub Actions）

如果暂时不用 CI，可以手动上传文件后 SSH 执行：

```bash
# 服务器上
cd /root/mytags-backend
npm install --production
npx prisma generate
pm2 restart mytags_backend
```

## API 文档

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 页面管理
- `GET /api/pages` - 获取所有页面
- `POST /api/pages` - 创建页面
- `PUT /api/pages/:id` - 更新页面
- `DELETE /api/pages/:id` - 删除页面

### 分类管理
- `POST /api/categories` - 创建分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类
- `PUT /api/categories/reorder` - 批量排序

### 标签管理
- `POST /api/tags` - 创建标签
- `PUT /api/tags/:id` - 更新标签
- `DELETE /api/tags/:id` - 删除标签
- `PUT /api/tags/reorder` - 批量排序

### 分享
- `POST /api/shares` - 创建分享链接
- `GET /api/shares` - 获取分享列表
- `DELETE /api/shares/:id` - 删除分享

### 公开访问
- `GET /api/public/share/:code` - 通过分享码访问
