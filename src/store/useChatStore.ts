import { create } from 'zustand';
import { ChatConversation, ChatMessage, ChatRole } from '@/types';
import { mockRecentChats } from '@/data/mockData';

function createMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function createConversation(id: string, title: string): ChatConversation {
  return {
    id,
    title,
    messages: [
      createMessage('assistant', '你好，我是 课程顾问。请告诉我你的课程目标、受众和素材现状。'),
    ],
    loading: false,
    updatedAt: new Date().toISOString(),
  };
}

interface ChatStore {
  conversations: Record<string, ChatConversation>;
  pendingInitialPrompts: Record<string, string>;
  ensureConversation: (chatId: string, title?: string) => ChatConversation;
  setPendingInitialPrompt: (chatId: string, prompt: string) => void;
  consumePendingInitialPrompt: (chatId: string) => string;
  appendUserMessage: (chatId: string, content: string) => ChatMessage;
  appendAssistantMessage: (chatId: string, content: string) => ChatMessage;
  updateAssistantMessage: (chatId: string, messageId: string, content: string) => void;
  setConversationLoading: (chatId: string, loading: boolean) => void;
}

const initialConversations: Record<string, ChatConversation> = Object.fromEntries(
  mockRecentChats.map((chat) => [chat.id, createConversation(chat.id, chat.title)])
);

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: initialConversations,
  pendingInitialPrompts: {},

  ensureConversation: (chatId: string, title = '新对话') => {
    const existing = get().conversations[chatId];
    if (existing) return existing;

    const conversation = createConversation(chatId, title);
    set((state) => ({
      conversations: {
        ...state.conversations,
        [chatId]: conversation,
      },
    }));
    return conversation;
  },

  setPendingInitialPrompt: (chatId: string, prompt: string) => {
    const normalizedPrompt = prompt.trim();
    if (!normalizedPrompt) return;
    set((state) => ({
      pendingInitialPrompts: {
        ...state.pendingInitialPrompts,
        [chatId]: normalizedPrompt,
      },
    }));
  },

  consumePendingInitialPrompt: (chatId: string) => {
    const prompt = get().pendingInitialPrompts[chatId] || '';
    if (!prompt) return '';
    set((state) => {
      const nextPending = { ...state.pendingInitialPrompts };
      delete nextPending[chatId];
      return { pendingInitialPrompts: nextPending };
    });
    return prompt;
  },

  appendUserMessage: (chatId: string, content: string) => {
    const message = createMessage('user', content);
    set((state) => {
      const current = state.conversations[chatId] || createConversation(chatId, '新对话');
      return {
        conversations: {
          ...state.conversations,
          [chatId]: {
            ...current,
            messages: [...current.messages, message],
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
    return message;
  },

  appendAssistantMessage: (chatId: string, content: string) => {
    const message = createMessage('assistant', content);
    set((state) => {
      const current = state.conversations[chatId] || createConversation(chatId, '新对话');
      return {
        conversations: {
          ...state.conversations,
          [chatId]: {
            ...current,
            messages: [...current.messages, message],
            loading: false,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
    return message;
  },

  updateAssistantMessage: (chatId: string, messageId: string, content: string) => {
    set((state) => {
      const current = state.conversations[chatId];
      if (!current) return state;

      return {
        conversations: {
          ...state.conversations,
          [chatId]: {
            ...current,
            messages: current.messages.map((msg) =>
              msg.id === messageId ? { ...msg, content } : msg
            ),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  },

  setConversationLoading: (chatId: string, loading: boolean) => {
    set((state) => {
      const current = state.conversations[chatId] || createConversation(chatId, '新对话');
      return {
        conversations: {
          ...state.conversations,
          [chatId]: {
            ...current,
            loading,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  },
}));
