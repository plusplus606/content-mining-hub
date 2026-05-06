'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import SkillManager from '@/components/space/SkillManager';
import CreatorProfile from '@/components/space/CreatorProfile';
import FileList from '@/components/files/FileList';
import DocumentChatModal from '@/components/files/DocumentChatModal';
import { Sparkles } from 'lucide-react';

type TabType = 'skills' | 'profile' | 'files';

function SkillsPageContent() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'skills';
  const isFilesTab = activeTab === 'files';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--background)]">
        <Header />
        

        {/* 动态内容区 */}
        <main className={isFilesTab ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto px-8 pb-10'}>
          <div className={`${isFilesTab ? 'h-full flex flex-col' : 'animate-fade-in-up mt-4 h-full flex flex-col'}`}>
            {activeTab === 'skills' && <SkillManager />}
            {activeTab === 'profile' && <CreatorProfile />}
            {activeTab === 'files' && <FileList allFiles={true} />}
          </div>
        </main>
      </div>

      {/* 文档查阅弹窗 */}
      <DocumentChatModal />
    </div>
  );
}

export default function SkillsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SkillsPageContent />
    </Suspense>
  );
}
