import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SKILLS_BASE_DIR = path.join(process.cwd(), 'src', 'data', 'skills');

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

function buildFileTree(dirPath: string, relativeTo: string): FileNode[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries
    .filter(e => !e.name.startsWith('.'))
    .sort((a, b) => {
      // 目录在前，文件在后
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    })
    .map(entry => {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.relative(relativeTo, fullPath);

      if (entry.isDirectory()) {
        return {
          name: entry.name,
          type: 'directory' as const,
          path: relPath,
          children: buildFileTree(fullPath, relativeTo),
        };
      }

      return {
        name: entry.name,
        type: 'file' as const,
        path: relPath,
      };
    });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const skillDir = searchParams.get('skillDir');
  const action = searchParams.get('action');
  const file = searchParams.get('file');

  if (!skillDir) {
    return NextResponse.json({ error: '缺少 skillDir 参数' }, { status: 400 });
  }

  const basePath = path.join(SKILLS_BASE_DIR, skillDir);
  const resolvedBase = path.resolve(basePath);

  // 安全检查
  if (!fs.existsSync(basePath)) {
    return NextResponse.json({ error: '技能包目录不存在' }, { status: 404 });
  }

  if (action === 'tree') {
    const tree = buildFileTree(basePath, basePath);
    return NextResponse.json({ tree });
  }

  if (action === 'read' && file) {
    const filePath = path.resolve(basePath, file);
    // 防止路径遍历攻击
    if (!filePath.startsWith(resolvedBase)) {
      return NextResponse.json({ error: '非法路径' }, { status: 403 });
    }
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ content });
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 });
}
