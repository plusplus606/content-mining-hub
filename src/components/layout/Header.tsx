'use client';

import { Search, Bell, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-14 border-b border-[var(--border-color)] bg-[var(--surface)] flex items-center justify-between px-6 flex-shrink-0">
      {/* 搜索框 */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            type="text"
            placeholder="搜索文档、文件夹..."
            className="w-full bg-transparent border border-[var(--border-color)] rounded-md pl-10 pr-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--muted)] transition-colors"
            id="search-input"
          />
        </div>
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-2">
        <button
          className="btn-ghost !p-2 relative"
          aria-label="通知"
          id="btn-notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#6366f1] rounded-full" />
        </button>
        <button
          className="btn-ghost !p-2"
          aria-label="设置"
          id="btn-settings"
        >
          <Settings size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#3f3f3f] flex items-center justify-center text-white text-xs font-semibold ml-2 cursor-pointer" id="user-avatar">
          J
        </div>
      </div>
    </header>
  );
}
