'use client';

import { Sparkles, X, CheckSquare } from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';

interface BatchActionBarProps {
  onStartExtract: () => void;
}

export default function BatchActionBar({ onStartExtract }: BatchActionBarProps) {
  const { selectedDocumentIds, clearSelection } = useFileStore();
  const count = selectedDocumentIds.size;

  if (count === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="glass-card !bg-white/90 !backdrop-blur-xl border border-[#da7756]/20 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 min-w-[400px]">
        {/* 计数信息 */}
        <div className="flex items-center gap-3 pr-6 border-r border-black/5">
          <div className="w-10 h-10 rounded-xl bg-[#da7756]/10 flex items-center justify-center">
            <CheckSquare className="text-[#da7756]" size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a]">已选中 {count} 个文档</p>
            <p className="text-[11px] text-[var(--muted)]">将合并为一个结果进行萃取</p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={clearSelection}
            className="btn-ghost !text-xs !py-2 flex items-center gap-2"
          >
            <X size={14} />
            取消选择
          </button>
          
          <button
            onClick={onStartExtract}
            className="btn-primary !py-2.5 !px-6 flex items-center gap-2 shadow-lg shadow-[#da7756]/20"
          >
            <Sparkles size={16} />
            开始合并萃取
          </button>
        </div>
      </div>
    </div>
  );
}
