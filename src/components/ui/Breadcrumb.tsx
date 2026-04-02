'use client';

import { ChevronRight, Home } from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';

export default function Breadcrumb() {
  const { getBreadcrumbs, selectFolder } = useFileStore();
  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="breadcrumb" aria-label="面包屑导航" id="breadcrumb-nav">
      <span
        className="breadcrumb-item flex items-center gap-1"
        onClick={() => useFileStore.setState({ selectedFolderId: null })}
      >
        <Home size={14} />
      </span>
      {breadcrumbs.map((item, index) => (
        <span key={item.id} className="flex items-center gap-1">
          <ChevronRight size={12} className="breadcrumb-separator" />
          <span
            className={`breadcrumb-item ${
              index === breadcrumbs.length - 1
                ? 'text-[var(--foreground)] font-medium'
                : ''
            }`}
            onClick={() => selectFolder(item.id)}
          >
            {item.name}
          </span>
        </span>
      ))}
    </nav>
  );
}
