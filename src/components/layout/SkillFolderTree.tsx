'use client';

import { useSkillStore } from '@/store/useSkillStore';
import SkillFolderNode from './SkillFolderNode';

export default function SkillFolderTree() {
  const folders = useSkillStore((s) => s.skillFolders);

  return (
    <nav className="py-2 space-y-0.5" role="tree" aria-label="技能库导航">
      {folders.map((folder) => (
        <SkillFolderNode key={folder.id} folder={folder} />
      ))}
    </nav>
  );
}
