// ============================================
// 成课工作台 — 核心类型定义
// ============================================

export type FileType = 'pdf' | 'markdown' | 'docx' | 'txt' | 'json' | 'xlsx';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  icon?: string;
  children: Folder[];
  createdAt: string;
}

export interface Document {
  id: string;
  folderId: string;
  name: string;
  fileType: FileType;
  size: number;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  folderId: string;
  name: string;
  description: string;
  skillDir?: string;          // 技能包在文件系统中的相对路径 (相对于 src/data/skills/)
  promptTemplate?: string;    // 简单模式下的单一 Prompt（可选，有 skillDir 时优先使用 Agent 模式）
  modelConfig: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'name' | 'date' | 'size';
export type SortOrder = 'asc' | 'desc';

export interface TargetStudent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
}

export interface UserProfile {
  name: string;
  avatar?: string;
  title: string;
  bio: string;
  industry: string;
  yearsOfExperience: number;
  expertise: string[];           // 专业领域标签
  teachingStyles: string[];      // 授课风格标签
  contentPreferences: string;
  targetStudents: TargetStudent[]; // 授课对象列表（与对话框联动）
  achievements: string[];         // 资质/成就
  updatedAt: string;
}

export interface RecentChat {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  loading: boolean;
  updatedAt: string;
}

export interface LlmRuntimeConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  temperature: number;
  maxTokens: number;
}
