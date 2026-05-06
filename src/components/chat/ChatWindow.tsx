'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, SendHorizonal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '@/store/useChatStore';
import { useFileStore } from '@/store/useFileStore';

type ChatWindowProps = {
  chatId: string;
};

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [assistantTraces, setAssistantTraces] = useState<Record<string, string[]>>({});

  const conversation = useChatStore((state) => state.conversations[chatId]);
  const ensureConversation = useChatStore((state) => state.ensureConversation);
  const appendUserMessage = useChatStore((state) => state.appendUserMessage);
  const appendAssistantMessage = useChatStore((state) => state.appendAssistantMessage);
  const updateAssistantMessage = useChatStore((state) => state.updateAssistantMessage);
  const setConversationLoading = useChatStore((state) => state.setConversationLoading);
  const consumePendingInitialPrompt = useChatStore((state) => state.consumePendingInitialPrompt);

  const recentChats = useFileStore((state) => state.recentChats);
  const openConversation = useFileStore((state) => state.openConversation);
  const updateRecentChat = useFileStore((state) => state.updateRecentChat);

  const initialTitle = useMemo(() => {
    return recentChats.find((chat) => chat.id === chatId)?.title || '新对话';
  }, [chatId, recentChats]);

  useEffect(() => {
    ensureConversation(chatId, initialTitle);
    openConversation();
  }, [chatId, ensureConversation, initialTitle, openConversation]);

  const isConversationLoading = conversation?.loading ?? false;
  const canSubmit = input.trim().length > 0 && !isConversationLoading;

  const sendMessage = useCallback(async (rawContent: string) => {
    const content = rawContent.trim();
    if (!content || isConversationLoading) return;

    appendUserMessage(chatId, content);
    setConversationLoading(chatId, true);
    updateRecentChat(chatId, { lastMessage: content, updatedAt: new Date().toISOString() });

    try {
      const messageHistory = useChatStore.getState().conversations[chatId]?.messages || [];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          messages: messageHistory,
        }),
      });

      if (!response.ok) {
        let errorMsg = '对话失败';
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch {}
        throw new Error(errorMsg);
      }

      setConversationLoading(chatId, false);
      const assistantMessage = appendAssistantMessage(chatId, '');
      const messageId = assistantMessage.id;
      let currentReply = '';

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应流');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last segment in buffer as it might be incomplete
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const chunkData = JSON.parse(trimmed);
            if (chunkData.type === 'trace') {
              setAssistantTraces((state) => ({
                ...state,
                [messageId]: [...(state[messageId] || []), chunkData.content],
              }));
            } else if (chunkData.type === 'chunk') {
              currentReply += chunkData.content;
              updateAssistantMessage(chatId, messageId, currentReply);
            } else if (chunkData.type === 'error') {
              currentReply += `\n\n> ⚠️ [发生错误: ${chunkData.content}]`;
              updateAssistantMessage(chatId, messageId, currentReply);
            }
          } catch (e) {
            // ignore unparseable chunk
          }
        }
      }
      
      // Attempt to parse anything left in the buffer at the end
      if (buffer.trim()) {
        try {
          const chunkData = JSON.parse(buffer.trim());
          if (chunkData.type === 'chunk') {
            currentReply += chunkData.content;
            updateAssistantMessage(chatId, messageId, currentReply);
          }
        } catch (e) {
          // ignore
        }
      }

      updateRecentChat(chatId, {
        lastMessage: currentReply.slice(0, 120),
        updatedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      appendAssistantMessage(chatId, `处理失败：${message}`);
      setConversationLoading(chatId, false);
    }
  }, [appendAssistantMessage, appendUserMessage, chatId, isConversationLoading, setConversationLoading, updateAssistantMessage, updateRecentChat]);

  useEffect(() => {
    if (!conversation || isConversationLoading) return;
    const pendingPrompt = consumePendingInitialPrompt(chatId);
    if (!pendingPrompt) return;
    void sendMessage(pendingPrompt);
  }, [chatId, consumePendingInitialPrompt, conversation, isConversationLoading, sendMessage]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || isConversationLoading) return;
    setInput('');
    await sendMessage(content);
  };

  if (!conversation) {
    return <div className="flex-1 flex items-center justify-center text-sm text-[var(--muted)]">正在载入会话...</div>;
  }

  return (
    <div className="flex-1 min-h-0 relative">
      <div className="h-full overflow-y-auto px-6 pt-8 pb-56">
        {conversation.messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[980px] mx-auto mb-5 flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'user' ? (
              <div className="max-w-[760px] rounded-3xl border border-[rgba(0,0,0,0.06)] bg-[rgba(255,255,255,0.92)] px-5 py-3 text-[16px] leading-8 text-[var(--foreground)] whitespace-pre-wrap">
                {message.content}
              </div>
            ) : (
              <div className="w-full max-w-[860px] text-[17px] leading-8 text-[var(--foreground)]">
                {assistantTraces[message.id]?.length ? (
                  <div className="mb-3 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.7)] px-3 py-2">
                    <div className="text-[12px] leading-5 text-[var(--muted)]">Agent 动作</div>
                    <div className="mt-1 space-y-1">
                      {assistantTraces[message.id].map((trace, index) => (
                        <div key={`${message.id}-trace-${index}`} className="text-[13px] leading-5 text-[var(--muted)]">
                          {trace}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="chat-markdown">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="chat-markdown-link"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}

        {conversation.loading && (
          <div className="max-w-[980px] mx-auto mb-5 flex justify-start">
            <div className="inline-flex items-center gap-2 text-[15px] text-[var(--muted)]">
              <Loader2 size={16} className="animate-spin" />
              课程顾问 思考中...
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 px-6">
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto max-w-[980px] mx-auto rounded-[28px] border border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.94)] shadow-[0_16px_36px_rgba(0,0,0,0.12)] backdrop-blur-sm px-5 py-4 flex items-end gap-3"
        >
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="输入你的问题，发送给 课程顾问..."
            className="flex-1 min-h-[64px] max-h-[180px] resize-none bg-transparent px-1 py-1 text-[16px] leading-7 text-[var(--foreground)] outline-none placeholder:text-[#9b9b9b]"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-12 w-12 rounded-full bg-[#111] text-white disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center shrink-0"
            aria-label="发送"
          >
            {conversation.loading ? <Loader2 size={18} className="animate-spin" /> : <SendHorizonal size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
