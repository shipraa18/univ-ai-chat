# import json
# from openai import OpenAI
# import Stemmer
# from llama_index.core import StorageContext, load_index_from_storage, SimpleDocumentStore
# from llama_index.embeddings.openai import OpenAIEmbedding
# from config import (
#     OPENAI_API_KEY,
#     CHUNK_JSON,
#     VECTOR_INDEX_DIR,
#     BM25_DOCSTORE_PATH,
# )
# client = OpenAI(api_key=OPENAI_API_KEY)

# embed_model = OpenAIEmbedding(
#     model="text-embedding-3-large",
#     api_key=OPENAI_API_KEY
# )

# # Load Vector Index
# storage_context = StorageContext.from_defaults(persist_dir=VECTOR_INDEX_DIR)
# vector_index = load_index_from_storage(storage_context, embed_model=embed_model)
# vector_retriever = vector_index.as_retriever(similarity_top_k=5)

# # Load BM25
# docstore = SimpleDocumentStore.from_persist_path(BM25_DOCSTORE_PATH)
# bm25_retriever = Stemmer.BM25 = None  # optional


# def answer_query(query: str):
#     vector_results = vector_retriever.retrieve(query)
#     results = vector_results[:8]

#     context = "\n---\n".join([r.get_text() for r in results])

#     system_prompt = """
# You are a helpful university counselor.
# Use ONLY the provided context.
# If the information (fees, EMI, eligibility) is present, quote it EXACTLY.
# If missing, respond: "Information not available in provided documents."
# """

#     user_prompt = f"User question: {query}\n\nContext:\n{context}"

#     response = client.chat.completions.create(
#         model="gpt-4o-mini",
#         messages=[
#             {"role": "system", "content": system_prompt},
#             {"role": "user", "content": user_prompt}
#         ],
#         temperature=0.3,
#         max_tokens=800
#     )

#     return response.choices[0].message.content


import json
from typing import List

from openai import OpenAI

from llama_index.core import StorageContext, load_index_from_storage
from llama_index.core.storage.docstore import SimpleDocumentStore
from llama_index.embeddings.openai import OpenAIEmbedding

from .config import (
    OPENAI_API_KEY,
    CHUNK_JSON,
    VECTOR_INDEX_DIR,
    BM25_DOCSTORE_PATH,
)

# ---------------------------------------------------
# Safety: API key check
# ---------------------------------------------------
if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY is missing. Put it in your .env file.")


# ---------------------------------------------------
# OpenAI client + Embedding model
# ---------------------------------------------------
client = OpenAI(api_key=OPENAI_API_KEY)

embed_model = OpenAIEmbedding(
    model="text-embedding-3-large",
    api_key=OPENAI_API_KEY,
)

# ---------------------------------------------------
# Load Chunks (for full text)
# ---------------------------------------------------
try:
    with open(CHUNK_JSON, "r", encoding="utf-8") as f:
        raw = f.read().strip()
        _chunk_data = json.loads(raw) if raw else []
except FileNotFoundError:
    _chunk_data = []
except json.JSONDecodeError:
    # If the chunks file is empty or corrupted, continue without it
    _chunk_data = []

# Map chunk_id -> content (may be empty if chunks not built yet)
CHUNK_MAP = {c["chunk_id"]: c["content"] for c in _chunk_data}


# ---------------------------------------------------
# Load Vector Index (LlamaIndex) – tolerant if not built yet
# ---------------------------------------------------
try:
    storage_context = StorageContext.from_defaults(persist_dir=VECTOR_INDEX_DIR)
    vector_index = load_index_from_storage(
        storage_context=storage_context,
        embed_model=embed_model,
    )
    vector_retriever = vector_index.as_retriever(similarity_top_k=8)
except FileNotFoundError:
    # Index not built yet (no docstore.json, etc.)
    storage_context = None
    vector_index = None
    vector_retriever = None


# NOTE: BM25-based retrieval requires an extra llama_index.retrievers module
# which is not available in your current environment. To keep things simple
# and avoid import errors, we disable BM25 for now and rely purely on the
# vector index (which is usually sufficient in practice).


# ---------------------------------------------------
# Internal retrieval helper
# ---------------------------------------------------
def _retrieve_vector(query: str):
    """Retrieve from vector index only (if available)."""
    if vector_retriever is None:
        return []
    return vector_retriever.retrieve(query)


def _build_context(results) -> str:
    """
    Build a rich text context from retrieved chunks.
    Each chunk is clearly labelled (file + lines + score).
    """
    context_blocks: List[str] = []

    for res in results:
        meta = res.metadata or res.node.metadata or {}
        filename = meta.get("filename", "unknown_file")
        chunk_id = meta.get("chunk_id", res.node.id_)
        score = getattr(res, "score", None)
        lines_info = ""
        # If you stored start_line / end_line in metadata, you can show it:
        start_line = meta.get("start_line")
        end_line = meta.get("end_line")
        if start_line and end_line:
            lines_info = f" | LINES: {start_line}-{end_line}"

        score_info = f" | SCORE: {score:.4f}" if isinstance(score, float) else ""

        header = f"[SOURCE: {filename} | CHUNK_ID: {chunk_id}{lines_info}{score_info}]"

        # Prefer chunk text from CHUNK_MAP to avoid any truncation
        chunk_text = CHUNK_MAP.get(chunk_id, res.get_text())

        context_blocks.append(header + "\n" + chunk_text)

    if not context_blocks:
        return ""

    return "\n\n---\n\n".join(context_blocks)


# ---------------------------------------------------
# Main RAG function to use from FastAPI
# ---------------------------------------------------
def answer_query(query: str) -> str:
    """
    Full RAG pipeline:
    - retrieve relevant chunks (vector + BM25)
    - build context
    - call GPT (gpt-4o-mini)
    - return final answer text
    """

    # 1) Retrieve (vector-only for now)
    vector_results = _retrieve_vector(query)

    if not vector_results:
        return "Information not available in provided documents."

    # 2) Build context
    context = _build_context(vector_results)

    # 3) Build prompts
    system_prompt = (
        "You are a friendly and knowledgeable **college counselor** helping "
        "students choose the right online / distance university courses.\n\n"
        "Rules:\n"
        "1. Use ONLY the information in the provided context.\n"
        "2. If a detail like **fees, EMI availability, EMI per month, duration, "
        "   mode of study, or eligibility** appears in the context, you MUST "
        "   quote it **exactly** (e.g., 'EMI is ₹3,500 per month').\n"
        "3. If a detail is NOT present in the context, say: "
        "   'Information not available in provided documents.' Do NOT guess.\n"
        "4. If multiple universities/courses are mentioned, explicitly mention "
        "   which one you are talking about.\n\n"
        "Output format:\n"
        "1. **Answer Summary** – direct, concise answer.\n"
        "2. **Supporting Details** – mention university name, course name, and exact values.\n"
        "3. **Additional Guidance** – optional suggestions for the student.\n"
    )

    user_prompt = (
        f"User question:\n{query}\n\n"
        f"Here is the relevant context from university documents:\n\n"
        f"{context}\n\n"
        f"Now answer the question following the rules."
    )

    # 4) Call OpenAI Chat Completion
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=900,
    )

    return response.choices[0].message.content
