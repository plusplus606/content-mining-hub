import json
import os

md_path = '/Users/jiahao/Desktop/物料/花桥销冠圆桌会.md'
with open(md_path, 'r', encoding='utf-8') as f:
    text = f.read()

def es(text):
    return json.dumps(text)

injection = f"""
  {{
    id: 'doc-actual-4',
    folderId: 'kb-training',
    name: '花桥销冠圆桌会(MD)',
    fileType: 'markdown',
    size: len(text),
    content: {es(text)},
    metadata: {{ author: '系统', version: '1.0' }},
    createdAt: '2024-04-03T10:00:00Z',
    updatedAt: '2024-04-03T10:00:00Z',
  }},
"""

ts_file = '/Users/jiahao/Desktop/萃取/content-mining-hub/src/data/mockData.ts'
with open(ts_file, 'r', encoding='utf-8') as f:
    content = f.read()

target = "export const mockDocuments: Document[] = ["
if target in content:
    new_content = content.replace(target, target + injection, 1)
    with open(ts_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Injection successful.")
else:
    print("Target string not found.")
