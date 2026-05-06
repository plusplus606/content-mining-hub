# Course Creation Workbench | 成课工作台

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)

**Course Creation Workbench (课程知识萃取平台)** 是一个专为房地产经纪领域设计的智能化课程内容挖掘与创作平台。它通过搭载流式对话 Agent (Streaming Chat Agent)，能够像真实的“课程顾问”一样，引导用户将脑海中碎片化的业务经验、零散案例和想法，逐步整理、收敛并沉淀为结构化、可落地的成课知识底稿。

---

## 🌟 核心特性

- 🤖 **智能流式对话 (Streaming Agent)**：内置底层重构的异步生成器 Runtime，支持实时的类似打字机效果的流式输出与思维链 (Traces) 展示，提供极致顺畅的 AI 交互体验。
- 🛠️ **领域专属知识萃取引擎**：基于精心设计的 `Course Knowledge Extractor` 技能模型，专注于房地产经纪场景（买卖、租赁、装修等）。通过多轮对话，收敛课程主题，挖掘关键动作与流程，识别信息缺口，拒绝空泛概念。
- 📄 **灵活的文档沉淀与管理**：支持从多次对话记录中提取情报和知识点。对话自动留存，提供清晰的历史对话切换与多维度素材管理能力。
- 🌈 **现代化的交互体验**：采用 Tailwind CSS 4.0 和 Zustand，配合精致的微交互逻辑，提供丝滑、响应迅速的 Web 体验。

---

## 🛠️ 技术架构

本项目采用了当前最新的 Web 开发前沿技术栈：

- **框架**: [Next.js 15 (App Router)](https://nextjs.org/)
- **核心库**: [React 19](https://react.dev/)
- **样式方案**: [Tailwind CSS 4.0](https://tailwindcss.com/)
- **状态管理**: [Zustand 5](https://github.com/pmndrs/zustand)
- **图标库**: [Lucide React](https://lucide.dev/)
- **AI 驱动层**: 自研的 Agent Runtime (支持 OpenAI 兼容格式 / 多模型切换，支持工具调用与流式追踪)

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
在项目根目录创建 `.env.local` 文件。平台内置大模型服务请求能力，请在其中填入您对应的 LLM API 密钥（可配置 Qwen、OpenAI 等兼容 Endpoint）：
```env
# 核心大模型配置
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.6
LLM_MAX_TOKENS=2000

# 兼容旧配置（可选）
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 4. 启动开发服务器
```bash
npm run dev
```
启动后，请打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可体验。

---

## 📁 目录结构

随着流式对话重构，最新架构如下：

```text
src/
├── app/                  # Next.js App Router 页面与 API 路由
│   ├── api/chat/         # 流式对话后端接口与流控
│   ├── chat/             # 智能对话核心视图
│   └── skills/           # 技能配置展示
├── agents/               # ⚡ 智能体运行时（核心）
│   └── host-agent/       # 包含系统提示词、工具声明与异步生成器 Runtime
├── components/           # UI 组件库
│   ├── chat/             # ChatWindow、流式打字机效果等交互组件
│   ├── files/            # 文件与历史对话管理侧边栏
│   ├── layout/           # 页面框架与导航布局
│   └── ui/               # 原子级基础 UI 控件
├── data/skills/          # 📝 核心技能提示词（如 Course Knowledge Extractor）
├── lib/                  # 基础能力（LLM Client, Fetcher 等）
├── store/                # Zustand 状态中心（ChatStore, FileStore 等）
└── types/                # TypeScript 类型声明
```

---

## 🤝 贡献与反馈

如果您有任何针对业务场景的 Prompt 优化建议、遇到 Bug，或者发现了任何体验问题，欢迎提交 [Issue](https://github.com/plusplus606/content-mining-hub/issues) 或是通过 Pull Request 贡献代码！

---

## 📄 开源协议

本项目基于 MIT 协议开源。
