import { create } from 'zustand';
import { Skill, Folder } from '@/types';
import { mockSkills, mockSkillFolders } from '@/data/mockData';

interface SkillStore {
  skills: Skill[];
  skillFolders: Folder[];
  selectedSkillId: string | null;
  selectedFolderId: string | null;
  expandedFolderIds: Set<string>;

  // Skill Methods
  selectSkill: (id: string | null) => void;
  addSkill: (skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateSkill: (id: string, updates: Partial<Skill>) => void;
  deleteSkill: (id: string) => void;

  // Folder Methods
  selectFolder: (id: string | null) => void;
  toggleFolder: (id: string) => void;
  addSkillFolder: (name: string, parentId?: string | null) => void;
  getSelectedSkillFolderName: () => string;
}

export const useSkillStore = create<SkillStore>((set, get) => ({
  skills: [...mockSkills],
  skillFolders: [...mockSkillFolders],
  selectedSkillId: null,
  selectedFolderId: null,
  expandedFolderIds: new Set<string>(['root-skills']), // Default expanded

  getSelectedSkillFolderName: () => {
    const { selectedFolderId, skillFolders } = get();
    if (!selectedFolderId) return '总技能库';
    function find(nodes: Folder[]): string | null {
      for (const node of nodes) {
        if (node.id === selectedFolderId) return node.name;
        if (node.children) {
          const found = find(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    return find(skillFolders) || '总技能库';
  },

  selectSkill: (id) => set({ selectedSkillId: id }),

  addSkill: (skillData) => {
    const newId = `skill-${Date.now()}`;
    const newSkill: Skill = {
      ...skillData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      skills: [...state.skills, newSkill],
      selectedSkillId: newId,
    }));
    return newId;
  },

  updateSkill: (id, updates) =>
    set((state) => ({
      skills: state.skills.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      ),
    })),

  deleteSkill: (id) =>
    set((state) => ({
      skills: state.skills.filter((s) => s.id !== id),
      selectedSkillId: state.selectedSkillId === id ? null : state.selectedSkillId,
    })),

  selectFolder: (id) => set({ selectedFolderId: id, selectedSkillId: null }),

  toggleFolder: (id) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolderIds);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { expandedFolderIds: newExpanded };
    }),

  addSkillFolder: (name, parentId = 'root-skills') => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name,
      parentId: parentId || 'root-skills',
      children: [],
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const newFolders = JSON.parse(JSON.stringify(state.skillFolders));

      const addNode = (nodes: Folder[]): boolean => {
        for (const node of nodes) {
          if (node.id === parentId) {
            node.children.push(newFolder);
            return true;
          }
          if (node.children && addNode(node.children)) return true;
        }
        return false;
      };

      if (!addNode(newFolders)) {
        newFolders.push(newFolder);
      }

      const newExpanded = new Set(state.expandedFolderIds);
      if (parentId) newExpanded.add(parentId);

      return {
        skillFolders: newFolders,
        expandedFolderIds: newExpanded,
        selectedFolderId: newFolder.id,
      };
    });
  },
}));

