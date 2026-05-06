const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

async function test() {
  console.log('API Key:', process.env.LLM_API_KEY || process.env.OPENAI_API_KEY);
  console.log('Base URL:', process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL);
  
  const client = new OpenAI({
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL,
  });

  try {
    const response = await client.chat.completions.create({
      model: process.env.LLM_MODEL || 'Qwen3-Max',
      messages: [{ role: 'user', content: 'hi' }],
    });
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Data:', error.response.data);
    }
  }
}

test();
