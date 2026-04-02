import fitz  # PyMuPDF
import json
import os

pdf_path = '/Users/jiahao/Desktop/物料/收房增长力-解密400（9.23）.pdf'
text = ""
try:
    doc = fitz.open(pdf_path)
    for page in doc:
        text += page.get_text("text") + "\n"
    doc.close()
except Exception as e:
    print("Error reading PDF:", e)
    exit(1)

def es(text):
    return json.dumps(text)

injection = f"""
  {{
    id: 'doc-actual-5',
    folderId: 'kb-training',
    name: '收房增长力-解密400(PDF)',
    fileType: 'pdf',
    size: {os.path.getsize(pdf_path)},
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
