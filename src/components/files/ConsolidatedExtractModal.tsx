'use client';

import { useState } from 'react';
import { 
  X, 
  Zap, 
  Cpu, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useFileStore } from '@/store/useFileStore';
import { useSkillStore } from '@/store/useSkillStore';
import { Document } from '@/types';

interface ConsolidatedExtractModalProps {
  onClose: () => void;
}

export default function ConsolidatedExtractModal({ onClose }: ConsolidatedExtractModalProps) {
  const { selectedDocumentIds, documents, addDocument, clearSelection } = useFileStore();
  const { skills } = useSkillStore();
  
  const [step, setStep] = useState<'select-skill' | 'processing' | 'done'>('select-skill');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultDoc, setResultDoc] = useState<Document | null>(null);

  // 获取选中的文档对象
  const selectedDocs = documents.filter(d => selectedDocumentIds.has(d.id));

  const handleStartExtraction = async () => {
    if (!selectedSkillId || selectedDocs.length === 0) return;
    
    const skill = skills.find(s => s.id === selectedSkillId);
    if (!skill) return;

    setStep('processing');
    setIsExtracting(true);
    setError(null);

    try {
      // 1. 合并内容
      const mergedContent = selectedDocs
        .map(doc => `--- 源文件: ${doc.name} ---\n${doc.content}`)
        .join('\n\n');

      // 2. 调用 API
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: mergedContent,
          skillDir: skill.skillDir,
          promptTemplate: skill.promptTemplate,
          modelConfig: skill.modelConfig,
          isConsolidated: true, // 告知后端这是合并萃取（可选，用于 API 内部日志）
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '萃取失败');

      // 3. 构造新文档并保存
      const resultName = `${selectedDocs[0].name.replace(/\.[^/.]+$/, "")}${selectedDocs.length > 1 ? `等${selectedDocs.length}个文件` : ''}的合并萃取.md`;
      
      const newDoc: Document = {
        id: `extracted-${Date.now()}`,
        folderId: 'root-extracted',
        name: resultName,
        fileType: 'markdown',
        size: data.result.length,
        content: data.result,
        metadata: {},
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      addDocument(newDoc);
      setResultDoc(newDoc);
      clearSelection();
      setStep('done');
    } catch (err: any) {
      setError(err.message);
      setStep('select-skill'); // 返回第一步重新尝试
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-2xl bg-white/95 overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 flex items-center justify-between bg-[var(--surface)]">
          <div>
            <h2 className="text-xl font-bold text-[#1a1a1a] font-serif flex items-center gap-2">
              <Zap className="text-[#da7756]" size={20} />
              多文件合并萃取
            </h2>
            <p className="text-xs text-[var(--muted)] mt-1">
              将 {selectedDocs.length} 个文件源进行交叉分析，输出一份综合报告
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
            disabled={isExtracting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'select-skill' && (
            <div className="space-y-6">
              {/* 选中的文件列表 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-[#1a1a1a] flex items-center gap-2">
                  <FileText size={14} className="text-[var(--muted)]" />
                  待处理文档
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDocs.map(doc => (
                    <div key={doc.id} className="p-2 px-3 rounded bg-[#f5f5f5] border border-black/5 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#da7756]" />
                      <span className="text-xs font-medium truncate">{doc.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 技能选择 */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-[#1a1a1a]">选择萃取技能 (Skill)</h3>
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-xs">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}
                <div className="space-y-3">
                  {skills.map(skill => (
                    <div 
                      key={skill.id}
                      onClick={() => !isExtracting && setSelectedSkillId(skill.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all group ${
                        selectedSkillId === skill.id 
                          ? 'border-[#da7756] bg-[#da7756]/5 shadow-sm' 
                          : 'border-black/5 bg-white hover:border-black/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          selectedSkillId === skill.id ? 'bg-[#da7756] text-white' : 'bg-black/5 text-[var(--muted)]'
                        }`}>
                          <Cpu size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-[#1a1a1a]">{skill.name}</h4>
                          <p className="text-xs text-[var(--muted)] truncate mt-0.5">{skill.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="h-64 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-[#da7756]/20 rounded-full animate-ping" />
                <div className="relative z-10 w-20 h-20 rounded-full bg-[#da7756]/10 flex items-center justify-center text-[#da7756]">
                  <Loader2 size={40} className="animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1a1a1a]">正在合并分析...</h3>
                <p className="text-sm text-[var(--muted)] max-w-xs mt-2 mx-auto">
                  Agent 正在研读技能包并交叉比对 {selectedDocs.length} 份源文件，这可能需要几十秒。
                </p>
              </div>
              
              {/* 模拟进度条 */}
              <div className="w-full max-w-xs h-1.5 bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#da7756] animate-[progress_20s_infinite]" />
              </div>
            </div>
          )}

          {step === 'done' && resultDoc && (
            <div className="h-64 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in-up">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1a1a1a]">合并萃取成功！</h3>
                <p className="text-sm text-[var(--muted)] mt-2">
                  已生成新文档：<span className="font-semibold text-[#1a1a1a]">{resultDoc.name}</span>
                </p>
                <p className="text-xs text-green-600 font-medium mt-1">已自动保存至「萃取结果」文件夹</p>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="btn-ghost !px-6"
                >
                  关闭
                </button>
                <Link 
                  href={`/document/${resultDoc.id}`}
                  className="btn-primary !px-6 flex items-center gap-2"
                >
                  立即查看
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'select-skill' && (
          <div className="p-6 border-t border-black/5 bg-[#fcfcfc] flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium hover:bg-black/5 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              disabled={!selectedSkillId || isExtracting}
              onClick={handleStartExtraction}
              className="btn-primary !py-2.5 !px-8 flex items-center gap-2 shadow-lg shadow-[#da7756]/20 disabled:opacity-50 disabled:shadow-none"
            >
              <Zap size={16} />
              开始执行
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
