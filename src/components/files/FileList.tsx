'use client';

import {
  LayoutGrid,
  List,
  ArrowUpDown,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import Breadcrumb from '@/components/ui/Breadcrumb';
import FileCard from './FileCard';
import { SortBy } from '@/types';
import BatchActionBar from './BatchActionBar';
import { useState } from 'react';
import ConsolidatedExtractModal from './ConsolidatedExtractModal';

export default function FileList() {
  const {
    selectedFolderId,
    viewMode,
    sortBy,
    getCurrentDocuments,
    setViewMode,
    setSortBy,
    toggleSortOrder,
    selectedDocumentIds,
  } = useFileStore();

  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);

  const documents = getCurrentDocuments();

  // 未选中文件夹 — 欢迎页
  if (!selectedFolderId) {
    return (
      <div className="flex-1 flex items-center justify-center animate-fade-in-up">
        <div className="empty-state">
          <div className="w-20 h-20 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mb-4">
            <Sparkles size={32} className="text-[#da7756]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#1a1a1a] font-serif">
            内容萃取平台
          </h2>
          <p className="text-sm text-[var(--muted)] max-w-md">
            从左侧选择一个文件夹开始浏览文档，或上传新的文件进行 AI 萃取。
          </p>
          <div className="flex gap-4 mt-6">
            <div className="glass-card !rounded-lg px-6 py-4 text-center min-w-[100px]">
              <p className="text-2xl font-medium text-[#2c2c2c] font-serif">5</p>
              <p className="text-xs text-[var(--muted)] mt-1 font-medium tracking-wide">总文档</p>
            </div>
            <div className="glass-card !rounded-lg px-6 py-4 text-center min-w-[100px]">
              <p className="text-2xl font-medium text-[#2c2c2c] font-serif">2</p>
              <p className="text-xs text-[var(--muted)] mt-1 font-medium tracking-wide">工作区</p>
            </div>
            <div className="glass-card !rounded-lg px-6 py-4 text-center min-w-[100px]">
              <p className="text-2xl font-medium text-[#da7756] font-serif">0</p>
              <p className="text-xs text-[var(--muted)] mt-1 font-medium tracking-wide">萃取结果</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'name', label: '名称' },
    { value: 'date', label: '日期' },
    { value: 'size', label: '大小' },
  ];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden animate-fade-in-up">
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <Breadcrumb />

        <div className="flex items-center gap-2">
          {/* 排序选项 */}
          <div className="flex items-center gap-1 mr-2">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                className={`btn-ghost !text-xs !px-2 !py-1 ${
                  sortBy === opt.value ? 'active' : ''
                }`}
                onClick={() => setSortBy(opt.value)}
                id={`sort-${opt.value}`}
              >
                {opt.label}
              </button>
            ))}
            <button
              className="btn-ghost !p-1.5"
              onClick={toggleSortOrder}
              aria-label="切换排序顺序"
              id="toggle-sort-order"
            >
              <ArrowUpDown size={14} />
            </button>
          </div>

          {/* 视图切换 */}
          <div className="flex items-center border border-[var(--border-color)] rounded-lg overflow-hidden">
            <button
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#f0f0f0] text-[#1a1a1a]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
              onClick={() => setViewMode('grid')}
              aria-label="网格视图"
              id="view-grid"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#f0f0f0] text-[#1a1a1a]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
              onClick={() => setViewMode('list')}
              aria-label="列表视图"
              id="view-list"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 文件列表 */}
      {documents.length === 0 ? (
        <div className="empty-state flex-1">
          <div className="empty-state-icon">
            <FolderOpen size={32} />
          </div>
          <h3 className="text-lg font-medium text-[var(--foreground)]">
            文件夹为空
          </h3>
          <p className="text-sm">上传文件到此文件夹开始使用</p>
        </div>
      ) : (
        <div
          className={`animate-stagger overflow-y-auto flex-1 ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max'
              : 'flex flex-col gap-2'
          }`}
        >
          {documents.map((doc) => (
            <FileCard key={doc.id} document={doc} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* 批量操作工具栏 */}
      {selectedDocumentIds.size > 0 && (
        <BatchActionBar onStartExtract={() => setIsExtractModalOpen(true)} />
      )}

      {/* 合并萃取弹窗 */}
      {isExtractModalOpen && (
        <ConsolidatedExtractModal onClose={() => setIsExtractModalOpen(false)} />
      )}
    </div>
  );
}
