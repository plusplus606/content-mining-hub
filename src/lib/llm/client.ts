import OpenAI from 'openai';
import { getLlmRuntimeConfig } from './config';

export function createLlmClient() {
  const config = getLlmRuntimeConfig();
  return new OpenAI({
    apiKey: config.apiKey || 'sk-empty',
    baseURL: config.baseURL,
    maxRetries: 3,       // Auto retry 3 times on network failures
  });
}
