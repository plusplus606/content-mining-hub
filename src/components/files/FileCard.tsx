'use client';

import Link from 'next/link';
import { Document } from '@/types';
import { getFileIcon, getFileTypeLabel } from '@/components/ui/Icons';
import { useFileStore } from '@/store/useFileStore';
import { Check } from 'lucide-react';

interface FileCardProps {
  document: Document;
  viewMode: 'grid' | 'list';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function FileCard({ document: doc, viewMode }: FileCardProps) {
  const { selectedDocumentIds, toggleDocumentSelection } = useFileStore();
  const isSelected = selectedDocumentIds.has(doc.id);
  const { icon: FileIcon, className: iconClass } = getFileIcon(doc.fileType);
  const typeLabel = getFileTypeLabel(doc.fileType);

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleDocumentSelection(doc.id);
  };

  if (viewMode === 'list') {
    return (
      <Link href={`/document/${doc.id}`} id={`file-card-${doc.id}`}>
        <div
          className={`file-card !rounded-lg !p-4 flex items-center gap-4 group relative ${
            isSelected ? 'active ring-1 ring-[#da7756]/30' : ''
          }`}
        >
          {/* 选择框 */}
          <div
            onClick={handleSelect}
            className={`flex-shrink-0 w-5 h-5 rounded border border-[var(--border-color)] flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-[#da7756] border-[#da7756] text-white'
                : 'bg-white group-hover:border-[#da7756]'
            }`}
          >
            {isSelected && <Check size={12} strokeWidth={3} />}
          </div>

          {/* 图标 */}
          <div className={`flex-shrink-0 ${iconClass}`}>
            <FileIcon size={22} />
          </div>

          {/* 文件信息 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">
              {doc.name}
            </p>
          </div>

          {/* 元数据 */}
          <span className="text-xs text-[var(--muted)] flex-shrink-0 w-16 text-right">
            {typeLabel}
          </span>
          <span className="text-xs text-[var(--muted)] flex-shrink-0 w-20 text-right">
            {formatFileSize(doc.size)}
          </span>
          <span className="text-xs text-[var(--muted)] flex-shrink-0 w-24 text-right">
            {formatDate(doc.updatedAt)}
          </span>
        </div>
      </Link>
    );
  }

  // Grid View
  return (
    <Link href={`/document/${doc.id}`} id={`file-card-${doc.id}`}>
      <div
        className={`file-card h-full flex flex-col group relative ${
          isSelected ? 'active ring-1 ring-[#da7756]/30' : ''
        }`}
      >
        {/* 选择框 */}
        <div
          onClick={handleSelect}
          className={`absolute top-3 left-3 z-10 w-5 h-5 rounded border border-[var(--border-color)] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
            isSelected
              ? 'bg-[#da7756] border-[#da7756] text-white opacity-100'
              : 'bg-white hover:border-[#da7756]'
          }`}
        >
          {isSelected && <Check size={12} strokeWidth={3} />}
        </div>

        {/* 文件类型色块 */}
        <div className="w-full h-24 rounded-md mb-4 flex items-center justify-center bg-[#f9f9f9] border border-black/5">
          <FileIcon size={36} className={iconClass} />
        </div>

        {/* 文件名 */}
        <h3 className="text-sm font-medium text-[var(--foreground)] truncate mb-2">
          {doc.name}
        </h3>

        {/* 元信息 */}
        <div className="mt-auto flex items-center justify-between text-xs text-[var(--muted)]">
          <span className="px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[10px] font-medium">
            {typeLabel}
          </span>
          <span>{formatFileSize(doc.size)}</span>
        </div>

        <p className="text-[11px] text-[var(--muted)] mt-2">
          {formatDate(doc.updatedAt)}
        </p>
      </div>
    </Link>
  );
}
