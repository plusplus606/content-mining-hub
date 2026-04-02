'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useSkillStore } from '@/store/useSkillStore';
import { Cpu, Settings2, Trash2, Save, FolderOpen, FileText, ChevronRight, ChevronDown, BookOpen, Workflow, FileCheck, Lightbulb, Package } from 'lucide-react';
import { Skill } from '@/types';

// ============================================
// 技能包文件浏览器 — 展示与预览技能包中的文件
// ============================================

interface SkillFile {
  name: string;
  type: 'file' | 'directory';
  children?: SkillFile[];
  path: string;
}

function SkillPackageBrowser({ skillDir }: { skillDir: string }) {
  const [fileTree, setFileTree] = useState<SkillFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['.']));

  // 获取文件树
  useEffect(() => {
    async function fetchTree() {
      setLoading(true);
      try {
        const res = await fetch(`/api/skill-files?skillDir=${encodeURIComponent(skillDir)}&action=tree`);
        const data = await res.json();
        if (data.tree) {
          setFileTree(data.tree);
          // 默认展开所有目录
          const dirs = new Set<string>(['.']);
          function collectDirs(items: SkillFile[]) {
            for (const item of items) {
              if (item.type === 'directory') {
                dirs.add(item.path);
                if (item.children) collectDirs(item.children);
              }
            }
          }
          collectDirs(data.tree);
          setExpandedDirs(dirs);
          // 默认选中 SKILL.md
          const skillMd = data.tree.find((f: SkillFile) => f.name === 'SKILL.md');
          if (skillMd) {
            setSelectedFile(skillMd.path);
          }
        }
      } catch {
        console.error('无法加载技能包文件树');
      } finally {
        setLoading(false);
      }
    }
    fetchTree();
  }, [skillDir]);

  // 获取文件内容
  useEffect(() => {
    if (!selectedFile) {
      setFileContent('');
      return;
    }
    async function fetchContent() {
      try {
        const res = await fetch(`/api/skill-files?skillDir=${encodeURIComponent(skillDir)}&action=read&file=${encodeURIComponent(selectedFile!)}`);
        const data = await res.json();
        setFileContent(data.content || '');
      } catch {
        setFileContent('// 无法读取文件内容');
      }
    }
    fetchContent();
  }, [selectedFile, skillDir]);

  const toggleDir = (dirPath: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(dirPath)) {
        next.delete(dirPath);
      } else {
        next.add(dirPath);
      }
      return next;
    });
  };

  const getFileIcon = (name: string, type: string) => {
    if (type === 'directory') return <FolderOpen size={14} className="text-[#da7756]" />;
    if (name === 'SKILL.md') return <BookOpen size={14} className="text-blue-500" />;
    if (name === 'workflow.md') return <Workflow size={14} className="text-green-500" />;
    if (name === 'lessons.md') return <Lightbulb size={14} className="text-amber-500" />;
    if (name.endsWith('-template.md')) return <FileCheck size={14} className="text-purple-500" />;
    return <FileText size={14} className="text-[var(--muted)]" />;
  };

  const renderFileNode = (item: SkillFile, depth: number = 0) => {
    const isExpanded = expandedDirs.has(item.path);
    const isSelected = selectedFile === item.path;

    if (item.type === 'directory') {
      return (
        <div key={item.path}>
          <button
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs hover:bg-[var(--surface-hover)] rounded-md transition-colors"
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => toggleDir(item.path)}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {getFileIcon(item.name, 'directory')}
            <span className="font-medium text-[#1a1a1a]">{item.name}/</span>
          </button>
          {isExpanded && item.children?.map(child => renderFileNode(child, depth + 1))}
        </div>
      );
    }

    return (
      <button
        key={item.path}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md transition-colors ${
          isSelected
            ? 'bg-[#da7756]/10 text-[#da7756] font-medium'
            : 'hover:bg-[var(--surface-hover)] text-[#555]'
        }`}
        style={{ paddingLeft: `${depth * 16 + 26}px` }}
        onClick={() => setSelectedFile(item.path)}
      >
        {getFileIcon(item.name, 'file')}
        <span className="truncate">{item.name}</span>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--muted)]">
        <div className="animate-pulse flex items-center gap-2">
          <Package size={20} />
          <span>正在加载技能包...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：文件目录树 */}
      <div className="glass-card p-4 shadow-sm border-[rgba(0,0,0,0.08)]">
        <h3 className="text-sm font-bold flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-3 text-[#1a1a1a]">
          <Package size={16} className="text-[#da7756]" />
          技能包文件
        </h3>
        <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
          {fileTree.map(item => renderFileNode(item))}
        </div>
      </div>

      {/* 右侧：文件内容预览 */}
      <div className="lg:col-span-2 glass-card p-4 shadow-sm border-[rgba(0,0,0,0.08)] flex flex-col">
        <h3 className="text-sm font-bold flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-3 text-[#1a1a1a]">
          <FileText size={16} className="text-[var(--muted)]" />
          <span className="flex-1">{selectedFile || '选择文件预览'}</span>
          {selectedFile && (
            <span className="text-[10px] px-2 py-0.5 bg-[var(--surface-hover)] rounded-full text-[var(--muted)] font-normal">
              只读
            </span>
          )}
        </h3>
        <div className="flex-1 min-h-[300px] bg-[#fdfbf7] border border-[var(--border-color)] rounded-md overflow-auto shadow-inner">
          {selectedFile ? (
            <pre className="p-4 text-sm font-mono leading-relaxed text-[#2c2c2c] whitespace-pre-wrap break-words">
              {fileContent}
            </pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--muted)] gap-2">
              <FileText size={32} className="opacity-30" />
              <p className="text-sm">在左侧选择一个文件查看内容</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 主页面
// ============================================
export default function SkillsPage() {
  const { skills, selectedSkillId, selectSkill, updateSkill, deleteSkill } =
    useSkillStore();

  const [localSkill, setLocalSkill] = useState<Skill | null>(null);

  useEffect(() => {
    if (selectedSkillId) {
      const target = skills.find((s) => s.id === selectedSkillId);
      if (target) {
        setLocalSkill({ ...target });
      } else {
        setLocalSkill(null);
      }
    } else if (skills.length > 0) {
      selectSkill(skills[0].id);
    } else {
      setLocalSkill(null);
    }
  }, [selectedSkillId, skills, selectSkill]);

  const handleSave = () => {
    if (localSkill) {
      updateSkill(localSkill.id, localSkill);
      alert('技能配置已保存！');
    }
  };

  const handleDelete = () => {
    if (localSkill && confirm('确定要删除这个技能吗？')) {
      deleteSkill(localSkill.id);
    }
  };

  const isSkillPackage = !!localSkill?.skillDir;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {!localSkill ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--muted)]">
              <Cpu size={48} className="mb-4 opacity-50" />
              <p>请在左侧选择或新建一个 AI 技能</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
              {/* 头部信息 */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2 font-serif">
                    <Cpu size={24} className="text-[#da7756]" />
                    {isSkillPackage ? '技能包详情' : 'Skill 引擎配置'}
                  </h1>
                  <p className="text-sm text-[var(--muted)] mt-1 font-medium">
                    {isSkillPackage
                      ? 'Agent 模式 — LLM 将自主读取技能包文件并执行萃取'
                      : '配置 AI 模型的 System Prompt 与生成参数'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={handleDelete}>
                    <Trash2 size={16} />
                    删除
                  </button>
                  <button className="btn-primary" onClick={handleSave}>
                    <Save size={16} />
                    保存配置
                  </button>
                </div>
              </div>

              {/* 基础设置卡片 */}
              <div className="glass-card p-6 space-y-4 shadow-sm border-[rgba(0,0,0,0.08)]">
                <h2 className="text-sm font-bold flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-4 text-[#1a1a1a]">
                  <Settings2 size={16} className="text-[var(--muted)]" />
                  基础信息
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1.5 uppercase tracking-wider">
                      技能名称
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                      value={localSkill.name}
                      onChange={(e) => setLocalSkill({ ...localSkill, name: e.target.value })}
                      placeholder="例如：情报提取"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1.5 uppercase tracking-wider">
                      执行模式
                    </label>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                      isSkillPackage
                        ? 'border-[#da7756]/30 bg-[#da7756]/5 text-[#da7756]'
                        : 'border-blue-400/30 bg-blue-50 text-blue-500'
                    }`}>
                      {isSkillPackage ? (
                        <>
                          <Package size={14} />
                          <span className="font-medium">Agent 技能包模式</span>
                          <span className="text-[10px] ml-auto opacity-70">{localSkill.skillDir}</span>
                        </>
                      ) : (
                        <>
                          <FileText size={14} />
                          <span className="font-medium">单一 Prompt 模式</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1.5 uppercase tracking-wider">
                    功能描述
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                    value={localSkill.description}
                    onChange={(e) => setLocalSkill({ ...localSkill, description: e.target.value })}
                    placeholder="简短描述此技能的用途..."
                  />
                </div>
              </div>

              {/* 核心区域：技能包浏览器 或 旧版 Prompt 编辑器 */}
              {isSkillPackage ? (
                <SkillPackageBrowser skillDir={localSkill.skillDir!} />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 glass-card p-6 flex flex-col shadow-sm border-[rgba(0,0,0,0.08)]">
                    <h2 className="text-sm font-bold flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4 text-[#1a1a1a]">
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-[var(--muted)]" />
                        Prompt 模板
                      </div>
                    </h2>
                    <p className="text-xs text-[var(--muted)] mb-3 leading-relaxed">
                      编写指示 AI 工作流的提示词。你可以使用 <code className="text-[#da7756] bg-[var(--surface-hover)] px-1 py-0.5 rounded">{'{{content}}'}</code> 占位符，执行时它会被自动替换为当前选中的文档全文。
                    </p>
                    <textarea
                      className="flex-1 w-full min-h-[300px] bg-[#fdfbf7] border border-[var(--border-color)] rounded-md p-4 text-sm font-mono leading-relaxed focus:outline-none focus:border-[var(--muted)] resize-y transition-colors text-[#2c2c2c] shadow-inner"
                      value={localSkill.promptTemplate || ''}
                      onChange={(e) => setLocalSkill({ ...localSkill, promptTemplate: e.target.value })}
                      placeholder="请输入你的 System Prompt..."
                    />
                  </div>

                  {/* Model Config — 旧版模式下才需要独立显示 */}
                  <div className="glass-card p-6 h-fit space-y-6 shadow-sm border-[rgba(0,0,0,0.08)]">
                    <h2 className="text-sm font-bold flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-4 text-[#1a1a1a]">
                      <Settings2 size={16} className="text-[var(--muted)]" />
                      模型参数
                    </h2>
                    <ModelConfigPanel localSkill={localSkill} setLocalSkill={setLocalSkill} />
                  </div>
                </div>
              )}

              {/* 技能包模式下的模型参数单独一行 */}
              {isSkillPackage && (
                <div className="glass-card p-6 shadow-sm border-[rgba(0,0,0,0.08)]">
                  <h2 className="text-sm font-bold flex items-center gap-2 border-b border-[var(--border-color)] pb-3 mb-4 text-[#1a1a1a]">
                    <Settings2 size={16} className="text-[var(--muted)]" />
                    模型参数
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ModelConfigPanel localSkill={localSkill} setLocalSkill={setLocalSkill} />
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ============================================
// 模型参数配置面板 (复用)
// ============================================
function ModelConfigPanel({ localSkill, setLocalSkill }: { localSkill: Skill; setLocalSkill: (s: Skill) => void }) {
  return (
    <>
      <div>
        <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">
          选择后端模型
        </label>
        <select
          className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm appearance-none focus:outline-none focus:border-[var(--accent)]"
          value={localSkill.modelConfig.model}
          onChange={(e) => setLocalSkill({
            ...localSkill,
            modelConfig: { ...localSkill.modelConfig, model: e.target.value }
          })}
        >
          <option value="Qwen3-Max">Qwen3-Max (旗舰/深度推理)</option>
          <option value="Qwen3-Plus">Qwen3-Plus (均衡/性价比)</option>
          <option value="Qwen3-Turbo">Qwen3-Turbo (快速/轻量)</option>
        </select>
      </div>

      <div>
        <label className="flex items-center justify-between text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">
          <span>Temperature (发散度)</span>
          <span className="text-[var(--foreground)]">{localSkill.modelConfig.temperature.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          className="w-full accent-[#da7756]"
          value={localSkill.modelConfig.temperature}
          onChange={(e) => setLocalSkill({
            ...localSkill,
            modelConfig: { ...localSkill.modelConfig, temperature: parseFloat(e.target.value) }
          })}
        />
        <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1">
          <span>0.0 (严谨/提取)</span>
          <span>2.0 (发散/创作)</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--muted)] mb-2 uppercase tracking-wider">
          Max Tokens (最大输出限制)
        </label>
        <input
          type="number"
          step="100"
          className="w-full bg-[var(--surface)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
          value={localSkill.modelConfig.maxTokens}
          onChange={(e) => setLocalSkill({
            ...localSkill,
            modelConfig: { ...localSkill.modelConfig, maxTokens: parseInt(e.target.value) || 1000 }
          })}
        />
      </div>
    </>
  );
}
