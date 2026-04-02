'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Download,
  Clock,
  HardDrive,
  Zap,
  X,
  Cpu,
  Loader2,
} from 'lucide-react';
import { getDocumentById } from '@/data/mockData';
import { useFileStore } from '@/store/useFileStore';
import { useSkillStore } from '@/store/useSkillStore';
import { getFileIcon, getFileTypeLabel } from '@/components/ui/Icons';

// 简易 Markdown 转 HTML（支持基本语法）
function renderMarkdown(content: string): string {
  let html = content;

  // 处理表格
  html = html.replace(
    /^\|(.+)\|$/gm,
    (match) => {
      return match;
    }
  );

  // 先处理表格块
  const lines = html.split('\n');
  let inTable = false;
  let tableHtml = '';
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHtml = '<table>';
      }
      // 跳过分隔行
      if (line.match(/^\|[\s-:|]+\|$/)) continue;

      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      const isHeader =
        i + 1 < lines.length &&
        lines[i + 1].trim().match(/^\|[\s-:|]+\|$/);
      const tag = isHeader ? 'th' : 'td';
      tableHtml += `<tr>${cells.map((c) => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
    } else {
      if (inTable) {
        tableHtml += '</table>';
        result.push(tableHtml);
        tableHtml = '';
        inTable = false;
      }
      result.push(line);
    }
  }
  if (inTable) {
    tableHtml += '</table>';
    result.push(tableHtml);
  }
  html = result.join('\n');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');

  // Paragraphs (wrap remaining plain text)
  html = html.replace(
    /^(?!<[hublotdra])((?!<).+)$/gm,
    '<p>$1</p>'
  );

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');

  return html;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const storeDoc = useFileStore((s) => s.documents.find((d) => d.id === id));
  const doc = storeDoc ?? getDocumentById(id);
  const { skills } = useSkillStore();

  const [showSkillModal, setShowSkillModal] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedResult, setExtractedResult] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!selectedSkillId || !doc) return;
    const skill = skills.find((s) => s.id === selectedSkillId);
    if (!skill) return;

    setShowSkillModal(false);
    setIsExtracting(true);
    setExtractedResult(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: doc.content,
          skillDir: skill.skillDir,           // Agent 模式：传递技能包目录
          promptTemplate: skill.promptTemplate, // 兼容简单模式
          modelConfig: skill.modelConfig,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '萃取失败');
      }

      setExtractedResult(data.result);
    } catch (err: any) {
      alert(`萃取过程出错: ${err.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  if (!doc) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            文档未找到
          </h2>
          <p className="text-[var(--muted)] mb-4">
            找不到 ID 为 &quot;{id}&quot; 的文档
          </p>
          <Link href="/" className="btn-primary">
            <ArrowLeft size={16} />
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const { icon: FileIcon, className: iconClass } = getFileIcon(doc.fileType);
  const typeLabel = getFileTypeLabel(doc.fileType);
  const isJsonContent = doc.fileType === 'json';

  // 渲染内容
  let renderedContent: string;
  if (isJsonContent) {
    try {
      const parsed = JSON.parse(doc.content);
      renderedContent = `<pre style="white-space: pre-wrap; word-break: break-word; font-size: 13px; line-height: 1.6;">${JSON.stringify(parsed, null, 2)}</pre>`;
    } catch {
      renderedContent = `<pre>${doc.content}</pre>`;
    }
  } else {
    renderedContent = renderMarkdown(doc.content);
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--background)]">
      {/* 顶部工具栏 */}
      <header className="h-14 border-b border-[var(--border-color)] bg-[var(--surface)] flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="btn-ghost !p-2"
            aria-label="返回"
            id="btn-back"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex items-center gap-3">
            <FileIcon size={20} className={iconClass} />
            <div>
              <h1 className="text-sm font-semibold text-[var(--foreground)]">
                {doc.name}
              </h1>
              <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {formatDateTime(doc.updatedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive size={10} />
                  {formatFileSize(doc.size)}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[10px] font-medium">
                  {typeLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-ghost" id="btn-export">
            <Download size={16} />
            <span>导出</span>
          </button>
          <button className="btn-primary" id="btn-extract" onClick={() => setShowSkillModal(true)}>
            <Zap size={16} />
            <span>执行萃取</span>
          </button>
        </div>
      </header>

      {/* 双栏对比视图 */}
      <main className="flex-1 overflow-hidden p-6">
        <div className="split-view h-full">
          {/* 左栏：原始文档 */}
          <div className="split-pane animate-fade-in-up">
            <div className="split-pane-header">
              <FileText size={16} className="text-[var(--muted)]" />
              <span className="font-serif">原始文档</span>
            </div>
            <div
              className="split-pane-body prose-dark"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          </div>

          {/* 右栏：AI 萃取结果 */}
          <div
            className="split-pane animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="split-pane-header bg-[#fdfbf7]">
              <Sparkles size={16} className="text-[#da7756]" />
              <span className="font-serif">AI 萃取结果</span>
              <span className="ml-auto text-[11px] text-[var(--muted)] px-2 py-0.5 rounded-full bg-[var(--surface-hover)]">
                {isExtracting ? '提取中...' : extractedResult ? '已完成' : '等待萃取'}
              </span>
            </div>
            <div className={`split-pane-body ${extractedResult && !isExtracting ? 'prose-light' : ''} bg-[#fdfbf7]`}>
              {isExtracting ? (
                <div className="h-full flex flex-col items-center justify-center text-[var(--muted)] space-y-4">
                  <Loader2 size={32} className="animate-spin text-[#da7756]" />
                  <p className="text-sm font-medium">分析引擎正在处理，请稍候...</p>
                </div>
              ) : extractedResult ? (
                <div
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(extractedResult) }}
                />
              ) : (
                <div className="empty-state h-full">
                  <div className="w-16 h-16 rounded-xl bg-[#f5f5f5] flex items-center justify-center">
                    <Sparkles size={24} className="text-[var(--muted)]" />
                  </div>
                  <h3 className="text-base font-medium text-[var(--foreground)] font-serif">
                    尚未执行萃取
                  </h3>
                  <p className="text-sm max-w-xs">
                    点击右上角「执行萃取」按钮，选择一个 AI Skill 来提取结构化内容。
                  </p>
                  <button className="btn-primary mt-4" id="btn-extract-empty" onClick={() => setShowSkillModal(true)}>
                    <Zap size={16} />
                    <span>选择 Skill 并萃取</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 选择 Skill Modal */}
      {showSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSkillModal(false)}>
          <div className="glass-card w-full max-w-md p-6 mx-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                选择已配置的 Skill
              </h2>
              <button className="btn-ghost !p-1.5" onClick={() => setShowSkillModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {skills.map(skill => (
                <div 
                  key={skill.id}
                  onClick={() => setSelectedSkillId(skill.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSkillId === skill.id 
                      ? 'border-[#da7756] bg-[rgba(218,119,86,0.05)]' 
                      : 'border-[var(--border-color)] bg-[var(--surface)] hover:border-[rgba(0,0,0,0.15)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu size={14} className={selectedSkillId === skill.id ? 'text-[#da7756]' : 'text-[var(--muted)]'} />
                    <h3 className="text-sm font-medium text-[var(--foreground)]">{skill.name}</h3>
                  </div>
                  <p className="text-xs text-[var(--muted)] line-clamp-1">{skill.description || '无描述'}</p>
                </div>
              ))}
              {skills.length === 0 && (
                <p className="text-sm text-center text-[var(--muted)] py-4">暂无可用 Skill，请前往 Skill 引擎配置。</p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[var(--border-color)]">
              <button className="btn-ghost" onClick={() => setShowSkillModal(false)}>
                取消
              </button>
              <button 
                className="btn-primary" 
                disabled={!selectedSkillId} 
                onClick={handleExtract}
              >
                <Zap size={16} />
                开始执行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
