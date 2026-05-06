'use client';

import { useState } from 'react';
import { Search, Plus, ChevronDown } from 'lucide-react';
import { useSkillStore } from '@/store/useSkillStore';

export default function SkillManager() {
  const { skills } = useSkillStore();
  const [activeTab, setActiveTab] = useState<'discover' | 'mine'>('discover');
  const [subTab, setSubTab] = useState<'added' | 'created'>('added');

  return (
    <div className="max-w-7xl mx-auto animate-fade-in-up mt-4">
      {/* 头部区域 */}
      <div className="flex items-center justify-between mb-12">
        <div className="max-w-xl">
          <h1 className="text-[42px] font-extrabold text-[var(--foreground)] leading-tight tracking-tight mb-4 font-serif">
            技能广场
          </h1>
          <p className="text-[15px] text-[var(--muted)] mb-8 font-medium">
            贝壳学习教育专属技能。探索、安装和使用由专家构建的强大 AI 能力。
          </p>
          <button className="btn-primary px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all shadow-md shadow-black/10">
            <Plus size={18} />
            创建
          </button>
        </div>
        
        {/* 占位插画 - 使用实际提供的截图或者系统样式绘制 */}
        <div className="hidden lg:block relative w-[380px] h-[220px]">
          <img 
            src="/images/skills-illustration.png" 
            alt="Skills Illustration" 
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>
      </div>

      {/* 过滤导航条 */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4 ${activeTab === 'discover' ? 'mb-8' : 'mb-0'}`}>
        {/* Tabs */}
        <div className="flex items-center gap-6">
          <button 
            className={`text-[20px] transition-colors font-sans tracking-tight ${
              activeTab === 'discover' 
                ? 'text-[var(--foreground)] font-bold' 
                : 'text-[var(--muted)] font-medium hover:text-[var(--foreground)]'
            }`}
            onClick={() => setActiveTab('discover')}
          >
            技能发现
          </button>
          <button 
            className={`text-[20px] transition-colors font-sans tracking-tight ${
              activeTab === 'mine' 
                ? 'text-[var(--foreground)] font-bold' 
                : 'text-[var(--muted)] font-medium hover:text-[var(--foreground)]'
            }`}
            onClick={() => setActiveTab('mine')}
          >
            我的技能
          </button>
        </div>

        {/* 筛选和搜索 */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="搜索你想要的Skills"
              className="pl-10 pr-4 py-2 border border-[var(--border-color)] bg-[var(--surface)] rounded-xl text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] w-64 transition-all placeholder:text-[var(--muted)]"
            />
          </div>
          
          <button className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors">
            流行
            <ChevronDown size={14} className="opacity-70" />
          </button>
        </div>
      </div>

      {/* 子 Tabs (仅在我的技能下展示) */}
      {activeTab === 'mine' && (
        <div className="bg-gray-100/60 p-1 rounded-xl flex items-center w-fit mt-4 mb-6">
          <button 
            className={`px-4 py-1.5 rounded-[10px] text-[13px] font-medium transition-all ${
              subTab === 'added' 
                ? 'bg-white text-[var(--foreground)] shadow-sm' 
                : 'text-[var(--muted)] hover:text-[#333]'
            }`}
            onClick={() => setSubTab('added')}
          >
            我添加的
          </button>
          <button 
            className={`px-4 py-1.5 rounded-[10px] text-[13px] font-medium transition-all ${
              subTab === 'created' 
                ? 'bg-white text-[var(--foreground)] shadow-sm' 
                : 'text-[var(--muted)] hover:text-[#333]'
            }`}
            onClick={() => setSubTab('created')}
          >
            我创建的
          </button>
        </div>
      )}

      {/* 技能卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-12">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="glass-card bg-[var(--surface)] border border-[var(--border-color)] rounded-2xl p-5 hover:border-[var(--accent)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col group cursor-pointer"
          >
            <h3 className="font-bold text-[15px] text-[var(--foreground)] mb-2 font-mono group-hover:text-[var(--accent)] transition-colors">
              {skill.name}
            </h3>
            <p className="text-[13px] text-[var(--muted)] leading-relaxed mb-6 line-clamp-3 ext-ellipsis flex-1">
              {skill.description}
            </p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded overflow-hidden bg-[var(--surface-hover)] flex items-center justify-center border border-[var(--border-color)]">
                  {/* default logo mock */}
                  <div className="w-3 h-3 bg-[var(--foreground)] rounded-[3px]" />
                </div>
                <span className="text-[12px] font-medium text-[var(--muted)]">
                  官方预设
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
