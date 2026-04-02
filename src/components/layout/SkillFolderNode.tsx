'use client';

import { ChevronRight, ChevronDown, Cpu } from 'lucide-react';
import { Folder } from '@/types';
import { useSkillStore } from '@/store/useSkillStore';
import { getFolderIcon } from '@/components/ui/Icons';
import { useRouter } from 'next/navigation';

interface SkillFolderNodeProps {
  folder: Folder;
  depth?: number;
}

export default function SkillFolderNode({ folder, depth = 0 }: SkillFolderNodeProps) {
  const router = useRouter();
  
  const { 
    selectedFolderId, 
    expandedFolderIds, 
    selectFolder, 
    toggleFolder,
    skills,
    selectedSkillId,
    selectSkill
  } = useSkillStore();

  const isSelected = selectedFolderId === folder.id;
  const isExpanded = expandedFolderIds.has(folder.id);
  
  // 属于当前文件夹的 Skill
  const folderSkills = skills.filter((s) => s.folderId === folder.id);
  
  const hasChildrenFolders = folder.children.length > 0;
  const hasItems = hasChildrenFolders || folderSkills.length > 0;

  const handleClick = () => {
    selectFolder(folder.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFolder(folder.id);
  };

  const handleSkillClick = (e: React.MouseEvent, skillId: string) => {
    e.stopPropagation();
    selectSkill(skillId);
    router.push('/skills');
  };

  const IconComponent = getFolderIcon(folder.icon);

  return (
    <div>
      <div
        className={`folder-node ${isSelected ? 'active' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
        role="treeitem"
        aria-expanded={hasItems ? isExpanded : undefined}
        aria-selected={isSelected}
        id={`skill-folder-${folder.id}`}
      >
        {/* 展开/收起指示器 */}
        <span
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
          onClick={hasItems ? handleToggle : undefined}
        >
          {hasItems ? (
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
          className={isSelected ? 'text-[#da7756]' : 'text-[var(--muted)]'}
        />

        {/* 文件夹名称 */}
        <span className="truncate flex-1 font-medium">{folder.name}</span>
      </div>

      {/* 展开的子级内容 */}
      {hasItems && (
        <div
          className={`folder-children ${isExpanded ? 'expanded' : 'collapsed'}`}
        >
          {/* 渲染子文件夹 */}
          {folder.children.map((child) => (
            <SkillFolderNode key={child.id} folder={child} depth={depth + 1} />
          ))}

          {/* 渲染本文件夹下的 Skill */}
          {folderSkills.map((skill) => (
            <div
              key={skill.id}
              className={`flex items-center gap-2.5 py-1.5 rounded-md cursor-pointer transition-colors mt-0.5 select-none ${
                selectedSkillId === skill.id
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
              }`}
              style={{ paddingLeft: `${36 + depth * 16}px`, paddingRight: '12px' }}
              onClick={(e) => handleSkillClick(e, skill.id)}
            >
              <Cpu
                size={14}
                className={
                  selectedSkillId === skill.id
                    ? 'text-white'
                    : 'text-[#da7756]'
                }
              />
              <span className="text-[13px] truncate flex-1">{skill.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
