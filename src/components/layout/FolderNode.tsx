'use client';

import { ChevronRight, ChevronDown, MoreHorizontal, Share, Pencil, Trash2 } from 'lucide-react';
import { Folder } from '@/types';
import { useFileStore } from '@/store/useFileStore';
import { getFolderIcon } from '@/components/ui/Icons';
import { useClickOutside } from '@/hooks/useClickOutside';
import { usePathname, useRouter } from 'next/navigation';
import { createElement, useState, useRef } from 'react';

interface FolderNodeProps {
  folder: Folder;
  depth?: number;
}

export default function FolderNode({ folder, depth = 0 }: FolderNodeProps) {
  const { selectedFolderId, expandedFolderIds, selectFolder, toggleFolder } =
    useFileStore();
  const pathname = usePathname();
  const router = useRouter();
  const isSkillsPage = pathname?.startsWith('/skills');

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedFolderId === folder.id && !isSkillsPage;
  const isExpanded = expandedFolderIds.has(folder.id);
  const hasChildren = folder.children.length > 0;
  const isSpaceItem = depth === 0; // 顶级文件夹统一视为顶级项目条，不再因页面切换改变大小

  useClickOutside([menuRef], () => setMenuOpen(false), { active: menuOpen });

  const handleClick = () => {
    selectFolder(folder.id);
    if (pathname !== '/') {
      router.push('/');
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFolder(folder.id);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  return (
    <div>
      <div
        className={`folder-node group relative ${isSelected ? 'active' : ''} ${isSpaceItem ? 'space-item' : ''}`}
        style={{ paddingLeft: isSpaceItem ? '12px' : `${12 + depth * 16}px` }}
        onClick={handleClick}
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-selected={isSelected}
        id={`folder-${folder.id}`}
      >
        {/* 展开/收起指示器 */}
        {!isSpaceItem ? (
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
        ) : (
          <div className="w-1" />
        )}

        {/* 文件夹图标 */}
        <div className={`p-1 rounded-md flex items-center justify-center`}>
          {createElement(getFolderIcon(folder.icon), {
            size: isSpaceItem ? 18 : 16,
            className: isSelected ? 'text-[var(--accent)]' : 'text-[var(--muted)]',
          })}
        </div>

        {/* 文件夹名称 */}
        <span className={`truncate flex-1 ${isSpaceItem ? 'text-sm font-medium ml-1' : 'ml-0'}`}>
          {folder.name}
        </span>

        {/* 右侧操作菜单按钮 */}
        {isSpaceItem && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuClick}
              className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${menuOpen ? 'opacity-100 bg-gray-200/50' : 'hover:bg-gray-200/50'}`}
            >
              <MoreHorizontal size={14} className="text-[var(--muted)] hover:text-[var(--foreground)]" />
            </button>
            
            {/* 弹出菜单 */}
            {menuOpen && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <div className="py-1 flex flex-col items-start min-w-[120px]">
                  <button 
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                  >
                    <Share size={14} /> 分享
                  </button>
                  <button 
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                  >
                    <Pencil size={14} /> 重命名项目
                  </button>
                  <div className="h-px bg-gray-100 w-full my-1" />
                  <button 
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                  >
                    <Trash2 size={14} /> 删除项目
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
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
