import fs from 'fs';
import path from 'path';

export type SkillCatalogItem = {
  id: string;
  name: string;
  description: string;
  skillDir: string;
  sourcePath: string;
  sourceType: 'file' | 'directory';
};

const SKILLS_BASE_DIR = path.join(process.cwd(), 'src', 'data', 'skills');
const SKILL_FILE_EXTENSIONS = new Set(['.md', '.txt']);

function readDescriptionFromFile(file: string): string {
  if (!fs.existsSync(file)) return '';

  const content = fs.readFileSync(file, 'utf-8');
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const desc = lines.find((line) => !line.startsWith('#'));
  return desc || '';
}

function toSkillNameFromFile(fileName: string): string {
  return path.basename(fileName, path.extname(fileName));
}

export function listSkillCatalog(): SkillCatalogItem[] {
  if (!fs.existsSync(SKILLS_BASE_DIR)) return [];

  const entries = fs.readdirSync(SKILLS_BASE_DIR, { withFileTypes: true });
  const items: SkillCatalogItem[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillFile = path.join(SKILLS_BASE_DIR, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) continue;
      items.push({
        id: `skill-${entry.name}`,
        name: entry.name,
        description: readDescriptionFromFile(skillFile),
        skillDir: entry.name,
        sourcePath: path.relative(SKILLS_BASE_DIR, skillFile),
        sourceType: 'directory',
      });
      continue;
    }

    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (!SKILL_FILE_EXTENSIONS.has(extension)) continue;

    const skillName = toSkillNameFromFile(entry.name);
    const skillFile = path.join(SKILLS_BASE_DIR, entry.name);
    items.push({
      id: `skill-${skillName}`,
      name: skillName,
      description: readDescriptionFromFile(skillFile),
      skillDir: skillName,
      sourcePath: entry.name,
      sourceType: 'file',
    });
  }

  return items.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
}

export function loadSkillInstructions(maxChars = 16000): string {
  const skills = listSkillCatalog();
  if (skills.length === 0) return '';

  const chunks: string[] = [];
  let total = 0;

  for (const skill of skills) {
    const absolutePath = path.join(SKILLS_BASE_DIR, skill.sourcePath);
    if (!fs.existsSync(absolutePath)) continue;

    const raw = fs.readFileSync(absolutePath, 'utf-8').trim();
    if (!raw) continue;

    const section = `### Skill: ${skill.name}\n来源: ${skill.sourcePath}\n\n${raw}`;
    if (total + section.length > maxChars) break;
    chunks.push(section);
    total += section.length;
  }

  return chunks.join('\n\n---\n\n');
}

export function loadSkillContentByName(skillName: string, maxChars = 16000): {
  skill: SkillCatalogItem | null;
  content: string;
  error?: string;
} {
  const normalized = skillName.trim().toLowerCase();
  if (!normalized) {
    return { skill: null, content: '', error: '缺少 skillName' };
  }

  const skills = listSkillCatalog();
  const exact = skills.find((item) => item.name.toLowerCase() === normalized);
  const partial = skills.find((item) => item.name.toLowerCase().includes(normalized));
  const skill = exact || partial || null;
  if (!skill) {
    return { skill: null, content: '', error: `未找到 skill: ${skillName}` };
  }

  const absolutePath = path.join(SKILLS_BASE_DIR, skill.sourcePath);
  if (!fs.existsSync(absolutePath)) {
    return { skill, content: '', error: `skill 文件不存在: ${skill.sourcePath}` };
  }

  const raw = fs.readFileSync(absolutePath, 'utf-8').trim();
  if (!raw) {
    return { skill, content: '', error: `skill 文件为空: ${skill.sourcePath}` };
  }

  const content = raw.length > maxChars ? `${raw.slice(0, maxChars)}\n\n[TRUNCATED]` : raw;
  return { skill, content };
}
