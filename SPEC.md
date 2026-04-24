# myTags - 个人成分标签分享平台

## 1. Concept & Vision

**myTags** 是一个让年轻人轻松展示"自己是什么成分"的工具。在认识新朋友时，一个精心整理的标签页面比长篇自我介绍更能快速传达个人特质。它不是简历，不是社交媒体的千篇一律人设，而是一个可以随时增减、随时分享的真实自我缩影——带着幽默感，带着置信度，让了解一个人变得既高效又有趣。

视觉感受：**Neo-Brutalist meets Warm Personal** — 粗犷的几何边框搭配柔和的色彩过渡，用大胆的色块和微妙的阴影营造出"有个性但不冷漠"的氛围。每个标签都是一块立体的小积木，置信度滑块像音量旋钮一样带有机械感的反馈。

## 2. Design Language

### 2.1 Aesthetic Direction
**Neo-Brutalist Personal** — 受包豪斯几何美学和当代卡片式 UI 的双重影响。突出网格系统和结构感，但通过圆润的边角和温暖的配色柔化。标签卡片有明显的边框厚度（3D 积木感），但整体排版透气。

### 2.2 Color Palette
```
--bg-primary:       #F5F0EB    // 暖米色背景（像一张好纸）
--bg-secondary:    #EDE7DD    // 卡片背景
--bg-card:          #FFFFFF    // 纯白标签卡片
--text-primary:     #1A1614    // 深棕黑
--text-secondary:   #6B635A    // 次要文字
--accent-primary:   #FF6B35    // 活力橙（主要交互）
--accent-secondary: #4ECDC4    // 薄荷绿（次要/积极标签）
--accent-tertiary:  #9B5DE5    // 薰衣草紫（特殊标签）
--accent-warn:      #F7A072    // 柔和珊瑚
--border-strong:    #1A1614    // 强边框（3D效果用）
--border-light:     #D4CEC6    // 轻边框
--confidence-high:  #22C55E    // 高置信度 (>80%)
--confidence-mid:   #EAB308    // 中置信度 (40-80%)
--confidence-low:   #94A3B8    // 低置信度 (<40%)
```

### 2.3 Typography
- **Headings**: `"Space Grotesk"` — 几何感强，现代有个性
- **Body/UI**: `"Noto Sans SC"` — 中英文都清晰舒适
- **Mono/Tags**: `"JetBrains Mono"` — 标签和数值显示
- **Fallbacks**: `system-ui, sans-serif`

### 2.4 Spatial System
- Base unit: 4px
- Card padding: 16px
- Section gap: 32px
- Page max-width: 1200px
- Tag card border-radius: 12px
- Category border-radius: 16px
- Border thickness for 3D effect: 2-3px

### 2.5 Motion Philosophy
- **Tag cards**: 拖拽时有轻微的倾斜（rotate）和放大（scale 1.02），放下时有弹性回弹
- **Confidence slider**: 拖动时数值实时变化，释放时有轻微的弹跳效果
- **Category expand/collapse**: 平滑高度动画 300ms ease-out
- **Page transitions**: 淡入淡出 200ms
- **Add tag**: 新标签从上方滑入，带 scale 动画
- **Hover states**: 轻微上浮 translateY(-2px) + 阴影加深

### 2.6 Visual Assets
- **Icons**: Lucide React（统一线条风格）
- **No images needed** — 纯 UI 驱动
- **Decorative**: 分类层级用缩进线和展开箭头表达层级关系

## 3. Layout & Structure

### 3.1 整体页面结构

