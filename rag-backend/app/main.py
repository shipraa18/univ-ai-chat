from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .rag_engine import answer_query


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust to your frontend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)


class Question(BaseModel):
    question: str


@app.post("/ask")
def ask(body: Question):
    """
    Simple wrapper around the RAG engine.
    The Node server hits this endpoint at /ask.
    """
    answer = answer_query(body.question)
    return {"answer": answer}


