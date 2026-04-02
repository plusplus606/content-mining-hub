'use client';

import { ChevronRight, ChevronDown } from 'lucide-react';
import { Folder } from '@/types';
import { useFileStore } from '@/store/useFileStore';
import { getFolderIcon } from '@/components/ui/Icons';

interface FolderNodeProps {
  folder: Folder;
  depth?: number;
}

export default function FolderNode({ folder, depth = 0 }: FolderNodeProps) {
  const { selectedFolderId, expandedFolderIds, selectFolder, toggleFolder } =
    useFileStore();

  const isSelected = selectedFolderId === folder.id;
  const isExpanded = expandedFolderIds.has(folder.id);
  const hasChildren = folder.children.length > 0;

  const handleClick = () => {
    selectFolder(folder.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFolder(folder.id);
  };

  const IconComponent = getFolderIcon(folder.icon);

  return (
    <div>
      <div
        className={`folder-node ${isSelected ? 'active' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={isSelected}
        id={`folder-${folder.id}`}
      >
        {/* 展开/收起指示器 — 独立点击区域 */}
        <span
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
          onClick={hasChildren ? handleToggle : undefined}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} className="text-[var(--muted)]" />
            ) : (
              <ChevronRight size={14} className="text-[var(--muted)]" />
            )
          ) : (
            <span className="w-[14px]" />
          )}
        </span>

        {/* 文件夹图标 */}
        <IconComponent
          size={16}
          className={isSelected ? 'text-[#a5b4fc]' : 'text-[var(--muted)]'}
        />

        {/* 文件夹名称 */}
        <span className="truncate flex-1">{folder.name}</span>
      </div>

      {/* 子文件夹 */}
      {hasChildren && (
        <div
          className={`folder-children ${isExpanded ? 'expanded' : 'collapsed'}`}
        >
          {folder.children.map((child) => (
            <FolderNode key={child.id} folder={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
