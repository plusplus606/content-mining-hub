import { LlmRuntimeConfig } from '@/types';

function readNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getLlmRuntimeConfig(): LlmRuntimeConfig {
  return {
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',
    baseURL: process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: readNumber(process.env.LLM_TEMPERATURE, 0.6),
    maxTokens: readNumber(process.env.LLM_MAX_TOKENS, 4096),
  };
}

export function hasLlmApiKey(config = getLlmRuntimeConfig()): boolean {
  return Boolean(config.apiKey && config.apiKey !== 'sk-empty');
}
