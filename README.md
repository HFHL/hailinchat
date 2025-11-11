# AI Chat App

一个简洁的AI聊天应用，支持多种AI模型，可以部署到Vercel。

## 功能特点

- 🚀 支持多种AI模型（Gemini 2.5 Flash, GPT-4 Turbo, Claude 4 Sonnet）
- 👥 简单的用户管理系统
- 💬 多对话会话管理
- 📱 移动端优化的响应式设计
- 🔄 实时聊天历史保存
- 🎨 淡雅的用户界面

## 部署步骤

### 1. 设置Supabase数据库

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在SQL编辑器中运行 `database.sql` 中的SQL语句
3. 获取项目URL和anon key

### 2. 部署到Vercel

1. Fork此项目到你的GitHub账户
2. 在 [Vercel](https://vercel.com) 导入项目
3. 设置环境变量：
   - `API_KEY`: 你的AI API密钥
   - `BASE_URL`: AI API的基础URL（如：https://api.openai.com/v1）
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase项目URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名密钥
4. 点击部署

### 3. 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，填入你的配置

# 启动开发服务器
npm run dev
```

## 技术栈

- **前端**: Next.js 14, React, TypeScript, Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **部署**: Vercel
- **AI集成**: OpenAI格式API

## 项目结构

```
├── app/
│   ├── api/chat/         # AI聊天API路由
│   ├── chat/            # 主聊天界面
│   ├── login/           # 用户选择界面
│   └── layout.tsx       # 根布局
├── lib/
│   ├── supabase.ts      # Supabase配置和类型
│   └── models.ts        # AI模型配置
├── database.sql         # 数据库表结构
└── ...
```

## 环境变量

创建 `.env` 文件并配置以下变量：

```env
API_KEY=your_api_key_here
BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```