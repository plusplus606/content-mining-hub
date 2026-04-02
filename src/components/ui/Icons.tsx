'use client';

import {
  Library,
  ClipboardList,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Calendar,
  Sparkles,
  Folder,
  FileText,
  FileJson,
  FileSpreadsheet,
  File,
  type LucideIcon,
} from 'lucide-react';

const folderIconMap: Record<string, LucideIcon> = {
  library: Library,
  'clipboard-list': ClipboardList,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  'message-square': MessageSquare,
  calendar: Calendar,
  sparkles: Sparkles,
};

export function getFolderIcon(iconName?: string): LucideIcon {
  if (iconName && folderIconMap[iconName]) {
    return folderIconMap[iconName];
  }
  return Folder;
}

const fileIconMap: Record<string, { icon: LucideIcon; className: string }> = {
  pdf: { icon: FileText, className: 'file-icon-pdf' },
  markdown: { icon: FileText, className: 'file-icon-markdown' },
  docx: { icon: FileText, className: 'file-icon-docx' },
  txt: { icon: File, className: 'file-icon-txt' },
  json: { icon: FileJson, className: 'file-icon-json' },
  xlsx: { icon: FileSpreadsheet, className: 'file-icon-xlsx' },
};

export function getFileIcon(fileType: string): {
  icon: LucideIcon;
  className: string;
} {
  return fileIconMap[fileType] || { icon: File, className: 'file-icon-txt' };
}

export function getFileTypeLabel(fileType: string): string {
  const labels: Record<string, string> = {
    pdf: 'PDF',
    markdown: 'Markdown',
    docx: 'Word',
    txt: '文本',
    json: 'JSON',
    xlsx: 'Excel',
  };
  return labels[fileType] || fileType.toUpperCase();
}
