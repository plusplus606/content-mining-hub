import { NextResponse } from 'next/server';
import { runHostAgent } from '@/agents/host-agent/runtime';
import { ChatMessage } from '@/types';

export const maxDuration = 300; // Allow maximum 5 minutes for edge/serverless functions

type ChatRequestBody = {
  chatId: string;
  messages: ChatMessage[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;

    if (!body.chatId) {
      return NextResponse.json({ error: '缺少 chatId' }, { status: 400 });
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: '缺少 messages' }, { status: 400 });
    }

    const generator = runHostAgent({ messages: body.messages });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'));
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : '未知错误';
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', content: errMsg }) + '\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ error: message }, { status: 500 });  }
}
