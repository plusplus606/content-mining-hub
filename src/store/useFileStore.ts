import { create } from 'zustand';
import { Folder, ViewMode, SortBy, SortOrder, Document, FileType } from '@/types';
import {
  mockFolders,
  mockDocuments,
  getBreadcrumbPath,
} from '@/data/mockData';

// 递归查找文件夹
function findFolderInTree(folders: Folder[], id: string): Folder | undefined {
  for (const folder of folders) {
    if (folder.id === id) return folder;
    const found = findFolderInTree(folder.children, id);
    if (found) return found;
  }
  return undefined;
}

// 深拷贝文件夹树（确保不可变更新）
function deepCloneFolders(folders: Folder[]): Folder[] {
  return folders.map((f) => ({
    ...f,
    children: deepCloneFolders(f.children),
  }));
}

interface FileStore {
  // 数据
  folders: Folder[];
  documents: Document[];

  // 文件夹状态
  selectedFolderId: string | null;
  expandedFolderIds: Set<string>;

  // 文件列表状态
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;

  // 侧边栏
  sidebarCollapsed: boolean;

  // 选择状态
  selectedDocumentIds: Set<string>;

  // 计算属性方法
  getCurrentDocuments: () => Document[];
  getBreadcrumbs: () => { id: string; name: string }[];
  getSelectedFolderName: () => string;

  // 操作方法
  selectFolder: (folderId: string) => void;
  toggleFolder: (folderId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sortBy: SortBy) => void;
  toggleSortOrder: () => void;
  toggleSidebar: () => void;
  toggleDocumentSelection: (id: string) => void;
  clearSelection: () => void;

  // 数据变更
  addFolder: (name: string, parentId: string | null) => void;
  addDocument: (doc: Document) => void;
}

export const useFileStore = create<FileStore>((set, get) => ({
  // 初始数据从 mock 加载
  folders: deepCloneFolders(mockFolders),
  documents: [...mockDocuments],

  // 初始状态
  selectedFolderId: null,
  expandedFolderIds: new Set<string>(),
  viewMode: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',
  sidebarCollapsed: false,
  selectedDocumentIds: new Set<string>(),

  // 获取当前文件夹下的文档
  getCurrentDocuments: () => {
    const { selectedFolderId, documents, sortBy, sortOrder } = get();
    if (!selectedFolderId) return [];
    const docs = documents.filter((d) => d.folderId === selectedFolderId);
    return sortDocuments(docs, sortBy, sortOrder);
  },

  // 获取面包屑路径
  getBreadcrumbs: () => {
    const { selectedFolderId, folders } = get();
    if (!selectedFolderId) return [];
    return getBreadcrumbPath(folders, selectedFolderId);
  },

  // 获取当前选中文件夹名称
  getSelectedFolderName: () => {
    const { selectedFolderId, folders } = get();
    if (!selectedFolderId) return '根目录';
    const folder = findFolderInTree(folders, selectedFolderId);
    return folder?.name ?? '根目录';
  },

  // 选中文件夹
  selectFolder: (folderId: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolderIds);
      newExpanded.add(folderId);
      return {
        selectedFolderId: folderId,
        expandedFolderIds: newExpanded,
      };
    });
  },

  // 展开/收起文件夹
  toggleFolder: (folderId: string) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFolderIds);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return { expandedFolderIds: newExpanded };
    });
  },

  setViewMode: (mode: ViewMode) => set({ viewMode: mode }),
  setSortBy: (sortBy: SortBy) => set({ sortBy }),
  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
    })),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  toggleDocumentSelection: (id: string) => {
    set((state) => {
      const newSelected = new Set(state.selectedDocumentIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selectedDocumentIds: newSelected };
    });
  },

  clearSelection: () => set({ selectedDocumentIds: new Set() }),

  // 新建文件夹
  addFolder: (name: string, parentId: string | null) => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      parentId,
      children: [],
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const newFolders = deepCloneFolders(state.folders);

      if (parentId) {
        // 添加到父文件夹的 children 中
        const parent = findFolderInTree(newFolders, parentId);
        if (parent) {
          parent.children.push(newFolder);
        }
      } else {
        // 添加到根级别
        newFolders.push(newFolder);
      }

      // 自动展开父文件夹并选中新文件夹
      const newExpanded = new Set(state.expandedFolderIds);
      if (parentId) newExpanded.add(parentId);
      newExpanded.add(newFolder.id);

      return {
        folders: newFolders,
        expandedFolderIds: newExpanded,
        selectedFolderId: newFolder.id,
      };
    });
  },

  // 添加文档
  addDocument: (doc: Document) => {
    set((state) => ({
      documents: [...state.documents, doc],
    }));
  },
}));

// 文件扩展名 → FileType 映射
export function getFileTypeFromName(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, FileType> = {
    pdf: 'pdf',
    md: 'markdown',
    markdown: 'markdown',
    docx: 'docx',
    doc: 'docx',
    txt: 'txt',
    json: 'json',
    xlsx: 'xlsx',
    xls: 'xlsx',
    csv: 'xlsx',
  };
  return map[ext] || 'txt';
}

// 排序辅助函数
function sortDocuments(
  docs: Document[],
  sortBy: SortBy,
  sortOrder: SortOrder
): Document[] {
  const sorted = [...docs].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name, 'zh-CN');
      case 'date':
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      case 'size':
        return a.size - b.size;
      default:
        return 0;
    }
  });
  return sortOrder === 'desc' ? sorted.reverse() : sorted;
}
