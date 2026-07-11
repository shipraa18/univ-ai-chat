import os
import json
from .config import MD_FOLDER, CHUNK_JSON


def chunk_md_file(file_path, chunk_size=40, overlap=20):
    """
    Chunk markdown into overlapping blocks with metadata header.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return []

    chunks = []
    filename = os.path.splitext(os.path.basename(file_path))[0]
    total_lines = len(lines)
    start_line = 0
    chunk_id = 0

    while start_line < total_lines:
        end_line = min(start_line + chunk_size, total_lines)
        block = lines[start_line:end_line]

        header = (
            f"[FILE: {filename} | LINES: {start_line+1}-{end_line}]\n"
        )

        chunks.append({
            "chunk_id": f"{filename}_{chunk_id}",
            "filename": filename,
            "start_line": start_line+1,
            "end_line": end_line,
            "content": header + ''.join(block)
        })

        if end_line >= total_lines:
            break

        start_line = end_line - overlap
        chunk_id += 1

    return chunks


def generate_all_chunks():
    all_chunks = []

    for file in os.listdir(MD_FOLDER):
        if file.endswith(".md"):
            path = os.path.join(MD_FOLDER, file)
            chunks = chunk_md_file(path)
            all_chunks.extend(chunks)

    with open(CHUNK_JSON, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, indent=4, ensure_ascii=False)

    print(f"✅ Created {len(all_chunks)} total chunks.")


if __name__ == "__main__":
    generate_all_chunks()
