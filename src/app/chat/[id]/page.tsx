'use client';

import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const chatId = params.id;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--background)]">
        <Header />
        <main className="flex-1 min-h-0 flex">
          <ChatWindow chatId={chatId} />
        </main>
      </div>
    </div>
  );
}
