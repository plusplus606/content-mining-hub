'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  FolderPlus,
  Upload,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  FileText,
  CheckCircle2,
  Database,
  Cpu,
  Plus,
} from 'lucide-react';
import FolderTree from './FolderTree';
import SkillFolderTree from './SkillFolderTree';
import { useFileStore, getFileTypeFromName } from '@/store/useFileStore';
import { useSkillStore } from '@/store/useSkillStore';
import { Document } from '@/types';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isSkillsPage = pathname?.startsWith('/skills');

  const {
    sidebarCollapsed,
    toggleSidebar,
    selectedFolderId: selectedFileFolderId,
    addFolder,
    addDocument,
    getSelectedFolderName,
    selectFolder,
  } = useFileStore();

  const { 
    skills, 
    selectedSkillId, 
    selectSkill, 
    addSkill,
    selectedFolderId: selectedSkillFolderId,
    getSelectedSkillFolderName,
    addSkillFolder,
  } = useSkillStore();

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<
    { file: File; content: string; status: 'reading' | 'ready' | 'done' }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parentFolderName = isSkillsPage ? getSelectedSkillFolderName() : getSelectedFolderName();

  // 处理新建文件夹
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    if (isSkillsPage) {
      addSkillFolder(newFolderName.trim(), selectedSkillFolderId);
    } else {
      addFolder(newFolderName.trim(), selectedFileFolderId);
    }
    setShowNewFolderModal(false);
    setNewFolderName('');
  };

  // 读取文件内容
  const readFileContent = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve((e.target?.result as string) ?? '');
      };
      reader.onerror = () => {
        resolve(`[无法读取文件: ${file.name}]`);
      };
      reader.readAsText(file);
    });
  }, []);

  // 处理文件选择
  const handleFilesSelected = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newEntries = fileArray.map((f) => ({
        file: f,
        content: '',
        status: 'reading' as const,
      }));
      setUploadedFiles((prev) => [...prev, ...newEntries]);

      // 逐个读取内容
      for (let i = 0; i < fileArray.length; i++) {
        const content = await readFileContent(fileArray[i]);
        setUploadedFiles((prev) =>
          prev.map((entry) =>
            entry.file === fileArray[i]
              ? { ...entry, content, status: 'ready' }
              : entry
          )
        );
      }
    },
    [readFileContent]
  );

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // 执行上传（添加到 store）
  const handleUpload = () => {
    const readyFiles = uploadedFiles.filter((f) => f.status === 'ready');
    if (readyFiles.length === 0) return;

    const targetFolderId = selectedFileFolderId || 'root-knowledge';

    readyFiles.forEach((entry) => {
      const nameWithoutExt = entry.file.name.replace(/\.[^/.]+$/, '');
      const newDoc: Document = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        folderId: targetFolderId,
        name: nameWithoutExt,
        fileType: getFileTypeFromName(entry.file.name),
        size: entry.file.size,
        content: entry.content,
        metadata: { uploadedAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addDocument(newDoc);
    });

    // 标记为完成
    setUploadedFiles((prev) =>
      prev.map((f) => (f.status === 'ready' ? { ...f, status: 'done' } : f))
    );

    // 自动选中目标文件夹
    selectFolder(targetFolderId);

    // 短暂显示完成状态后关闭
    setTimeout(() => {
      setShowUploadModal(false);
      setUploadedFiles([]);
    }, 800);
  };

  const readyCount = uploadedFiles.filter((f) => f.status === 'ready').length;
  const doneCount = uploadedFiles.filter((f) => f.status === 'done').length;

  return (
    <>
      <aside
        className={`sidebar flex flex-col h-full ${sidebarCollapsed ? 'collapsed' : ''}`}
      >
        {/* Logo 区域 */}
        <div className="flex items-center gap-3 px-3 h-14 border-b border-[var(--border-color)] flex-shrink-0">
          <div
            className={`w-8 h-8 rounded-md bg-[#da7756] flex items-center justify-center flex-shrink-0 ${sidebarCollapsed ? 'cursor-pointer' : ''}`}
            onClick={sidebarCollapsed ? toggleSidebar : undefined}
            title={sidebarCollapsed ? '展开侧边栏' : undefined}
          >
            <Sparkles size={16} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold text-[#1a1a1a] truncate font-serif tracking-tight">
                  内容萃取
                </h1>
                <p className="text-[10px] text-[var(--muted)] truncate font-medium uppercase tracking-widest">
                  Content Mining Hub
                </p>
              </div>
              <button
                onClick={toggleSidebar}
                className="btn-ghost !p-1.5 flex-shrink-0"
                aria-label="收起侧边栏"
                id="toggle-sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </>
          )}
        </div>

        {/* 收起状态下的展开按钮 */}
        {sidebarCollapsed && (
          <div className="flex flex-col items-center py-3 gap-3">
            <button
              onClick={toggleSidebar}
              className="btn-ghost !p-2"
              aria-label="展开侧边栏"
              id="toggle-sidebar-expand"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

        {/* 全局导航 Tab */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2 border-b border-[var(--border-color)] flex gap-1 flex-shrink-0">
            <Link
              href="/"
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                !isSkillsPage
                  ? 'bg-[var(--surface-hover)] text-[var(--foreground)]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Database size={14} />
              工作台
            </Link>
            <Link
              href="/skills"
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isSkillsPage
                  ? 'bg-[var(--surface-hover)] text-[var(--foreground)]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Cpu size={14} />
              Skill 引擎
            </Link>
          </div>
        )}

        {/* 区域标题 */}
          <div className="px-4 pt-4 pb-1">
            <span className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wider">
              {isSkillsPage ? '技能库' : '工作空间'}
            </span>
          </div>

        {/* 核心内容区 (文件夹树 或 Skill列表) */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {!isSkillsPage ? (
              <FolderTree />
            ) : (
              <SkillFolderTree />
            )}
          </div>
        )}

        {/* 底部操作区 */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-[var(--border-color)] space-y-2 flex-shrink-0">
            {!isSkillsPage ? (
              <>
                <button
                  className="btn-ghost w-full justify-start"
                  id="btn-new-folder"
                  onClick={() => {
                    setNewFolderName('');
                    setShowNewFolderModal(true);
                  }}
                >
                  <FolderPlus size={16} />
                  <span>新建文件夹</span>
                </button>
                <button
                  className="btn-primary w-full justify-center"
                  id="btn-upload-file"
                  onClick={() => {
                    setUploadedFiles([]);
                    setShowUploadModal(true);
                  }}
                >
                  <Upload size={16} />
                  <span>上传文件</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-ghost w-full justify-start"
                  id="btn-new-skill-folder"
                  onClick={() => {
                    setNewFolderName('');
                    setShowNewFolderModal(true);
                  }}
                >
                  <FolderPlus size={16} />
                  <span>新建技能库</span>
                </button>
                <button
                  className="btn-primary w-full justify-center bg-[#2c2c2c] hover:bg-[#1a1a1a]"
                  id="btn-new-skill"
                  onClick={() => {
                    const targetFolderId = selectedSkillFolderId || 'root-skills';
                    const newId = addSkill({
                      name: '新 AI Skill',
                      folderId: targetFolderId,
                      description: '',
                      promptTemplate: '在此输入 Prompt 模板',
                      modelConfig: { model: 'Qwen3-Max', temperature: 0.5, maxTokens: 1000 },
                    });
                    router.push('/skills');
                  }}
                >
                  <Plus size={16} />
                  <span>新建技能</span>
                </button>
              </>
            )}
          </div>
        )}
      </aside>

      {/* ===== 新建文件夹 Modal ===== */}
      {showNewFolderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowNewFolderModal(false)}
        >
          <div
            className="glass-card w-full max-w-md p-6 mx-4 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                新建文件夹
              </h2>
              <button
                className="btn-ghost !p-1.5"
                onClick={() => setShowNewFolderModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">
                  父文件夹
                </label>
                <div className="px-3 py-2 rounded-lg bg-[var(--surface-hover)] text-sm text-[var(--foreground)] border border-[var(--border-color)]">
                  📁 {parentFolderName}
                </div>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">
                  文件夹名称
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="请输入文件夹名称"
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="btn-ghost"
                onClick={() => setShowNewFolderModal(false)}
              >
                取消
              </button>
              <button
                className="btn-primary"
                disabled={!newFolderName.trim()}
                onClick={handleCreateFolder}
              >
                <FolderPlus size={16} />
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 上传文件 Modal ===== */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="glass-card w-full max-w-lg p-6 mx-4 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                上传文件
              </h2>
              <button
                className="btn-ghost !p-1.5"
                onClick={() => setShowUploadModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1.5">
                  目标文件夹
                </label>
                <div className="px-3 py-2 rounded-lg bg-[var(--surface-hover)] text-sm text-[var(--foreground)] border border-[var(--border-color)]">
                  📁 {selectedFileFolderId ? parentFolderName : '知识库（默认）'}
                </div>
              </div>

              {/* 拖拽 + 点击上传区域 */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[var(--accent)] bg-[rgba(218,119,86,0.05)] scale-[1.02]'
                    : 'border-[rgba(0,0,0,0.1)] hover:border-[var(--accent)] hover:bg-[rgba(0,0,0,0.02)]'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.md,.markdown,.docx,.doc,.txt,.json,.xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesSelected(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
                <Upload
                  size={32}
                  className={`mx-auto mb-3 transition-colors ${
                    isDragging ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                  }`}
                />
                <p className="text-sm text-[var(--foreground)] font-medium mb-1">
                  {isDragging ? '松开以添加文件' : '拖拽文件到此处，或点击选择'}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  支持 PDF、Markdown、Docx、TXT、JSON、Excel 格式
                </p>
              </div>

              {/* 文件列表 */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uploadedFiles.map((entry, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border-color)]"
                    >
                      <FileText size={16} className="text-[var(--muted)] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--foreground)] truncate">
                          {entry.file.name}
                        </p>
                        <p className="text-[11px] text-[var(--muted)]">
                          {(entry.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      {entry.status === 'reading' && (
                        <span className="text-[11px] text-[var(--accent)] animate-pulse">
                          读取中...
                        </span>
                      )}
                      {entry.status === 'ready' && (
                        <span className="text-[11px] text-emerald-400">
                          就绪
                        </span>
                      )}
                      {entry.status === 'done' && (
                        <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-6">
              <span className="text-xs text-[var(--muted)]">
                {doneCount > 0
                  ? `✅ ${doneCount} 个文件已上传`
                  : uploadedFiles.length > 0
                    ? `已选择 ${uploadedFiles.length} 个文件`
                    : ''}
              </span>
              <div className="flex gap-2">
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadedFiles([]);
                  }}
                >
                  {doneCount > 0 ? '关闭' : '取消'}
                </button>
                {doneCount === 0 && (
                  <button
                    className="btn-primary"
                    disabled={readyCount === 0}
                    onClick={handleUpload}
                  >
                    <Upload size={16} />
                    上传 {readyCount > 0 ? `(${readyCount})` : ''}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