```
┌─────────────────────────────────────────────┐
│  Header: Logo + 用户菜单 + 新建页面          │
├─────────────────────────────────────────────┤
│  Sidebar (240px)    │  Main Content Area     │
│  ┌───────────────┐  │  ┌──────────────────┐  │
│  │ 我的页面列表   │  │  │ 页面标题 + 编辑   │  │
│  │ - 社交自我     │  │  │                  │  │
│  │ - 运动达人     │  │  │ [快速添加标签框]  │  │
│  │ - 工作能力     │  │  │                  │  │
│  │ + 新建页面     │  │  │ ▼ 社交标签        │  │
│  └───────────────┘  │  │   ├─ 社恐  [===|] │  │
│                     │  │   ├─ 内向  [==|~]  │  │
│                     │  │   └─ 话痨  [=~~~]  │  │
│                     │  │                      │  │
│                     │  │ ▼ 个人爱好          │  │
│                     │  │   ├─ 羽毛球  [===]  │  │
│                     │  │   └─ ...            │  │
│                     │  └──────────────────┘  │
└─────────────────────────────────────────────┘
```

### 3.2 分类层级结构

支持无限层级（通常 2-3 层）:
```
▼ 社交属性 (一级分类)
  ▼ 内向/外向 (二级分类)
    ├─ 社恐 [滑块]
    ├─ 话痨 [滑块]
    └─ ...
  ▼ 社交场景 (二级分类)
    ├─ ...
▶ 兴趣标签 (一级分类)
▶ 工作能力 (一级分类)
```

- 每个分类可以展开/折叠
- 分类之间可以拖拽排序
- 标签在分类内可以拖拽排序
- 标签可以跨分类拖拽移动

### 3.3 分享页面（公开视图）

```
┌─────────────────────────────────────────────┐
│  👤 用户名 的成分页面           [分享者头像] │
│  "这是一个轻松的我" ← 用户自定义的页面描述    │
├─────────────────────────────────────────────┤
│  ▶ 社交属性                                 │
│    社恐 ████████░░ 80%                      │
│    慢热 ██████████ 95%                      │
│  ▶ 兴趣标签                                 │
│    羽毛球 █████████░ 90%                    │
└─────────────────────────────────────────────┘
```

### 3.4 Responsive Strategy
- Desktop (>1024px): 侧边栏 + 主内容区双栏
- Tablet (768-1024px): 可折叠侧边栏
- Mobile (<768px): 底部 Tab 导航，侧边栏变底部抽屉

## 4. Features & Interactions

### 4.1 用户系统
- **注册/登录**: 支持邮箱+密码注册登录
- **会话**: JWT Token，存储在 localStorage，7天有效期
- **用户资料**: 头像（默认生成）、昵称

### 4.2 标签页面管理
- **创建页面**: 点击"+"创建新页面，设置页面名称（社交自我/工作能力等）
- **编辑页面**: 修改页面名称、描述
- **删除页面**: 确认弹窗
- **页面切换**: 侧边栏点击切换
- **页面间导航**: 每个页面顶部可快速跳转到其他页面

### 4.3 标签管理
- **快速添加**: 顶部输入框，输入标签名 → 选择分类 → 按回车添加
- **置信度设置**: 每个标签右侧有滑块，范围 -20% ~ 120%
  - 滑块颜色动态变化：<40% 灰色，40-80% 黄色，>80% 绿色
  - 可以直接输入数值
- **编辑标签**: 点击标签名进入编辑模式
- **删除标签**: 悬停显示删除按钮
- **批量操作**: 选中多个标签进行移动/删除

### 4.4 分类层级管理
- **创建分类**: 点击"+"按钮在当前层级创建新分类
- **重命名分类**: 双击分类名称
- **删除分类**: 分类为空时可直接删除；非空时提示是否同时删除子标签
- **拖拽排序**: 分类可拖拽调整顺序
- **拖拽移动**: 标签可以拖到不同分类中
- **展开/折叠**: 分类可展开显示子分类和标签

### 4.5 导航链接
- 标签可以附加一个导航链接
- 点击标签时打开链接（新窗口）
- 链接可以是：
  - 自己的另一个页面（内部导航）
  - 别人的页面
  - 任意外部 URL
- 无需分类存储 URL 类型，统一存储 URL 字符串

