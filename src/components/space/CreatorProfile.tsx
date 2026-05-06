'use client';

import { useUserStore } from '@/store/useUserStore';
import { TargetStudent } from '@/types';
import {
  User, Briefcase, Mic2, Target, Save, CheckCircle2, Plus, X,
  Award, BookOpen, Clock, Users, Sparkles, GraduationCap, Pencil,
  TrendingUp,
} from 'lucide-react';
import { useState, useEffect } from 'react';

// ========== 子组件：可编辑标签组 ==========
function TagEditor({
  tags,
  onChange,
  suggestions,
  accentColor = '#da7756',
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  accentColor?: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{ background: `${accentColor}14`, color: accentColor }}
          >
            {tag}
            <button
              onClick={() => removeTag(i)}
              className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <div className="inline-flex items-center gap-1 bg-[var(--surface-hover)] border border-dashed border-[var(--border-color)] rounded-full px-3 py-1.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTag(inputValue);
            }}
            placeholder="添加标签..."
            className="bg-transparent border-none outline-none text-xs w-20 text-[var(--foreground)] placeholder-[var(--muted)]"
          />
          <button
            onClick={() => addTag(inputValue)}
            disabled={!inputValue.trim()}
            className="text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !tags.includes(s))
            .map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => addTag(suggestion)}
                className="text-[10px] px-2.5 py-1 border border-[var(--border-color)] rounded-full hover:border-[#da7756] hover:text-[#da7756] transition-colors text-[var(--muted)]"
              >
                + {suggestion}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

