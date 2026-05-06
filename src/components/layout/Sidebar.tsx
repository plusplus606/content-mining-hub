'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  User,
  Settings,
  MessageSquarePlus,
  MessageSquare,
} from 'lucide-react';
import FolderTree from './FolderTree';
import Modal from '@/components/ui/Modal';
import { useClickOutside } from '@/hooks/useClickOutside';

import { useFileStore, getFileTypeFromName } from '@/store/useFileStore';
import { useSkillStore } from '@/store/useSkillStore';
import { useChatStore } from '@/store/useChatStore';
import { Document } from '@/types';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSkillsPage = pathname?.startsWith('/skills');
  const activeTab = searchParams.get('tab') || 'skills';

  const {
    sidebarCollapsed,
    toggleSidebar,
    selectedFolderId: selectedFileFolderId,
    launchMode,
    addFolder,
    addDocument,
    getSelectedFolderName,
    selectFolder,
    showUploadModal,
    setShowUploadModal,
    recentChats,
    openConversation,
  } = useFileStore();

  const { getSelectedSkillFolderName } = useSkillStore();
  const { ensureConversation } = useChatStore();

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  // const [showUploadModal, setShowUploadModal] = useState(false); // 移除局部状态，改用全局状态
  const [newProjectName, setNewProjectName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<
    { file: File; content: string; status: 'reading' | 'ready' | 'done' }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const configMenuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useClickOutside([configMenuRef, triggerRef], () => setShowConfigMenu(false), {
    active: showConfigMenu,
  });

  const parentFolderName = isSkillsPage ? getSelectedSkillFolderName() : getSelectedFolderName();
  const isNewChatActive =
    (pathname === '/' || pathname?.startsWith('/chat')) &&
    launchMode === 'chat' &&
    !selectedFileFolderId;
  const isContentLibraryActive = pathname === '/skills' && activeTab === 'files';

  // 处理新建项目
  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    addFolder(newProjectName.trim(), null);
    setShowNewProjectModal(false);
    setNewProjectName('');
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
                  成课工作台
                </h1>
                <p className="text-[10px] text-[var(--muted)] truncate font-medium uppercase tracking-widest">
                  Course Creation Workbench
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
            
            <div className="h-px w-8 bg-gray-100 my-1" />
            
            <button
              onClick={() => {
                openConversation();
                router.push('/');
              }}
              className={`p-2 rounded-lg transition-all ${
                isNewChatActive ? 'bg-[rgba(218,119,86,0.1)] text-[#da7756]' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="新对话"
            >
              <MessageSquarePlus size={18} />
            </button>

            <Link
              href="/skills?tab=files"
              className={`p-2 rounded-lg transition-all ${
                isContentLibraryActive ? 'bg-[rgba(218,119,86,0.1)] text-[#da7756]' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="内容库"
            >
              <Database size={18} />
            </Link>

            <button
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-all"
              title="最近对话"
              onClick={() => {
                const el = document.getElementById('config-trigger-collapsed');
                if (el) el.click(); // 借用配置中心逻辑或单纯示意
              }}
            >
              <MessageSquare size={18} />
            </button>
          </div>
        )}

        {/* 核心内容区 */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-4 mt-4">
            
            {/* 第一区块：核心操作 */}
            <div>
              <div className="space-y-1">
                {/* 1. 新对话 */}
                <button
                  onClick={() => {
                    openConversation();
                    router.push('/');
                  }}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isNewChatActive
                      ? 'bg-[rgba(218,119,86,0.1)] text-[#da7756]'
                      : 'text-[#555] opacity-80 hover:opacity-100 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquarePlus size={16} />
                  <span>新对话</span>
                </button>

                {/* 2. 内容库 */}
                <Link
                  href="/skills?tab=files"
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isContentLibraryActive
                      ? 'bg-[rgba(218,119,86,0.1)] text-[#da7756]'
                      : 'text-[#555] hover:bg-gray-100'
                  }`}
                >
                  <Database size={16} />
                  <span>内容库</span>
                </Link>
              </div>
            </div>

            {/* 第二分区：研课项目 */}
            <div>
              <div className="px-2 mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.15em] opacity-80">
                  研课项目
                </span>
              </div>
              <div className="space-y-0.5">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-md transition-colors"
                  onClick={() => {
                    setNewProjectName('');
                    setShowNewProjectModal(true);
                  }}
                >
                  <FolderPlus size={16} className="text-[var(--muted)]" />
                  新项目
                </button>
                <FolderTree />
              </div>
            </div>

            {/* 第三分区：最近 */}
            <div>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.15em] opacity-80">
                  最近
                </span>
              </div>
              <div className="space-y-0.5">
                {(recentChats ?? []).map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      openConversation();
                      ensureConversation(chat.id, chat.title);
                      router.push(`/chat/${chat.id}`);
                    }}
                    className="w-full text-left group flex items-center px-3 py-1.5 rounded-lg text-[#555] hover:bg-gray-50 transition-all cursor-pointer overflow-hidden"
                  >
                    <span className="text-[13px] font-medium truncate group-hover:text-[var(--foreground)]">
                      {chat.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 底部配置区域 */}
            <div className="mt-auto px-1 relative">
              {showConfigMenu && (
                <div 
                  ref={configMenuRef}
                  className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 p-1.5"
                >
                  <Link
                    href="/skills?tab=profile"
                    onClick={() => setShowConfigMenu(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      pathname === '/skills' && activeTab === 'profile'
                        ? 'bg-[rgba(218,119,86,0.1)] text-[#da7756]'
                        : 'text-[#555] hover:bg-gray-100'
                    }`}
                  >
                    <User size={16} />
                    <span>我的风格</span>
                  </Link>
                  <Link
                    href="/skills?tab=skills"
                    onClick={() => setShowConfigMenu(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      pathname === '/skills' && activeTab === 'skills'
                        ? 'bg-[rgba(218,119,86,0.1)] text-[#da7756]'
                        : 'text-[#555] hover:bg-gray-100'
                    }`}
                  >
                    <Cpu size={16} />
                    <span>技能广场</span>
                  </Link>
                  <div className="h-px bg-gray-100 my-1 mx-2" />
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#888] hover:bg-gray-50 transition-all"
                  >
                    <Settings size={16} />
                    <span>更多设置</span>
                  </button>
                </div>
              )}
              
              <button
                ref={triggerRef}
                onClick={() => setShowConfigMenu(!showConfigMenu)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  showConfigMenu ? 'bg-gray-100' : 'hover:bg-gray-100 text-[#555]'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center text-white flex-shrink-0">
                  <User size={14} />
                </div>
                <div className="flex-1 text-left truncate">配置中心</div>
                <Settings size={14} className={`text-gray-400 transition-transform duration-300 ${showConfigMenu ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* 收起状态的底部配置按钮 */}
        {sidebarCollapsed && (
          <div className="mt-auto flex flex-col items-center py-4 border-t border-[var(--border-color)]">
             <button
              ref={triggerRef}
              id="config-trigger-collapsed"
              onClick={() => setShowConfigMenu(!showConfigMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative"
            >
              <Settings size={20} className={showConfigMenu ? 'text-[#da7756]' : ''} />
              
              {showConfigMenu && (
                <div 
                  className="absolute left-full bottom-0 ml-4 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 p-1.5"
                  onMouseLeave={() => setShowConfigMenu(false)}
                >
                  <Link
                    href="/skills?tab=profile"
                    onClick={() => setShowConfigMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#555] hover:bg-gray-100 transition-all"
                  >
                    <User size={16} />
                    <span>我的风格</span>
                  </Link>
                  <Link
                    href="/skills?tab=skills"
                    onClick={() => setShowConfigMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#555] hover:bg-gray-100 transition-all"
                  >
                    <Cpu size={16} />
                    <span>技能广场</span>
                  </Link>
                </div>
              )}
            </button>
          </div>
        )}


      </aside>

      {/* ===== 新建项目 Modal ===== */}
      <Modal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,20,0.45)] backdrop-blur-[6px] px-4"
        contentClassName="w-full max-w-[460px] rounded-3xl border border-[rgba(255,255,255,0.55)] bg-[linear-gradient(160deg,rgba(255,255,255,0.97),rgba(251,247,242,0.96))] shadow-[0_24px_80px_rgba(20,20,20,0.2)] animate-fade-in-up overflow-hidden"
      >
            <div className="px-7 pt-6 pb-5 border-b border-[rgba(0,0,0,0.06)] bg-[linear-gradient(135deg,rgba(218,119,86,0.12),rgba(218,119,86,0.03))]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#da7756] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(218,119,86,0.35)]">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h2 className="text-[19px] font-semibold text-[var(--foreground)] leading-none">
                      新建项目
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-2">
                      输入项目名称，立即创建一个新的研课项目。
                    </p>
                  </div>
                </div>
                <button
                  className="w-8 h-8 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/70 transition-colors flex items-center justify-center"
                  onClick={() => setShowNewProjectModal(false)}
                  aria-label="关闭"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="px-7 py-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-[var(--muted)] mb-2 tracking-wide uppercase">
                    项目名称
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="例如：一线经纪人 AI 实战课"
                    className="w-full bg-white border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[#a6a6a6] focus:outline-none focus:border-[#da7756] focus:ring-4 focus:ring-[rgba(218,119,86,0.13)] transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateProject();
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="px-7 pb-6 flex justify-end gap-2.5">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#666] hover:text-[#222] hover:bg-[rgba(0,0,0,0.05)] transition-colors"
              >
                取消
              </button>
              <button
                disabled={!newProjectName.trim()}
                onClick={handleCreateProject}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#da7756] hover:bg-[#c56546] disabled:bg-[#e4e4e4] disabled:text-[#a9a9a9] disabled:cursor-not-allowed shadow-[0_10px_24px_rgba(218,119,86,0.32)] transition-all"
              >
                <FolderPlus size={16} />
                创建项目
              </button>
            </div>
      </Modal>

      {/* ===== 上传文件 Modal ===== */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        contentClassName="glass-card w-full max-w-lg p-6 mx-4 animate-fade-in-up"
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
      </Modal>
    </>
  );
}
