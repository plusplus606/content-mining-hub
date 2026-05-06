import OpenAI from 'openai';
import { createLlmClient } from '@/lib/llm/client';
import { getLlmRuntimeConfig, hasLlmApiKey } from '@/lib/llm/config';
import { ChatMessage } from '@/types';
import { buildHostAgentSystemPrompt } from './systemPrompt';
import { executeHostTool, hostTools } from './tools';

type AgentRunInput = {
  messages: ChatMessage[];
};

type AgentRunOutput = {
  reply: string;
  traces: string[];
};

const MAX_ITERATIONS = 6;

function toOpenAiMessages(
  systemPrompt: string,
  history: ChatMessage[]
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
  ];

  for (const message of history) {
    if (message.role === 'user' || message.role === 'assistant' || message.role === 'system') {
      messages.push({ role: message.role, content: message.content });
    }
  }

  return messages;
}

function buildMockReply(lastUserMessage: string): string {
  return `已收到你的问题：\n\n${lastUserMessage}\n\n当前是 课程顾问 接入模式（模拟回复）。请在 .env.local 配置 LLM_API_KEY/OPENAI_API_KEY 后使用真实模型对话。`;
}

function safeParseToolArgs(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function summarizeToolTrace(
  toolName: string,
  args: Record<string, unknown>,
  rawResult: string
): string[] {
  const traces: string[] = [];
  if (toolName === 'get_skills_catalog') {
    traces.push('调用工具: get_skills_catalog（获取技能目录）');
    return traces;
  }

  if (toolName === 'get_skill_content') {
    const requested = typeof args.skillName === 'string' ? args.skillName : 'unknown';
    traces.push(`调用工具: get_skill_content（请求 skill: ${requested}）`);
    try {
      const parsed = JSON.parse(rawResult) as { skill?: { name?: string }; error?: string; content?: string };
      if (parsed?.error) {
        traces.push(`读取 skill 失败: ${parsed.error}`);
      } else if (parsed?.skill?.name) {
        const contentLength = typeof parsed.content === 'string' ? parsed.content.length : 0;
        traces.push(`已读取 skill: ${parsed.skill.name}（${contentLength} 字符）`);
      }
    } catch {
      traces.push('读取 skill: 返回结果不可解析');
    }
    return traces;
  }

  traces.push(`调用工具: ${toolName}`);
  return traces;
}

export async function* runHostAgent(input: AgentRunInput): AsyncGenerator<{ type: 'trace' | 'chunk' | 'error', content: string }, void, unknown> {
  const config = getLlmRuntimeConfig();
  const systemPrompt = buildHostAgentSystemPrompt();

  const lastUserMessage = [...input.messages].reverse().find((item) => item.role === 'user')?.content || '';
  if (!hasLlmApiKey(config)) {
    yield { type: 'trace', content: '未检测到 LLM_API_KEY/OPENAI_API_KEY，当前为模拟回复模式' };
    yield { type: 'chunk', content: buildMockReply(lastUserMessage) };
    return;
  }

  const client = createLlmClient();
  const messages = toOpenAiMessages(systemPrompt, input.messages);

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let completion;
    try {
      completion = await client.chat.completions.create({
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        tools: hostTools,
        messages,
        stream: true,
      });
    } catch (error: any) {
      yield { type: 'trace', content: `调用大模型接口发生异常: ${error?.message || '未知错误'}` };
      yield {
        type: 'chunk',
        content: `\n\n> ⚠️ **注意**: API 调用似乎遇到了一些问题 (如: 401 Unauthorized)。\n\n**当前 fallback 到了本地测试模式**。\n你刚刚发送的消息是：\n\n${lastUserMessage}`,
      };
      return;
    }

    let currentContent = '';
    const toolCallsMap: Record<number, { id: string; type: 'function'; function: { name: string; arguments: string } }> = {};

    for await (const chunk of completion) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        currentContent += delta.content;
        yield { type: 'chunk', content: delta.content };
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCallsMap[tc.index]) {
            toolCallsMap[tc.index] = {
              id: tc.id || '',
              type: 'function',
              function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' },
            };
          } else {
            if (tc.function?.name) toolCallsMap[tc.index].function.name += tc.function.name;
            if (tc.function?.arguments) toolCallsMap[tc.index].function.arguments += tc.function.arguments;
          }
        }
      }
    }

    const toolCallsArr = Object.values(toolCallsMap);

    if (toolCallsArr.length === 0) {
      break;
    }

    messages.push({
      role: 'assistant',
      content: currentContent || null,
      tool_calls: toolCallsArr,
    });

    for (const toolCall of toolCallsArr) {
      const args = safeParseToolArgs(toolCall.function.arguments);
      const result = executeHostTool(toolCall.function.name, args);
      
      const subTraces = summarizeToolTrace(toolCall.function.name, args, result);
      for (const t of subTraces) {
        yield { type: 'trace', content: t };
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }
}
