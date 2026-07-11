import os

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("❌ OPENAI_API_KEY is missing from .env")

# Paths
MD_FOLDER = "./college_md"
CHUNK_JSON = "./app/university_chunks.json"
VECTOR_INDEX_DIR = "./app/college_vector_index"
BM25_INDEX_DIR = "./app/colleges_bm25_index"
BM25_DOCSTORE_PATH = f"{BM25_INDEX_DIR}/docstore.json"
