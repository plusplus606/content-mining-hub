import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-empty',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

// 技能包根目录
const SKILLS_BASE_DIR = path.join(process.cwd(), 'src', 'data', 'skills');

// ============================================
// 工具定义 — 供 LLM 调用读取技能文件
// ============================================
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_skill_dir',
      description: '列出技能包目录下的所有文件和子目录。用于了解技能包的完整结构。',
      parameters: {
        type: 'object',
        properties: {
          relative_path: {
            type: 'string',
            description: '相对于技能包根目录的路径。用 "." 表示根目录，例如 "templates" 表示 templates 子目录。',
          },
        },
        required: ['relative_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_skill_file',
      description: '读取技能包中某个文件的完整内容。支持 .md 文件。',
      parameters: {
        type: 'object',
        properties: {
          relative_path: {
            type: 'string',
            description: '相对于技能包根目录的文件路径，例如 "SKILL.md"、"workflow.md"、"templates/customer-intelligence-template.md"',
          },
        },
        required: ['relative_path'],
      },
    },
  },
];

// ============================================
// 工具执行器
// ============================================
function executeToolCall(skillDir: string, toolName: string, args: Record<string, string>): string {
  const baseDir = path.join(SKILLS_BASE_DIR, skillDir);

  // 安全检查：确保路径不会跳出技能包目录
  const resolvedBase = path.resolve(baseDir);

  if (toolName === 'list_skill_dir') {
    const targetDir = path.resolve(baseDir, args.relative_path || '.');
    if (!targetDir.startsWith(resolvedBase)) {
      return '错误：无法访问技能包目录之外的路径。';
    }
    try {
      const entries = fs.readdirSync(targetDir, { withFileTypes: true });
      const result = entries
        .filter(e => !e.name.startsWith('.'))
        .map(e => `${e.isDirectory() ? '📁' : '📄'} ${e.name}`)
        .join('\n');
      return `目录 "${args.relative_path}" 的内容：\n${result}`;
    } catch {
      return `错误：无法读取目录 "${args.relative_path}"。`;
    }
  }

  if (toolName === 'read_skill_file') {
    const targetFile = path.resolve(baseDir, args.relative_path);
    if (!targetFile.startsWith(resolvedBase)) {
      return '错误：无法访问技能包目录之外的文件。';
    }
    try {
      const content = fs.readFileSync(targetFile, 'utf-8');
      return content;
    } catch {
      return `错误：无法读取文件 "${args.relative_path}"。`;
    }
  }

  return `错误：未知工具 "${toolName}"。`;
}

// ============================================
// Agent 系统提示
// ============================================
function buildSystemPrompt(skillDir: string): string {
  return `你是一个专业的 AI 内容萃取代理（Agent）。你的任务是使用指定的技能包（Skill）来分析用户提供的文档内容，并输出结构化的萃取结果。

## 你的工作方式

1. **首先**，使用 \`list_skill_dir\` 工具了解技能包的完整文件结构
2. **然后**，使用 \`read_skill_file\` 工具逐步阅读核心文件：
   - 先读 \`SKILL.md\` — 了解技能的定位、目标和使用方式
   - 再读 \`workflow.md\` — 了解详细的工作流程
   - 接着读 \`templates/\` 目录下的模板 — 了解输出格式要求
   - 如果有 \`examples/\` 中的案例，可以选择性参考
   - 如果有 \`lessons.md\`，也要阅读以避免已知的陷阱
3. **最后**，严格按照技能包中定义的工作流程和模板，对用户提供的文档内容进行萃取

## 当前技能包路径
\`${skillDir}\`

## 要求
- 你必须先充分了解技能包的所有文件后，再开始萃取
- 萃取时必须严格遵循技能包中定义的工作流程和输出模板
- 输出必须是结构化的 Markdown 格式
- 禁止编造或捏造不存在的信息
- 对文档中的原文引用要准确`;
}

