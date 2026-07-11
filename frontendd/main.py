# from fastapi import FastAPI
# from pydantic import BaseModel
# from fastapi.middleware.cors import CORSMiddleware
# from rag_engine import answer_query

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], 
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class Question(BaseModel):
#     question: str

# @app.post("/ask")
# def ask(body: Question):
#     answer = answer_query(body.question)
#     return {"answer": answer}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import from the same package so uvicorn can find it when running `app.main:app`
from .rag_engine import answer_query

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # or restrict to your frontend origin
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    question: str

@app.post("/ask")
def ask(body: Question):
    answer = answer_query(body.question)
    return {"answer": answer}