### 4.6 分享链接
- **创建分享**: 点击"分享"按钮
- **时效设置**:
  - 永久有效
  - 24小时
  - 7天
  - 30天
  - 自定义日期时间
- **可见范围设置**:
  - 显示全部标签
  - 只显示选定的分类/标签（勾选界面）
  - 勾选哪些分类/标签，就只展示那些
- **分享码**: 生成唯一短码，格式 `?share=xxxxxx`
- **复制链接**: 一键复制到剪贴板
- **查看分享历史**: 显示已创建的分享链接列表及状态
- **撤销分享**: 删除某个分享链接

### 4.7 公开访问（无需登录）
- 访问 `/:username` 或分享链接 `?share=xxx` 无需登录
- 公开页面只读，不可编辑
- 分享内容受分享设置的时效和可见范围限制

## 5. Component Inventory

### 5.1 TagCard
标签卡片组件，状态：
- **Default**: 白底卡片，3D边框，标签名 + 置信度滑块
- **Hover**: 轻微上浮，阴影加深，显示操作按钮（编辑/删除/链接图标）
- **Editing**: 标签名变为输入框，置信度滑块激活
- **Dragging**: 倾斜3度，透明度0.8，scale 1.02，阴影加深
- **Selected**: 橙色边框高亮（批量选择模式）
- **With Link**: 右上角显示链接图标，hover时显示URL预览

### 5.2 ConfidenceSlider
置信度滑块组件：
- **Track**: 圆角条形，颜色根据值动态变化
- **Thumb**: 圆形把手，hover时放大
- **Value Display**: 滑块右侧实时显示百分比
- **Input**: 也可以直接点击数值区域输入
- **Range**: -20 到 120，中间 0% 有特殊标记

### 5.3 CategoryNode
分类节点组件：
- **Collapsed**: 显示分类名 + 子项数量 + 展开箭头
- **Expanded**: 显示所有子分类和标签
- **Drag Handle**: 左侧拖拽手柄
- **Hover**: 显示操作按钮（添加子分类/添加标签/删除）
- **Editing**: 名称变为输入框
- **Drop Target**: 拖拽标签到上方时高亮显示可放置位置

### 5.4 QuickAddInput
快速添加标签输入框：
- **Default**: placeholder "今天又新增了什么成分？"
- **Focused**: 展开下拉，显示分类选择器
- **With Category Selected**: 显示选中的分类名
- **Submitting**: loading状态

### 5.5 ShareModal
分享设置弹窗：
- **时效选择**: 按钮组选择预设或自定义日期
- **可见范围选择**: 树形复选框勾选分类/标签
- **预览**: 显示分享后的页面效果缩略
- **生成**: 生成分享链接按钮
- **结果**: 显示分享链接，带复制按钮

### 5.6 PageSidebar
页面列表侧边栏：
- **Page Items**: 页面名称 + 标签数量
- **Active Page**: 橙色背景高亮
- **Hover**: 显示编辑/删除按钮
- **Add Button**: 底部"+"新建页面按钮

### 5.7 NavLinkBadge
导航链接徽章：
- 显示在标签卡片的右上角
- 点击展开URL预览
- hover时显示可点击提示

## 6. Technical Approach

### 6.1 前端技术栈
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit (支持拖拽排序和跨容器移动)
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod

### 6.2 后端技术栈
- **Runtime**: Node.js 20+
- **Framework**: Express.js + TypeScript
- **Database**: MySQL 8.0
- **ORM**: Prisma
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **Validation**: Zod
- **CORS**: cors middleware

### 6.3 数据库设计

