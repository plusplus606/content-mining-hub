'use client';

import { useFileStore } from '@/store/useFileStore';
import FolderNode from './FolderNode';

import { FolderPlus } from 'lucide-react';

export default function FolderTree() {
  const folders = useFileStore((s) => s.folders);

  return (
    <nav className="py-0" role="tree" aria-label="文件夹导航">
      {folders.map((folder) => (
        <FolderNode key={folder.id} folder={folder} />
      ))}
    </nav>
  );
}
