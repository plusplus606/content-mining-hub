'use client';

import { useState, useRef, useEffect } from 'react';
import { useFileStore } from '@/store/useFileStore';
import { getDocumentById } from '@/data/mockData';
import { getFileIcon, getFileTypeLabel } from '@/components/ui/Icons';
import { 
  X, 
  FileText, 
  Sparkles, 
  Send,
  Loader2,
  Clock,
  HardDrive
} from 'lucide-react';

// ==========================================
// 简易 Markdown 转 HTML（复用原有渲染逻辑）
// ==========================================
function renderMarkdown(content: string): string {
  let html = content;

  // 处理表格
  html = html.replace(/^\|(.+)\|$/gm, (match) => match);
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
      if (line.match(/^\|[\s-:|]+\|$/)) continue;

      const cells = line.slice(1, -1).split('|').map((c) => c.trim());
      const isHeader = i + 1 < lines.length && lines[i + 1].trim().match(/^\|[\s-:|]+\|$/);
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

  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^(?!<[hublotdra])((?!<).+)$/gm, '<p>$1</p>');
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

// ==========================================
// 主组件
// ==========================================
export default function DocumentChatModal() {
  const viewingDocumentId = useFileStore(state => state.viewingDocumentId);
  const setViewingDocumentId = useFileStore(state => state.setViewingDocumentId);
  const documents = useFileStore(state => state.documents);
  
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: '您好！我已经阅读了这篇文档，您可以向我提问任何关于文档内容的问题，或者让我基于文档帮您生成其他材料。' }
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 监听回滚
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isProcessing]);

  if (!viewingDocumentId) return null;

  const storeDoc = documents.find((d) => d.id === viewingDocumentId);
  const doc = storeDoc ?? getDocumentById(viewingDocumentId);

  if (!doc) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl">
          <p className="text-gray-500 mb-4">抱歉，找不到该文档。</p>
          <button className="btn-primary" onClick={() => setViewingDocumentId(null)}>关闭</button>
        </div>
      </div>
    );
  }

  const { icon: FileIcon, className: iconClass } = getFileIcon(doc.fileType);
  const typeLabel = getFileTypeLabel(doc.fileType);
  const isJsonContent = doc.fileType === 'json';

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

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isProcessing) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      // 通过 /api/extract 接口模拟一次对话生成
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `--- 文档正文 ---\n${doc.content}\n--- 用户问题 ---\n${userMessage}`,
          promptTemplate: "你是一个专业的AI研课助手。请仔细阅读文档正文，并详细、准确地回答用户的问题。如果问题超出了文档范围，可以适当延伸，但要表明是外部知识。",
          modelConfig: { model: 'gpt-4o', temperature: 0.7 },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成失败');

      setChatHistory(prev => [...prev, { role: 'assistant', content: data.result }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `**对话出错：** ${err.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-fade-in">
      <div className="bg-white w-full max-w-[1400px] h-full max-h-[90vh] rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden scale-in-center">
        
        {/* Header */}
        <div className="flex-shrink-0 h-16 border-b border-[#f1f3f4] px-6 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-100 ${iconClass}`}>
              <FileIcon size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1a1a1a] leading-tight mb-0.5 max-w-lg truncate">{doc.name}</h2>
              <div className="flex items-center gap-3 text-[11px] text-[#9aa0a6] font-medium">
                <span className="flex items-center gap-1"><Clock size={10} /> {formatDateTime(doc.updatedAt)}</span>
                <span className="flex items-center gap-1"><HardDrive size={10} /> {formatFileSize(doc.size)}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#f5f5f5] text-[10px] uppercase tracking-wider">{typeLabel}</span>
              </div>
            </div>
          </div>
          
          <button 
            className="p-2 hover:bg-gray-100 rounded-full text-[#9aa0a6] hover:text-[#1a1a1a] transition-colors"
            onClick={() => setViewingDocumentId(null)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body (Split View) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* 左侧：文档查看器 */}
          <div className="w-1/2 flex flex-col border-r border-[#f1f3f4] bg-white">
            <div className="h-10 border-b border-[#f8f9fa] bg-[#fafafa] flex items-center px-6 flex-shrink-0">
              <FileText size={14} className="text-[#9aa0a6] mr-2" />
              <span className="text-[12px] font-bold text-[#5f6368] uppercase tracking-wider">原始文档内容</span>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto prose-dark" dangerouslySetInnerHTML={{ __html: renderedContent }} />
            </div>
          </div>

          {/* 右侧：AI 对话栏 */}
          <div className="w-1/2 flex flex-col bg-[#fdfbf7]">
            <div className="h-10 border-b border-[#f1f3f4] bg-white flex items-center px-6 flex-shrink-0">
              <Sparkles size={14} className="text-[#da7756] mr-2" />
              <span className="text-[12px] font-bold text-[#5f6368] uppercase tracking-wider">AI 研课对话</span>
            </div>
            
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-[#da7756] text-white shadow-md' : 'bg-gray-200 text-gray-600'}`}>
                    {msg.role === 'assistant' ? <Sparkles size={14} /> : <span className="text-xs font-bold">ME</span>}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-[#1a1a1a] text-white rounded-tr-sm' 
                      : 'bg-white border border-[#eef0f2] shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-[#2c2c2c] rounded-tl-sm prose-light'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-[14px] leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="text-[14px]" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    )}
                  </div>
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#da7756] text-white flex items-center justify-center flex-shrink-0 shadow-md">
                    <Sparkles size={14} />
                  </div>
                  <div className="bg-white border border-[#eef0f2] rounded-2xl rounded-tl-sm px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-2">
                    <Loader2 size={16} className="text-[#da7756] animate-spin" />
                    <span className="text-[13px] text-[#9aa0a6] font-medium">正在深度思考中...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-6 bg-white border-t border-[#f1f3f4]">
              <div className="flex items-end gap-2 bg-[#f8f9fa] border border-[#eef0f2] rounded-2xl p-2 focus-within:border-[#da7756]/40 focus-within:bg-white focus-within:shadow-[0_4px_20px_rgba(218,119,86,0.08)] transition-all">
                <textarea
                  rows={2}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="基于该文档向我提问，或让我生成内容..."
                  className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#2c2c2c] placeholder-[#9aa0a6] resize-none px-3 py-2"
                  disabled={isProcessing}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isProcessing}
                  className="w-10 h-10 rounded-xl bg-[#1a1a1a] text-white flex items-center justify-center flex-shrink-0 hover:bg-black disabled:opacity-30 transition-all mb-1 mr-1"
                >
                  <Send size={16} className="ml-0.5" />
                </button>
              </div>
              <p className="text-center text-[11px] text-[#aaa] mt-3 font-medium tracking-wide">
                AI 可能会生成不准确的信息，请核实其回答。
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
