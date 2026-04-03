# Content Mining Hub | 内容萃取平台

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)

**Content Mining Hub** 是一个智能化的文档管理与知识萃取平台。它不仅能帮助您有序地管理各类知识库文档，更能通过强大的 AI 能力（基于 OpenAI）将非结构化的文档内容快速转化为结构化的核心洞察与技能知识。

---

## 🌟 核心功能

- 📄 **智能化文档管理**：支持文件夹层级结构，轻松组织原始素材与萃取结果。
- ⚡ **多维度 AI 萃取**：预设多种“萃取技能”（Skills），支持从对话记录、技术文档中提取情报、知识点或汇总报告。
- 📦 **批量化处理**：一键并行处理多个文档，大幅提升内容加工效率。
- 🛠️ **技能引擎管理**：可自定义配置 Prompt 模板，针对不同业务场景定制专项萃取逻辑。
- 🌈 **极致 UI 体验**：采用现代化的响应式设计，基于精致的微交互逻辑。

---

## 🛠️ 技术栈

本项目采用了当前最前沿的 Web 开发技术栈：

- **框架**: [Next.js 15 (App Router)](https://nextjs.org/)
- **核心库**: [React 19](https://react.dev/)
- **样式方案**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **图标库**: [Lucide React](https://lucide.dev/)
- **AI 驱动**: OpenAI API / Compatible LLM Endpoints

---

## 🚀 快速启动

### 1. 克隆项目
```bash
git clone https://github.com/plusplus606/content-mining-hub.git
cd content-mining-hub
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
在项目根目录创建 `.env.local` 文件，并配置您的 OpenAI 密钥：
```env
OPENAI_API_KEY=your_api_key_here
NEXT_PUBLIC_API_URL=https://api.openai.com/v1
```

### 4. 启动开发服务器
```bash
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

---

## 📁 项目结构

```text
src/
├── app/                  # Next.js App Router 页面与 API 路由
│   ├── api/              # 后端 API 逻辑 (AI 萃取、文件处理)
│   ├── document/         # 文档详情展示页
│   └── skills/           # 技能配置中心
├── components/           # UI 组件库
│   ├── files/            # 文件管理相关组件
│   ├── layout/           # 布局组件
│   └── ui/               # 原子级 UI 组件
├── data/                 # 预设技能模板 (Prompt / Examples)
├── store/                # Zustand 状态源
└── types/                # TypeScript 类型定义
```

---

## 🤝 贡献与反馈

如果您有任何改进建议或发现了问题，欢迎提交 [Issue](https://github.com/plusplus606/content-mining-hub/issues) 或通过 Pull Request 贡献代码。

---

## 📄 开源协议

本项目基于 MIT 协议开源。
