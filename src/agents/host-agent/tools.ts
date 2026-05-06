import OpenAI from 'openai';
import { listSkillCatalog, loadSkillContentByName } from '@/lib/skills/catalog';

export const hostTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_skills_catalog',
      description: '获取当前本地已注册的 skills 列表与说明。',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_skill_content',
      description: '按 skill 名称读取对应 skill 的完整文本内容，用于按需执行。',
      parameters: {
        type: 'object',
        properties: {
          skillName: {
            type: 'string',
            description: 'skill 名称（可传全名或关键字）',
          },
        },
        required: ['skillName'],
      },
    },
  },
];

export function executeHostTool(toolName: string, args: Record<string, unknown> = {}): string {
  if (toolName === 'get_skills_catalog') {
    return JSON.stringify(listSkillCatalog(), null, 2);
  }

  if (toolName === 'get_skill_content') {
    const skillName = typeof args.skillName === 'string' ? args.skillName : '';
    const result = loadSkillContentByName(skillName);
    return JSON.stringify(result, null, 2);
  }

  return `Unknown tool: ${toolName}`;
}