// ========== 主组件 ==========
export default function CreatorProfile() {
  const { profile, updateProfile, addTargetStudent, removeTargetStudent } = useUserStore();
  const [localProfile, setLocalProfile] = useState({ ...profile });
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', description: '' });

  // 当 store 中的 profile 变化时同步到本地
  useEffect(() => {
    setLocalProfile({ ...profile });
  }, [profile]);

  const handleSave = () => {
    updateProfile(localProfile);
    setIsSaved(true);
    setIsEditing(false);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddStudent = () => {
    if (!newStudent.name.trim()) return;
    const student: TargetStudent = {
      id: `ts-${Date.now()}`,
      name: newStudent.name.trim(),
      description: newStudent.description.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newStudent.name.trim()}`,
    };
    addTargetStudent(student);
    setNewStudent({ name: '', description: '' });
    setShowAddStudent(false);
  };

  const teachingStyleSuggestions = [
    '实战落地', '案例驱动', '数据说话', '场景还原', '互动讨论',
    '启发引导', '幽默风趣', '循序渐进', '深度剖析', '问题导向',
  ];

  const expertiseSuggestions = [
    '业务萃取', '课程设计', '方法论构建', '案例教学', 'AI 辅助研课',
    '组织发展', '绩效改善', '人才培养', '知识管理',
  ];

  // ========== 展示模式 ==========
  if (!isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
        {/* ——— 讲师名片头卡 ——— */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#2d2520] p-8 text-white">
          {/* 装饰元素 */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#da7756]/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#da7756]/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
          
          <div className="relative flex items-start gap-6">
            {/* 头像 */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#da7756] to-[#f5a623] flex items-center justify-center text-white text-3xl font-bold shadow-xl flex-shrink-0">
              {localProfile.name.charAt(0)}
            </div>

            {/* 信息区 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{localProfile.name}</h1>
                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[11px] font-semibold tracking-wider border border-white/10">
                  {localProfile.title}
                </span>
              </div>
              <p className="text-white/50 text-sm mt-1 font-medium">{localProfile.industry || '培训与组织发展'}</p>

              <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-xl">
                {localProfile.bio}
              </p>

              {/* 统计小徽章 */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <Clock size={13} />
                  <span><strong className="text-white/80">{localProfile.yearsOfExperience || 8}</strong> 年从业</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <Users size={13} />
                  <span><strong className="text-white/80">{localProfile.targetStudents?.length || 0}</strong> 类授课对象</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/50 text-xs">
                  <BookOpen size={13} />
                  <span><strong className="text-white/80">{localProfile.expertise?.length || 0}</strong> 个专业领域</span>
                </div>
              </div>
            </div>

            {/* 编辑按钮 */}
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-sm font-medium hover:bg-white/20 transition-all flex-shrink-0"
            >
              <Pencil size={14} />
              编辑
            </button>
          </div>
        </div>

        {/* ——— 三栏信息区 ——— */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 专业领域 */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-[var(--muted)] flex items-center gap-2 uppercase tracking-widest">
              <Briefcase size={14} className="text-[#da7756]" />
              专业领域
            </h3>
            <div className="flex flex-wrap gap-2">
              {(localProfile.expertise || []).map((tag, i) => (
                <span key={i} className="px-3 py-1.5 bg-[rgba(218,119,86,0.08)] text-[#da7756] text-[11px] font-semibold rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 授课风格 */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-[var(--muted)] flex items-center gap-2 uppercase tracking-widest">
              <Mic2 size={14} className="text-[#da7756]" />
              授课风格
            </h3>
            <div className="flex flex-wrap gap-2">
              {(localProfile.teachingStyles || []).map((tag, i) => (
                <span key={i} className="px-3 py-1.5 bg-[rgba(59,130,246,0.08)] text-[#3b82f6] text-[11px] font-semibold rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 资质成就 */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-[var(--muted)] flex items-center gap-2 uppercase tracking-widest">
              <Award size={14} className="text-[#da7756]" />
              资质成就
            </h3>
            <ul className="space-y-2">
              {(localProfile.achievements || []).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[var(--foreground)] leading-relaxed">
                  <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ——— 授课对象卡片 (与对话框联动) ——— */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1a1a1a] flex items-center gap-2">
              <GraduationCap size={16} className="text-[#da7756]" />
              授课对象
              <span className="text-[10px] font-medium text-[var(--muted)] bg-[var(--surface-hover)] px-2 py-0.5 rounded-full ml-1">
                与研课工作台联动
              </span>
            </h3>
            <button
              onClick={() => setShowAddStudent(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#da7756] hover:text-[#c56546] transition-colors px-3 py-1.5 rounded-lg hover:bg-[rgba(218,119,86,0.06)]"
            >
              <Plus size={14} />
              添加对象
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(localProfile.targetStudents || []).map((student) => (
              <div
                key={student.id}
                className="group relative flex items-center gap-3 p-4 rounded-xl border border-[var(--border-color)] bg-white hover:border-[#da7756]/30 hover:shadow-[0_4px_20px_rgba(218,119,86,0.06)] transition-all"
              >
                <img
                  src={student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
                  alt={student.name}
                  className="w-10 h-10 rounded-full bg-gray-100 border border-gray-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1a1a] truncate">{student.name}</p>
                  <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">{student.description}</p>
                </div>
                <button
                  onClick={() => removeTargetStudent(student.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg text-[var(--muted)] hover:text-red-500 transition-all absolute top-2 right-2"
                  title="移除"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* 添加授课对象弹出 */}
          {showAddStudent && (
            <div className="border border-[#da7756]/20 bg-[rgba(218,119,86,0.02)] rounded-xl p-4 space-y-3 animate-fade-in-up">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted)] mb-1.5 uppercase tracking-widest">名称</label>
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="如：新入职经纪人"
                    className="w-full bg-white border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#da7756] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--muted)] mb-1.5 uppercase tracking-widest">描述</label>
                  <input
                    type="text"
                    value={newStudent.description}
                    onChange={(e) => setNewStudent({ ...newStudent, description: e.target.value })}
                    placeholder="简要描述该群体特征"
                    className="w-full bg-white border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#da7756] transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setShowAddStudent(false); setNewStudent({ name: '', description: '' }); }}
                  className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddStudent}
                  disabled={!newStudent.name.trim()}
                  className="text-xs font-semibold text-white bg-[#1a1a1a] hover:bg-[#333] disabled:opacity-30 px-4 py-1.5 rounded-lg transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ——— 内容偏好说明 ——— */}
        <div className="glass-card p-6 space-y-3">
          <h3 className="text-xs font-bold text-[var(--muted)] flex items-center gap-2 uppercase tracking-widest">
            <TrendingUp size={14} className="text-[#da7756]" />
            内容偏好
          </h3>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            {localProfile.contentPreferences}
          </p>
        </div>

        {/* ——— AI 联动提示 ——— */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[rgba(218,119,86,0.05)] to-[rgba(245,166,35,0.05)] border border-[rgba(218,119,86,0.1)]">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Sparkles size={18} className="text-[#da7756]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#da7756]">讲师画像如何影响 AI 成课</h3>
              <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                您录入的讲师画像信息，将自动注入 AI 成课的上下文。AI 会根据您的授课风格、专业领域和内容偏好，调整输出内容的语气、深度和侧重点。
                <strong className="text-[var(--foreground)]">授课对象</strong>与研课工作台中"向 xxx 授课"选项同步，确保课程始终贴合目标学员的实际需求。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== 编辑模式 ==========
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up pb-10">
      {/* 编辑顶栏 */}
      <div className="flex items-center justify-between p-6 glass-card border-[rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#da7756] to-[#f5a623] flex items-center justify-center text-white text-lg font-bold shadow-md">
            {localProfile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1a1a1a]">编辑讲师画像</h1>
            <p className="text-xs text-[var(--muted)]">修改完成后点击保存，即刻生效</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLocalProfile({ ...profile }); setIsEditing(false); }}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-hover)] transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all ${
              isSaved ? 'bg-emerald-500 text-white' : 'bg-[#1a1a1a] text-white hover:bg-[#333]'
            }`}
          >
            {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
            {isSaved ? '已保存' : '保存'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左列：基本信息 */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-sm font-bold flex items-center gap-2 border-b border-[var(--border-color)] pb-3 text-[#1a1a1a]">
            <User size={16} className="text-[#da7756]" />
            基本信息
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[var(--muted)] mb-1.5 uppercase tracking-widest">讲师姓名</label>
              <input
                type="text"
                value={localProfile.name}
                onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                className="w-full bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#da7756] transition-all"
                placeholder="输入姓名"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted)] mb-1.5 uppercase tracking-widest">头衔</label>
                <input
                  type="text"
                  value={localProfile.title}
                  onChange={(e) => setLocalProfile({ ...localProfile, title: e.target.value })}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#da7756] transition-all"
                  placeholder="如：高级培训总监"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--muted)] mb-1.5 uppercase tracking-widest">从业年限</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={localProfile.yearsOfExperience || 0}
                  onChange={(e) => setLocalProfile({ ...localProfile, yearsOfExperience: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#da7756] transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--muted)] mb-1.5 uppercase tracking-widest">行业领域</label>
              <input
                type="text"
                value={localProfile.industry || ''}
                onChange={(e) => setLocalProfile({ ...localProfile, industry: e.target.value })}
                className="w-full bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#da7756] transition-all"
                placeholder="如：房产经纪 · 培训与组织发展"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--muted)] mb-1.5 uppercase tracking-widest">个人简介</label>
              <textarea
                rows={3}
                value={localProfile.bio}
                onChange={(e) => setLocalProfile({ ...localProfile, bio: e.target.value })}
                className="w-full bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#da7756] transition-all resize-none"
                placeholder="简要介绍你的培训背景与核心价值..."
              />
            </div>
          </div>
        </div>

        {/* 右列：专业标签 */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-sm font-bold flex items-center gap-2 border-b border-[var(--border-color)] pb-3 text-[#1a1a1a]">
            <Target size={16} className="text-[#da7756]" />
            专业特征
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-[var(--muted)] mb-2 uppercase tracking-widest">专业领域</label>
              <TagEditor
                tags={localProfile.expertise || []}
                onChange={(expertise) => setLocalProfile({ ...localProfile, expertise })}
                suggestions={expertiseSuggestions}
                accentColor="#da7756"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--muted)] mb-2 uppercase tracking-widest">授课风格</label>
              <TagEditor
                tags={localProfile.teachingStyles || []}
                onChange={(teachingStyles) => setLocalProfile({ ...localProfile, teachingStyles })}
                suggestions={teachingStyleSuggestions}
                accentColor="#3b82f6"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--muted)] mb-2 uppercase tracking-widest">内容偏好</label>
              <textarea
                rows={3}
                value={localProfile.contentPreferences}
                onChange={(e) => setLocalProfile({ ...localProfile, contentPreferences: e.target.value })}
                className="w-full bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#da7756] transition-all resize-none"
                placeholder="描述你对 AI 生成内容的偏好，如语气、结构、深度等..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--muted)] mb-2 uppercase tracking-widest">资质成就</label>
              <TagEditor
                tags={localProfile.achievements || []}
                onChange={(achievements) => setLocalProfile({ ...localProfile, achievements })}
                accentColor="#10b981"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