```sql
-- 用户表
users:
  id          INT PRIMARY KEY AUTO_INCREMENT
  email       VARCHAR(255) UNIQUE NOT NULL
  password    VARCHAR(255) NOT NULL  -- bcrypt hash
  nickname    VARCHAR(100)
  avatar_seed VARCHAR(50)           -- 用于生成默认头像
  created_at  DATETIME DEFAULT NOW()
  updated_at  DATETIME ON UPDATE NOW()

-- 标签页面表
pages:
  id          INT PRIMARY KEY AUTO_INCREMENT
  user_id     INT NOT NULL
  name        VARCHAR(200) NOT NULL
  description VARCHAR(500)
  created_at  DATETIME DEFAULT NOW()
  updated_at  DATETIME ON UPDATE NOW()

-- 分类层级表（支持多级分类）
categories:
  id          INT PRIMARY KEY AUTO_INCREMENT
  page_id     INT NOT NULL
  parent_id   INT NULL              -- NULL 表示顶级分类
  name        VARCHAR(200) NOT NULL
  sort_order  INT DEFAULT 0
  created_at  DATETIME DEFAULT NOW()

-- 标签表
tags:
  id              INT PRIMARY KEY AUTO_INCREMENT
  page_id         INT NOT NULL
  category_id     INT NOT NULL
  name            VARCHAR(200) NOT NULL
  confidence      INT DEFAULT 50   -- -20 到 120
  nav_url         VARCHAR(500)     -- 导航链接（可为NULL）
  sort_order      INT DEFAULT 0
  created_at      DATETIME DEFAULT NOW()
  updated_at      DATETIME ON UPDATE NOW()

-- 分享链接表
shares:
  id            INT PRIMARY KEY AUTO_INCREMENT
  user_id       INT NOT NULL
  page_id       INT NOT NULL
  share_code    VARCHAR(50) UNIQUE NOT NULL
  expires_at    DATETIME NULL      -- NULL 表示永久
  visible_items JSON               -- 存储可见的分类/标签 ID 列表
  created_at    DATETIME DEFAULT NOW()
```

### 6.4 API 设计

#### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

#### 页面
- `GET /api/pages` - 获取用户所有页面
- `POST /api/pages` - 创建页面
- `PUT /api/pages/:id` - 更新页面
- `DELETE /api/pages/:id` - 删除页面

#### 分类
- `GET /api/pages/:pageId/categories` - 获取页面分类树
- `POST /api/pages/:pageId/categories` - 创建分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类
- `PUT /api/categories/reorder` - 批量更新排序

#### 标签
- `GET /api/pages/:pageId/tags` - 获取页面所有标签
- `POST /api/pages/:pageId/tags` - 创建标签
- `PUT /api/tags/:id` - 更新标签（包含置信度、导航链接）
- `DELETE /api/tags/:id` - 删除标签
- `PUT /api/tags/reorder` - 批量更新排序/分类

#### 分享
- `POST /api/pages/:pageId/share` - 创建分享链接
- `GET /api/share/:code` - 获取分享内容（公开，无需认证）
- `GET /api/shares` - 获取用户的分享列表
- `DELETE /api/shares/:id` - 删除分享链接

#### 公开访问
- `GET /api/public/user/:username` - 获取用户的公开页面列表
- `GET /api/public/page/:pageId` - 获取公开页面内容（受分享设置限制）

### 6.5 目录结构

```
myTags/
├── frontend/                 # 前端项目
│   ├── public/
│   ├── src/
│   │   ├── components/       # React 组件
│   │   │   ├── layout/       # 布局组件
│   │   │   ├── tag/          # 标签相关组件
│   │   │   ├── category/     # 分类相关组件
│   │   │   ├── share/        # 分享相关组件
│   │   │   ├── auth/         # 认证组件
│   │   │   └── ui/           # 通用 UI 组件
│   │   ├── pages/            # 页面组件
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── stores/           # Zustand stores
│   │   ├── api/              # API 调用层
│   │   ├── types/            # TypeScript 类型
│   │   ├── utils/            # 工具函数
│   │   └── styles/           # 全局样式
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── routes/           # 路由
│   │   ├── controllers/      # 控制器
│   │   ├── services/         # 业务逻辑
│   │   ├── middleware/       # 中间件
│   │   ├── prisma/           # Prisma schema
│   │   └── utils/            # 工具函数
│   └── package.json
│
├── SPEC.md
└── README.md
```