// ============================================
// API 路由 — Agent Loop
// ============================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, skillDir, promptTemplate, modelConfig } = body;

    if (!content) {
      return NextResponse.json(
        { error: '缺少必要参数: content' },
        { status: 400 }
      );
    }

    // ---- 兼容旧版简单模式 ----
    if (!skillDir && promptTemplate) {
      const finalPrompt = promptTemplate.replace('{{content}}', content);

      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-empty') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return NextResponse.json({
          result: `> ⚠️ **注意**: 未检测到 \`OPENAI_API_KEY\`，当前为模拟萃取结果。\n\n- **文档长度**: ${content.length} 字符\n- **使用模型**: ${modelConfig?.model || 'Qwen3-Max'}`,
        });
      }

      const response = await openai.chat.completions.create({
        model: modelConfig?.model || 'Qwen3-Max',
        messages: [{ role: 'system', content: finalPrompt }],
        temperature: modelConfig?.temperature || 0.5,
        max_tokens: modelConfig?.maxTokens || 1000,
      });

      return NextResponse.json({ result: response.choices[0]?.message?.content || '' });
    }

    // ---- Agent 模式：使用 skillDir 进行多步骤萃取 ----
    if (!skillDir) {
      return NextResponse.json(
        { error: '缺少必要参数: skillDir 或 promptTemplate' },
        { status: 400 }
      );
    }

    // 验证技能包目录存在
    const skillPath = path.join(SKILLS_BASE_DIR, skillDir);
    if (!fs.existsSync(skillPath)) {
      return NextResponse.json(
        { error: `技能包目录不存在: ${skillDir}` },
        { status: 404 }
      );
    }

    // 模拟模式（无 API Key）
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-empty') {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 列出技能包文件供展示
      const files = fs.readdirSync(skillPath, { recursive: true }) as string[];
      const fileList = files.map(f => `  - ${f}`).join('\n');

      return NextResponse.json({
        result: `> ⚠️ **注意**: 未检测到 \`OPENAI_API_KEY\`，以下为 Agent 模式模拟结果。\n\n## 技能包信息\n- **技能包**: ${skillDir}\n- **文档长度**: ${content.length} 字符\n- **使用模型**: ${modelConfig?.model || 'Qwen3-Max'}\n\n## 技能包文件结构\n${fileList}\n\n## 说明\n在 Agent 模式下，LLM 会自动按需读取技能包中的文件（SKILL.md → workflow.md → templates → examples），完整理解技能后再对您的文档进行萃取。\n\n请在 \`.env.local\` 中配置 \`OPENAI_API_KEY\` 以体验完整的 Agent 萃取流程。`,
      });
    }

    // ---- 真实 Agent Loop ----
    const systemPrompt = buildSystemPrompt(skillDir);
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请使用技能包对以下文档内容进行萃取分析：\n\n---\n\n${content}` },
    ];

    const MAX_ITERATIONS = 15;  // 安全上限，防止无限循环
    let iteration = 0;

    while (iteration < MAX_ITERATIONS) {
      iteration++;
      console.log(`[Agent Loop] 第 ${iteration} 轮对话...`);

      const response = await openai.chat.completions.create({
        model: modelConfig?.model || 'Qwen3-Max',
        messages,
        tools,
        tool_choice: iteration <= 2 ? 'auto' : 'auto',  // 始终允许调用工具
        temperature: modelConfig?.temperature || 0.5,
        max_tokens: modelConfig?.maxTokens || 4000,
      });

      const assistantMessage = response.choices[0]?.message;
      if (!assistantMessage) break;

      // 将 assistant 消息追加到上下文
      messages.push(assistantMessage);

      // 检查是否有工具调用
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // 执行每个工具调用
        for (const toolCall of assistantMessage.tool_calls) {
          // 仅处理 function 类型的工具调用
          if (toolCall.type !== 'function') continue;
          const funcCall = toolCall as { id: string; type: 'function'; function: { name: string; arguments: string } };
          const args = JSON.parse(funcCall.function.arguments);
          console.log(`[Agent Loop] 调用工具: ${funcCall.function.name}(${JSON.stringify(args)})`);

          const toolResult = executeToolCall(skillDir, funcCall.function.name, args);

          // 将工具结果追加到上下文
          messages.push({
            role: 'tool',
            tool_call_id: funcCall.id,
            content: toolResult,
          });
        }
      } else {
        // 没有工具调用 — Agent 已完成萃取，返回最终结果
        console.log(`[Agent Loop] 萃取完成，共 ${iteration} 轮对话。`);
        return NextResponse.json({
          result: assistantMessage.content || '',
        });
      }
    }

    // 安全兜底：超出最大轮次
    const lastAssistant = messages.filter(m => m.role === 'assistant').pop();
    return NextResponse.json({
      result: (lastAssistant && 'content' in lastAssistant ? lastAssistant.content : '') || 
        '> ⚠️ Agent 循环已达到最大轮次限制。请检查技能包配置。',
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('LLM Agent 萃取错误:', errorMessage);
    return NextResponse.json(
      { error: errorMessage || '执行 Agent 萃取时发生错误' },
      { status: 500 }
    );
  }
}
