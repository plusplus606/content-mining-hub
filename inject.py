import json

with open('extracted_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

docx_text = data.get('姑姑录音.docx', '')
pdf_text = data.get('明熹-实战总结.pdf', '')
xlsx_text = data.get('对客记录数据.xlsx', '')

def es(text):
    return json.dumps(text)

injection = f"""
  // === Injected Actual Data ===
  {{
    id: 'doc-actual-1',
    folderId: 'kb-training',
    name: '明熹-实战总结(PDF)',
    fileType: 'pdf',
    size: 2841751,
    content: {es(pdf_text)},
    metadata: {{ author: '李鹏雁', version: '1.0' }},
    createdAt: '2024-04-02T10:00:00Z',
    updatedAt: '2024-04-02T10:00:00Z',
  }},
  {{
    id: 'doc-actual-2',
    folderId: 'chat-2024-04',
    name: '姑姑录音(DOCX)',
    fileType: 'docx',
    size: 73267,
    content: {es(docx_text)},
    metadata: {{ author: '姑姑', version: '1.0' }},
    createdAt: '2024-04-02T10:00:00Z',
    updatedAt: '2024-04-02T10:00:00Z',
  }},
  {{
    id: 'doc-actual-3',
    folderId: 'chat-2024-04',
    name: '对客记录数据(XLSX)',
    fileType: 'xlsx',
    size: 154153,
    content: {es(xlsx_text)},
    metadata: {{ author: 'System', version: '1.0' }},
    createdAt: '2024-04-02T10:00:00Z',
    updatedAt: '2024-04-02T10:00:00Z',
  }},
"""

ts_file = 'src/data/mockData.ts'
with open(ts_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Insert right after `export const mockDocuments: Document[] = [`
target = "export const mockDocuments: Document[] = ["
if target in content:
    new_content = content.replace(target, target + injection, 1)
    with open(ts_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Injection successful.")
else:
    print("Target string not found.")
