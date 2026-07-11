import os
import json

from llama_index.core import VectorStoreIndex
from llama_index.core.storage.docstore import SimpleDocumentStore
from llama_index.embeddings.openai import OpenAIEmbedding

from .config import (
    OPENAI_API_KEY,
    CHUNK_JSON,
    VECTOR_INDEX_DIR,
    BM25_INDEX_DIR,
    BM25_DOCSTORE_PATH,
)
from llama_index.core.schema import TextNode


def build_indexes():
    with open(CHUNK_JSON, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    docs = []
    for ch in chunks:
        docs.append(
            TextNode(
                text=ch["content"],
                metadata={"filename": ch["filename"], "chunk_id": ch["chunk_id"]},
                id_=ch["chunk_id"],
            )
        )

    embed_model = OpenAIEmbedding(
        model="text-embedding-3-large",
        api_key=OPENAI_API_KEY,
    )

    print("🔧 Building Vector Index...")
    vector_index = VectorStoreIndex(docs, embed_model=embed_model)
    vector_index.storage_context.persist(persist_dir=VECTOR_INDEX_DIR)
    print("✅ Vector Index Done.")

    print("🔧 Persisting BM25 docstore (no external Stemmer)...")
    docstore = SimpleDocumentStore()
    docstore.add_documents(docs)
    os.makedirs(BM25_INDEX_DIR, exist_ok=True)
    docstore.persist(BM25_DOCSTORE_PATH)
    print("✅ BM25 docstore persisted.")


if __name__ == "__main__":
    build_indexes()
