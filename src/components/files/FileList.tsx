'use client';

import {
  LayoutGrid,
  List,
  ArrowUpDown,
  FolderOpen,
  Sparkles,
  Upload,
  Plus,
  Mic,
  AudioLines,
  Search,
  ChevronDown,
  Paperclip,
  Globe,
  Zap,
  X,
  FileText,
  Loader2,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react';
import { useFileStore } from '@/store/useFileStore';
import { useSkillStore } from '@/store/useSkillStore';
import { useUserStore } from '@/store/useUserStore';
import { useChatStore } from '@/store/useChatStore';
import Modal from '@/components/ui/Modal';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Document, SortBy } from '@/types';
import FileCard from './FileCard';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useRef } from 'react';
import { getFileIcon, getFileTypeLabel } from '@/components/ui/Icons';

export default function FileList({ allFiles = false }: { allFiles?: boolean }) {
  const router = useRouter();
  const {
    selectedFolderId,
    viewMode,
    sortBy,
    getCurrentDocuments,
    setViewMode,
    setSortBy,
    selectedDocumentIds,
    setShowUploadModal,
    setViewingDocumentId,
    getSelectedFolderName,
    documents: allDocumentsFromStore,
    addDocument,
    clearSelection,
    toggleDocumentSelection,
    launchMode,
    startNewConversation,
    addFolder,
    folders,
  } = useFileStore();

  const { skills } = useSkillStore();
  const { profile: instructorProfile } = useUserStore();
  const { ensureConversation, setPendingInitialPrompt } = useChatStore();
  const targetStudents = instructorProfile.targetStudents || [];

  const [activeTab, setActiveTab] = useState<'chat' | 'source'>('source');
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'image' | 'file'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [launchInput, setLaunchInput] = useState('');
  
  // 获取选中的文档对象
  const selectedDocs = allDocumentsFromStore.filter(d => selectedDocumentIds.has(d.id));
  
  // 学员与角色状态
  const [currentStudent, setCurrentStudent] = useState('经纪人');
  const [currentRole, setCurrentRole] = useState('PPT 专家');

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set());
  const roleMenuRef = useRef<HTMLDivElement>(null);

  const toggleSkillSelection = (skillId: string) => {
    setSelectedSkillIds(prev => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  };

  const selectedSkills = skills.filter(s => selectedSkillIds.has(s.id));
  useClickOutside([roleMenuRef], () => setShowRoleMenu(false), { active: showRoleMenu });

  const [showStudentMenu, setShowStudentMenu] = useState(false);
  const [customStudentInput, setCustomStudentInput] = useState('');
  const studentMenuRef = useRef<HTMLDivElement>(null);
  const launchTextareaRef = useRef<HTMLTextAreaElement>(null);
  useClickOutside([studentMenuRef], () => setShowStudentMenu(false), { active: showStudentMenu });

  const runExtractTask = useCallback(
    async ({
      prompt,
      emptyContentFallback,
      metadataType,
      resultNameBuilder,
    }: {
      prompt: string;
      emptyContentFallback: string;
      metadataType: string;
      resultNameBuilder: () => string;
    }) => {
      const normalizedPrompt = prompt.trim();
      if (isProcessing || (!normalizedPrompt && selectedDocs.length === 0)) return;

      setIsProcessing(true);
      try {
        const mergedContent =
          selectedDocs.length > 0
            ? selectedDocs.map((doc) => `--- 源文件: ${doc.name} ---\n${doc.content}`).join('\n\n')
            : emptyContentFallback;

        const skill = skills[0];
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: mergedContent,
            skillDir: skill?.skillDir,
            promptTemplate: skill?.promptTemplate || normalizedPrompt,
            modelConfig: skill?.modelConfig || { model: 'gpt-4o', temperature: 0.7 },
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '生成失败');

        const now = new Date().toISOString();
        const newDoc: Document = {
          id: `gen-${Date.now()}`,
          folderId: 'root-extracted',
          name: resultNameBuilder(),
          fileType: 'markdown',
          size: data.result.length,
          content: data.result,
          metadata: { type: metadataType },
          updatedAt: now,
          createdAt: now,
        };

        addDocument(newDoc);
        clearSelection();
        setInputValue('');
        router.push(`/document/${newDoc.id}`);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : '未知错误';
        alert(`处理失败: ${errorMessage}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [addDocument, clearSelection, isProcessing, router, selectedDocs, skills]
  );

  const handleGlobalExtract = useCallback(() => {
    return runExtractTask({
      prompt: inputValue,
      emptyContentFallback: '基于全域知识库进行通用分析',
      metadataType: 'global_chat',
      resultNameBuilder: () => `知识库对话_${new Date().toLocaleTimeString()}.md`,
    });
  }, [inputValue, runExtractTask]);

  const handleProjectExtract = useCallback(() => {
    return runExtractTask({
      prompt: inputValue,
      emptyContentFallback: '直接基于指令处理',
      metadataType: 'batch_dialogue',
      resultNameBuilder: () =>
        selectedDocs.length > 0
          ? `${selectedDocs[0].name.split('.')[0]}等${selectedDocs.length}个文件的分析结果.md`
          : `指令生成_${new Date().toLocaleTimeString()}.md`,
    });
  }, [inputValue, runExtractTask, selectedDocs]);

  // 内容源处理逻辑
  const documents = allFiles ? allDocumentsFromStore : getCurrentDocuments();
  const folderName = allFiles ? '知识库' : getSelectedFolderName();

  // 从讲师画像中读取授课对象（联动）
  const studentAvatars: Record<string, string> = Object.fromEntries(
    targetStudents.map(s => [s.name, s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`])
  );

  const roleAvatars: Record<string, string> = {
    'PPT 专家': 'https://api.dicebear.com/7.x/bottts/svg?seed=Optimus',
    '播客专家': 'https://api.dicebear.com/7.x/bottts/svg?seed=Soundwave',
    '直播稿专家': 'https://api.dicebear.com/7.x/bottts/svg?seed=Megatron',
  };

  // 未选中文件夹且非全域模式 — 欢迎页
  if (!selectedFolderId && !allFiles) {
    if (launchMode === 'chat') {
      const canLaunchConversation = launchInput.trim().length > 0;
      const submitLaunchConversation = () => {
        if (!canLaunchConversation) return;
        const title = launchInput.trim();
        const chatId = startNewConversation(title);
        ensureConversation(chatId, title || '新对话');
        setPendingInitialPrompt(chatId, title);
        router.push(`/chat/${chatId}`);
        setLaunchInput('');
        if (launchTextareaRef.current) {
          launchTextareaRef.current.style.height = '54px';
        }
      };

      return (
        <div className="flex-1 flex items-center justify-center px-4 md:px-10 bg-[radial-gradient(circle_at_50%_10%,rgba(218,119,86,0.09),transparent_46%),var(--background)]">
          <div className="w-full max-w-[860px] -translate-y-8 md:-translate-y-12">
            <div className="mb-6 md:mb-7 text-center">
              <h2 className="text-[32px] md:text-[42px] leading-[1.15] text-[var(--foreground)] font-serif font-semibold tracking-tight">
                老师好，今天的课程主题是什么？
              </h2>
            </div>

            <div className="glass-card rounded-3xl border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.88)] px-5 md:px-6 pt-4 md:pt-5 pb-4">
              <textarea
                ref={launchTextareaRef}
                rows={2}
                value={launchInput}
                onChange={(e) => {
                  setLaunchInput(e.target.value);
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitLaunchConversation();
                  }
                }}
                placeholder="请输入课程主题、目标学员和预期产出..."
                className="w-full min-h-[54px] max-h-[160px] resize-none bg-transparent border-none outline-none px-1 py-0 text-[15px] md:text-[16px] leading-[1.45] text-[var(--foreground)] placeholder:text-[#a2a2a2] placeholder:text-[15px] md:placeholder:text-[16px]"
              />

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <button
                    className="w-8 h-8 rounded-lg hover:bg-[var(--surface-hover)] flex items-center justify-center transition-colors"
                    aria-label="添加"
                  >
                    <Plus size={16} />
                  </button>
                  <button className="px-2.5 py-1.5 rounded-lg text-[13px] hover:bg-[var(--surface-hover)] transition-colors inline-flex items-center gap-1.5">
                    <Globe size={14} />
                    联网搜索
                  </button>
                  <button className="px-2.5 py-1.5 rounded-lg text-[13px] hover:bg-[var(--surface-hover)] transition-colors inline-flex items-center gap-1.5">
                    <Zap size={14} />
                    工具
                  </button>
                </div>
                <button
                  onClick={submitLaunchConversation}
                  disabled={!canLaunchConversation}
                  className="btn-primary !px-4 !py-2 !rounded-xl !text-sm shadow-[0_8px_20px_rgba(218,119,86,0.28)] disabled:!shadow-none"
                >
                  发起对话
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center animate-fade-in-up bg-white">
        <div className="empty-state">
          <div className="w-20 h-20 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mb-4">
            <Sparkles size={32} className="text-[#da7756]" />
          </div>
          <h2 className="text-2xl font-semibold text-[#1a1a1a] font-serif">
            成课工作台
          </h2>
          <p className="text-sm text-[var(--muted)] max-w-md">
            创建一个新项目开始整理内容材料与任务进度。
          </p>
          <div className="mt-6 w-full max-w-sm flex gap-2">
            <input
              type="text"
              value={launchInput}
              onChange={(e) => setLaunchInput(e.target.value)}
              placeholder="输入项目名称..."
              className="flex-1 border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[#da7756]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && launchInput.trim()) {
                  addFolder(launchInput.trim(), null);
                  setLaunchInput('');
                }
              }}
            />
            <button
              className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-white text-sm hover:bg-black transition-colors"
              onClick={() => {
                if (!launchInput.trim()) return;
                addFolder(launchInput.trim(), null);
                setLaunchInput('');
              }}
            >
              创建项目
            </button>
          </div>
          <div className="flex gap-4 mt-6">
            <div className="glass-card !rounded-lg px-6 py-4 text-center min-w-[100px]">
              <p className="text-2xl font-medium text-[#2c2c2c] font-serif">{allDocumentsFromStore.length}</p>
              <p className="text-xs text-[var(--muted)] mt-1 font-medium tracking-wide">总文档</p>
            </div>
            <div className="glass-card !rounded-lg px-6 py-4 text-center min-w-[100px]">
              <p className="text-2xl font-medium text-[#2c2c2c] font-serif">{folders.length}</p>
              <p className="text-xs text-[var(--muted)] mt-1 font-medium tracking-wide">任务区</p>
            </div>
            <div className="glass-card !rounded-lg px-6 py-4 text-center min-w-[100px]">
              <p className="text-2xl font-medium text-[#da7756] font-serif">0</p>
              <p className="text-xs text-[var(--muted)] mt-1 font-medium tracking-wide">生成结果</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'name', label: '名称' },
    { value: 'date', label: '日期' },
    { value: 'size', label: '大小' },
  ];

  const formatLibraryDateFull = (value: string) => {
    const date = new Date(value);
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}/${m}/${d}`;
  };

  const formatLibrarySize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isImageDoc = (doc: Document) => /\.(png|jpe?g|webp|gif|svg)$/i.test(doc.name);


  if (allFiles) {
    const keyword = inputValue.trim().toLowerCase();
    const filteredDocs = documents
      .filter((doc) => {
        if (libraryFilter === 'image') return isImageDoc(doc);
        if (libraryFilter === 'file') return !isImageDoc(doc);
        return true;
      })
      .filter((doc) => (keyword ? doc.name.toLowerCase().includes(keyword) : true))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return (
      <div className="flex-1 min-h-full overflow-y-auto bg-[linear-gradient(180deg,var(--background)_0%,#f6f5f1_100%)]">
        <div className="max-w-[920px] mx-auto px-8 pt-16 pb-12 min-h-[calc(100vh-var(--header-height))]">
          <div className="flex items-center justify-between gap-6 mb-10">
            <h1 className="text-[42px] leading-none tracking-tight font-serif text-[var(--foreground)]">内容库</h1>
            <div className="flex items-center gap-3">
              <div className="relative w-[330px]">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="搜索资料库"
                  className="w-full h-11 rounded-full border border-[var(--border-color)] bg-[var(--surface)] pl-11 pr-4 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-primary !h-11 !px-5 !rounded-full !text-[14px]"
              >
                上传
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {[
                { key: 'all', label: '全部' },
                { key: 'image', label: '图片' },
                { key: 'file', label: '文件' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setLibraryFilter(tab.key as 'all' | 'image' | 'file')}
                  className={`px-4 py-1.5 rounded-full text-[14px] leading-none transition-colors ${
                    libraryFilter === tab.key
                      ? 'bg-[rgba(218,119,86,0.12)] text-[var(--accent)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-[var(--muted)]">
              <button className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors" title="筛选">
                <ArrowUpDown size={18} />
              </button>
              <div className="h-6 w-px bg-[var(--border-color)]" />
              <button
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[var(--surface-hover)] text-[var(--foreground)]' : 'hover:bg-[var(--surface-hover)]'}`}
                onClick={() => setViewMode('grid')}
                title="网格"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-[var(--surface-hover)] text-[var(--foreground)]' : 'hover:bg-[var(--surface-hover)]'}`}
                onClick={() => setViewMode('list')}
                title="列表"
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="py-16 text-center text-[var(--muted)] text-sm">暂无匹配资料</div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => (
                <FileCard key={doc.id} document={doc} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredDocs.map((doc) => {
                const { icon: DocIcon, className } = getFileIcon(doc.fileType);
                return (
                  <button
                    key={doc.id}
                    onClick={() => setViewingDocumentId(doc.id)}
                    className="w-full h-[56px] rounded-[10px] border border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.46)] px-4 text-left hover:bg-[rgba(255,255,255,0.68)] transition-colors"
                  >
                    <div className="grid grid-cols-[1fr_96px_90px_112px] items-center gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="w-5 h-5 rounded-[5px] border border-[rgba(0,0,0,0.15)] bg-transparent flex-shrink-0" />
                        <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                          <DocIcon size={18} className={className} />
                        </span>
                        <span className="text-[15px] text-[var(--foreground)] truncate">{doc.name}</span>
                      </div>
                      <span className="text-[13px] text-[var(--muted)]">{getFileTypeLabel(doc.fileType)}</span>
                      <span className="text-[13px] text-[var(--muted)]">{formatLibrarySize(doc.size)}</span>
                      <span className="text-[13px] text-[var(--muted)]">{formatLibraryDateFull(doc.updatedAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden animate-fade-in-up">
      {/* 1. 项目头部标题 */}
      <div className="pt-8 px-8 pb-4 max-w-4xl mx-auto w-full flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center text-[#1a1a1a]">
          {allFiles ? <Globe size={20} /> : <FolderOpen size={20} />}
        </div>
        <h1 className="text-2xl font-semibold text-[#1a1a1a] tracking-tight">
          {folderName}
        </h1>
      </div>

      {/* 2. 交互区域：根据模式展示不同样式的输入框 */}
      <div className="px-8 pb-6 max-w-4xl mx-auto w-full">
        {allFiles ? (
          // 知识库模式：窄版胶囊搜索/对话框
          <div className="relative group">
            <div className="flex items-center gap-3 bg-white border border-[#f1f3f4] rounded-full px-5 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)] focus-within:shadow-[0_4px_25px_rgba(0,0,0,0.08)] focus-within:border-[#da7756]/30 transition-all">
              <button className="text-[#9aa0a6] hover:text-[#1a1a1a] transition-colors">
                <Plus size={20} />
              </button>
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="基于全域文件内容进行新对话或搜索..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#202124] placeholder-[#9aa0a6]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isProcessing && (inputValue.trim() || selectedDocs.length > 0)) {
                    e.preventDefault();
                    void handleGlobalExtract();
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <button className="text-[#9aa0a6] hover:text-[#1a1a1a] transition-colors p-1.5">
                  <Mic size={18} />
                </button>
                <button 
                  disabled={isProcessing || (!inputValue.trim() && selectedDocs.length === 0)}
                  onClick={() => void handleGlobalExtract()}
                  className={`p-2 rounded-full transition-all ${
                    isProcessing || (!inputValue.trim() && selectedDocs.length === 0)
                      ? 'bg-gray-100 text-[#9aa0a6]'
                      : 'bg-[#1a1a1a] text-white hover:bg-black shadow-sm'
                  }`}
                >
                  {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <AudioLines size={18} />}
                </button>
              </div>
            </div>

            {/* 知识库模式下：浮动的文件引用标签 */}
            {selectedDocs.length > 0 && (
              <div className="absolute -top-12 left-6 flex flex-wrap gap-2 animate-fade-in-up">
                {selectedDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-1.5 bg-[var(--surface)] border border-[#f1f3f4] px-2.5 py-1 rounded-full shadow-sm text-[11px] text-[#555]">
                    <Paperclip size={10} />
                    <span className="truncate max-w-[80px]">{doc.name}</span>
                    <button onClick={() => toggleDocumentSelection(doc.id)} className="hover:text-red-500">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // 任务管理模式：增强型交互卡片（原有 UI）
          <div className="relative bg-white rounded-[32px] p-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#f1f3f4] group z-10">
            {/* 卡片顶栏：学员与角色选择器 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f8f9fa]">
              <div className="relative" ref={studentMenuRef}>
                <div 
                  className="flex items-center justify-between gap-2.5 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-full transition-all border border-transparent hover:border-gray-200"
                  onClick={() => setShowStudentMenu(!showStudentMenu)}
                >
                  <img src={studentAvatars[currentStudent] || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Custom'} alt="Avatar" className="w-6 h-6 rounded-full bg-gray-100 border border-gray-100" />
                  <span className="text-sm font-medium text-[#5f6368]">
                    向 <span className="text-[#202124]">{currentStudent}</span> 授课
                  </span>
                  <ChevronDown size={14} className="text-[#9aa0a6] transition-transform" style={{ transform: showStudentMenu ? 'rotate(180deg)' : 'none' }} />
                </div>

                {/* 悬浮菜单 */}
                {showStudentMenu && (
                  <div className="absolute top-[48px] left-0 w-[280px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#eef0f2] z-50 animate-fade-in-up">
                    <div className="p-2">
                      <div className="text-[11px] font-bold text-[#9aa0a6] px-3 py-2 select-none tracking-wide">推荐学习群体</div>
                      <div className="flex flex-col gap-1">
                      {targetStudents.map(s => s.name).map(role => (
                        <button
                          key={role}
                          onClick={() => {
                            setCurrentStudent(role);
                            setShowStudentMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 text-[14px] rounded-xl transition-all flex items-center justify-between group/item ${
                            currentStudent === role 
                              ? 'bg-[rgba(218,119,86,0.08)] text-[#da7756] font-medium' 
                              : 'text-[#444] hover:bg-[#f8f9fa] font-medium'
                          }`}
                        >
                          <span>{role}</span>
                          {currentStudent === role ? (
                            <CheckCircle2 size={16} className="text-[#da7756]" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-transparent group-hover/item:border-gray-300 transition-colors"></div>
                          )}
                        </button>
                      ))}
                      </div>
                      
                      <div className="h-px bg-[#f1f3f4] my-2 mx-2"></div>
                      
                      <div className="px-2 py-2 mb-1">
                        <div className="text-[11px] font-bold text-[#9aa0a6] px-1 mb-2 select-none tracking-wide">自定义群体</div>
                        <div className="flex items-center gap-2 bg-[#f8f9fa] p-1.5 rounded-xl border border-transparent focus-within:border-[#da7756]/30 focus-within:bg-white focus-within:shadow-[0_2px_10px_rgba(218,119,86,0.08)] transition-all">
                          <input 
                            type="text" 
                            placeholder="如：入职不满半年的新兵" 
                            value={customStudentInput}
                            onChange={(e) => setCustomStudentInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && customStudentInput.trim()) {
                                setCurrentStudent(customStudentInput.trim());
                                setShowStudentMenu(false);
                                setCustomStudentInput('');
                              }
                            }}
                            className="flex-1 bg-transparent border-none px-2 py-1 text-[13px] text-[#202124] placeholder-[#aaa] focus:outline-none"
                          />
                          <button 
                            disabled={!customStudentInput.trim()}
                            onClick={() => {
                              setCurrentStudent(customStudentInput.trim());
                              setShowStudentMenu(false);
                              setCustomStudentInput('');
                            }}
                            className="bg-[#1a1a1a] text-white px-3 py-1.5 rounded-lg text-[13px] font-medium disabled:opacity-30 hover:bg-black transition-colors"
                          >
                            确定
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#9aa0a6] font-medium hidden sm:inline">选择成课专家</span>
                <div className="relative" ref={roleMenuRef}>
                  <div 
                    className="flex items-center gap-2 group/role cursor-pointer bg-[#f8f9fa] border border-[#eef0f2] hover:border-[#dadce0] px-3 py-1.5 rounded-full transition-all"
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                  >
                    <img src={roleAvatars[currentRole] || 'https://api.dicebear.com/7.x/bottts/svg?seed=Custom'} alt="Role" className="w-6 h-6 rounded-lg bg-white p-0.5 border border-gray-100" />
                    <span className="text-sm font-medium text-[#202124]">{currentRole}</span>
                    <div className="flex gap-0.5 ml-1 items-center">
                      <div className="w-1 h-3 bg-[#dadce0] rounded-full"></div>
                      <div className="w-1 h-5 bg-[#dadce0] rounded-full"></div>
                      <div className="w-1 h-2 bg-[#dadce0] rounded-full"></div>
                    </div>
                    <ChevronDown size={14} className="text-[#9aa0a6] ml-1 transition-transform" style={{ transform: showRoleMenu ? 'rotate(180deg)' : 'none' }} />
                  </div>

                  {/* 悬浮菜单 */}
                  {showRoleMenu && (
                    <div className="absolute top-[48px] right-0 w-[240px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#eef0f2] z-50 animate-fade-in-up">
                      <div className="p-2">
                        <div className="text-[11px] font-bold text-[#9aa0a6] px-3 py-2 select-none tracking-wide">选择产出倾向</div>
                        <div className="flex flex-col gap-1">
                        {['PPT 专家', '播客专家', '直播稿专家'].map(role => (
                          <button
                            key={role}
                            onClick={() => {
                              setCurrentRole(role);
                              setShowRoleMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-[14px] rounded-xl transition-all flex items-center justify-between group/item ${
                              currentRole === role 
                                ? 'bg-[rgba(218,119,86,0.08)] text-[#da7756] font-medium' 
                                : 'text-[#444] hover:bg-[#f8f9fa] font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img src={roleAvatars[role]} alt={role} className="w-5 h-5 rounded-md bg-white border border-gray-100" />
                              <span>{role}</span>
                            </div>
                            {currentRole === role && (
                              <CheckCircle2 size={16} className="text-[#da7756]" />
                            )}
                          </button>
                        ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 卡片内容：文本输入区 */}
            <div className="px-6 pt-5 pb-4">
              {selectedDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 animate-fade-in">
                  {selectedDocs.map(doc => (
                    <div 
                      key={doc.id} 
                      className="flex items-center gap-2 bg-[#f8f9fa] border border-[#eef0f2] px-3 py-1.5 rounded-xl group/chip hover:border-[#da7756]/30 transition-all"
                    >
                      <FileText size={14} className="text-[#9aa0a6]" />
                      <span className="text-[13px] font-medium text-[#202124] max-w-[120px] truncate">{doc.name}</span>
                      <button 
                        onClick={() => toggleDocumentSelection(doc.id)}
                        className="p-0.5 hover:bg-gray-200 rounded-full text-[#9aa0a6] hover:text-[#1a1a1a] transition-colors"
                        title="取消引用"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {selectedDocs.length > 1 && (
                    <button 
                      onClick={clearSelection}
                      className="text-[11px] text-[#da7756] hover:underline px-1"
                    >
                      清空引用
                    </button>
                  )}
                </div>
              )}

              <textarea 
                rows={3}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isProcessing ? "分析引擎正在处理..." : `输入你想学或想生成的任何内容，例如：\n「基于 ${folderName} 中的资料，为 ${currentStudent} 生成一份 PPT 大纲」`}
                className="w-full bg-transparent border-none outline-none text-[16px] text-[#202124] placeholder-[#9aa0a6] font-light resize-none leading-relaxed"
                disabled={isProcessing}
              />

              {/* 已选技能横向展示 */}
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#f8f9fa] animate-fade-in">
                  <div className="flex items-center text-[#9aa0a6] pr-2">
                    <Sparkles size={14} className="mr-1.5" />
                    <span className="text-[12px] font-medium">应用技能</span>
                  </div>
                  {selectedSkills.map(skill => (
                    <div 
                      key={skill.id} 
                      className="flex items-center gap-1.5 bg-[#f5f5f5] border border-[#eef0f2] text-[#444] px-2.5 py-1 rounded-lg text-xs font-medium group/skill hover:border-[#da7756]/30 hover:bg-white transition-all shadow-sm"
                    >
                      <Zap size={10} className="text-[#da7756]" />
                      <span className="truncate max-w-[120px]">{skill.name}</span>
                      <button 
                        onClick={() => toggleSkillSelection(skill.id)}
                        className="p-0.5 hover:bg-gray-200 rounded text-[#9aa0a6] hover:text-[#1a1a1a] transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {selectedSkills.length > 1 && (
                    <button 
                      onClick={() => setSelectedSkillIds(new Set())}
                      className="text-[11px] text-[#da7756] hover:underline px-1 ml-1"
                    >
                      全部清空
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 卡片底栏：功能按钮组 */}
            <div className="flex items-center justify-between px-6 pb-4 pt-2">
              <div className="flex items-center gap-0.5">
                <button 
                  className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 rounded-xl text-[#5f6368] hover:text-[#202124] transition-colors relative" 
                  onClick={() => setActiveTab('source')}
                >
                  <Paperclip size={16} />
                  <span className="text-xs font-medium">附件</span>
                  {selectedDocs.length > 0 && <span className="absolute top-1.5 right-0.5 w-2 h-2 bg-[#da7756] rounded-full border border-white"></span>}
                </button>
                <button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 rounded-xl text-[#5f6368] hover:text-[#202124] transition-colors">
                  <Globe size={16} />
                  <span className="text-xs font-medium">联网</span>
                </button>
                <button 
                  className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-100 rounded-xl text-[#5f6368] hover:text-[#202124] transition-colors relative"
                  onClick={() => setShowSkillsModal(true)}
                >
                  <Zap size={16} />
                  <span className="text-xs font-medium">技能</span>
                  {selectedSkills.length > 0 && <span className="absolute top-1.5 right-0.5 w-2 h-2 bg-[#da7756] rounded-full border border-white"></span>}
                </button>
              </div>
              
              <button 
                disabled={isProcessing || (!inputValue.trim() && selectedDocs.length === 0)}
                onClick={() => void handleProjectExtract()}
                className={`flex items-center gap-2 bg-[#1a1a1a] text-white px-6 py-2.5 rounded-2xl hover:bg-black transition-all shadow-md group/btn disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-sm font-medium">{isProcessing ? '生成中...' : '开始'}</span>
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <AudioLines size={18} className="group-hover:scale-110 transition-transform" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. 频道切换 (Tabs) */}
      <div className="px-8 border-b border-[#f1f3f4] max-w-4xl mx-auto w-full flex justify-center mb-6">
        <div className="flex gap-8">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'chat' 
                ? 'text-black' 
                : 'text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            任务进度
            {activeTab === 'chat' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black rounded-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('source')}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === 'source' 
                ? 'text-black' 
                : 'text-[#5f6368] hover:text-[#202124]'
            }`}
          >
            课程材料
            {activeTab === 'source' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* 4. 内容区域 */}
      <div className="flex-1 px-8 overflow-y-auto pb-12">
        <div className="max-w-4xl mx-auto w-full">
          {activeTab === 'source' ? (
            <>
              {/* 工具栏 (筛选、搜索、视图切换) */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4 text-sm text-[#5f6368]">
                  <span className="font-medium text-[#202124]">全部来源 ({documents.length})</span>
                  <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>
                  <button 
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-1.5 hover:text-black transition-colors"
                  >
                    <Upload size={14} />
                    <span>上传文档</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* 排序选项 */}
                  <div className="flex items-center gap-1 mr-2">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        className={`btn-ghost !text-xs !px-2 !py-1 ${
                          sortBy === opt.value ? 'active' : ''
                        }`}
                        onClick={() => setSortBy(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* 视图切换 */}
                  <div className="flex items-center border border-[var(--border-color)] rounded-lg overflow-hidden">
                    <button
                      className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#f0f0f0]' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#f0f0f0]' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 文件列表 */}
              {documents.length === 0 ? (
                <div className="empty-state py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <FolderOpen size={24} className="text-[#dadce0]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#202124]">
                    当前没有文件
                  </h3>
                  <p className="text-sm text-[#5f6368]">上传文档后，它们将显示在此处</p>
                </div>
              ) : (
                <div
                  className={`animate-stagger ${
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max'
                      : 'flex flex-col gap-2'
                  }`}
                >
                  {documents.map((doc) => (
                    <FileCard key={doc.id} document={doc} viewMode={viewMode} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#f8f9fa] flex items-center justify-center mb-6">
                <Search size={28} className="text-[#dadce0]" />
              </div>
              <h2 className="text-xl font-medium text-[#202124] mb-2">尚无任务</h2>
              <p className="text-[#5f6368] text-sm max-w-sm">
                在上方发起研课任务后，任务进度将在此处实时展示
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 原批量操作工具栏已移除，逻辑集成至上方交互对话框 */}
      {/* 5. 技能选择弹窗 */}
      <Modal
        isOpen={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
        overlayClassName="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-fade-in"
        contentClassName="bg-white rounded-3xl w-full max-w-[900px] h-[75vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden scale-in-center"
      >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6">
              <h2 className="text-[18px] font-bold text-[#1a1a1a]">我的Skills</h2>
              <div className="flex items-center gap-3">
                <button 
                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#f5f5f5] rounded-lg text-[13px] font-medium text-[#444] transition-colors border border-transparent"
                  onClick={() => router.push('/skills')}
                >
                  <Plus size={16} />
                  添加更多技能
                </button>
                <button 
                  className="p-1.5 hover:bg-[#f5f5f5] rounded-full text-[#9aa0a6] hover:text-[#1a1a1a] transition-colors"
                  onClick={() => setShowSkillsModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Body */}
            <div className="flex-1 p-8 pt-2 overflow-y-auto w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    onClick={() => toggleSkillSelection(skill.id)}
                    className={`bg-white border rounded-[16px] p-5 hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer group h-[150px] relative
                      ${selectedSkillIds.has(skill.id) 
                        ? 'border-[#da7756] shadow-[0_4px_12px_rgba(218,119,86,0.15)] bg-[rgba(218,119,86,0.02)]' 
                        : 'border-[#eef0f2] hover:border-[#da7756]/40 hover:shadow-[0_8px_20px_rgba(218,119,86,0.06)]'
                      }
                    `}
                  >
                    {selectedSkillIds.has(skill.id) && (
                      <div className="absolute -top-2 -right-2 bg-[#da7756] text-white rounded-full p-1 shadow-sm border-2 border-white z-10">
                        <CheckCircle2 size={12} strokeWidth={3} />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`font-bold text-[14px] transition-colors truncate pr-2 w-[calc(100%-20px)] ${selectedSkillIds.has(skill.id) ? 'text-[#da7756]' : 'text-[#2c2c2c] group-hover:text-[#da7756]'}`}>
                        {skill.name}
                      </h3>
                      <button className="text-[#c1c4c9] hover:text-[#5f6368] transition-colors -mr-1 -mt-1 p-1">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    <p className="text-[12px] text-[#737373] leading-relaxed line-clamp-3">
                      {skill.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
      </Modal>
    </div>
  );
}
