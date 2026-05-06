import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, TargetStudent } from '@/types';

interface UserState {
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addTargetStudent: (student: TargetStudent) => void;
  removeTargetStudent: (id: string) => void;
  updateTargetStudent: (id: string, updates: Partial<TargetStudent>) => void;
}

const defaultProfile: UserProfile = {
  name: '郭佳',
  title: '高级培训总监',
  bio: '专注房产经纪行业培训体系搭建与课程研发，擅长将一线业务经验萃取为可复制的标准化培训课程。主导开发了 OCMIC 五步法等核心方法论，累计赋能超过 3000+ 名一线业务人员。',
  industry: '房产经纪 · 培训与组织发展',
  yearsOfExperience: 8,
  expertise: ['业务萃取', '课程设计', '方法论构建', '案例教学', 'AI 辅助研课'],
  teachingStyles: ['实战落地', '案例驱动', '数据说话', '场景还原'],

  contentPreferences: '重点突出，逻辑严密；善用真实案例与数据支撑观点；强调"可操作性"，每个方法论都配有标准流程与场景问答。',

  targetStudents: [
    { id: 'ts-1', name: '经纪人', description: '一线房产经纪人，负责客户开发与成交转化', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
    { id: 'ts-2', name: '资管经理', description: '负责房源托管与省心租业务拓展的资管人员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
    { id: 'ts-3', name: '设计师', description: '负责房源视觉呈现与空间改造方案的设计人员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb' },
  ],
  achievements: ['主导研发 OCMIC 五步法方法论', '累计培训 3000+ 一线人员', '出品《收房增长力》培训教材', '年度最佳培训师'],
  updatedAt: new Date().toISOString(),
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      updateProfile: (updates) =>
        set((state) => ({
          profile: {
            ...state.profile,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        })),
      addTargetStudent: (student) =>
        set((state) => ({
          profile: {
            ...state.profile,
            targetStudents: [...state.profile.targetStudents, student],
            updatedAt: new Date().toISOString(),
          },
        })),
      removeTargetStudent: (id) =>
        set((state) => ({
          profile: {
            ...state.profile,
            targetStudents: state.profile.targetStudents.filter((s) => s.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),
      updateTargetStudent: (id, updates) =>
        set((state) => ({
          profile: {
            ...state.profile,
            targetStudents: state.profile.targetStudents.map((s) =>
              s.id === id ? { ...s, ...updates } : s
            ),
            updatedAt: new Date().toISOString(),
          },
        })),
    }),
    {
      name: 'user-profile-storage',
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<UserState> | undefined;
        return {
          ...current,
          ...persistedState,
          profile: {
            ...defaultProfile,
            ...(persistedState?.profile || {}),
            // 确保数组字段不会被旧数据覆盖为 undefined
            targetStudents: persistedState?.profile?.targetStudents ?? defaultProfile.targetStudents,
            expertise: persistedState?.profile?.expertise ?? defaultProfile.expertise,
            teachingStyles: persistedState?.profile?.teachingStyles ?? defaultProfile.teachingStyles,
            achievements: persistedState?.profile?.achievements ?? defaultProfile.achievements,
          },
        };
      },
    }
  )
);
