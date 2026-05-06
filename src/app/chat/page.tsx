'use client';

import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { MessageSquarePlus } from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useRouter } from 'next/navigation';

export default function ChatIndexPage() {
  const openConversation = useFileStore((state) => state.openConversation);
  const router = useRouter();

  const handleNewChat = () => {
    openConversation();
    router.push('/');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--background)]">
        <Header />
        <main className="flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-[rgba(0,0,0,0.08)] mb-6">
              <MessageSquarePlus size={32} className="text-[#da7756] opacity-80" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              开启智能对话
            </h2>
            <p className="text-[15px] text-[var(--muted)] max-w-[360px] mx-auto mb-8 leading-relaxed">
              在这里可以向 课程顾问 提问、整理课程素材，或对已上传的文档进行深度分析。
            </p>
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111] text-white text-[15px] font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all outline-none"
            >
              <MessageSquarePlus size={18} />
              发起新对话
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
