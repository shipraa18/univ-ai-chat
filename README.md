# University AI Chat

An end-to-end AI chatbot for online university and degree program queries. Built with React, Node.js/Express, MongoDB, OpenAI, and a Python RAG (Retrieval-Augmented Generation) backend.

## Features

- AI-powered chat for online degree program questions (fees, duration, eligibility, etc.)
- RAG backend with vector search over university knowledge base
- Lead capture (brochure, counselor, apply)
- Chat sharing, feedback, dark/light theme
- Admin dashboard for lead management at `/admin`

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend API | Node.js, Express, MongoDB (Mongoose) |
| RAG Service | Python, FastAPI, LlamaIndex, FAISS |
| AI | OpenAI GPT |

## Prerequisites

Before running locally, install:

1. **Node.js 18+** and npm — [nodejs.org](https://nodejs.org)
2. **Python 3.10+** — for the RAG backend
3. **MongoDB** — local install or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier
4. **OpenAI API key** — [platform.openai.com](https://platform.openai.com/api-keys)

## Quick Start (Local Development)

### 1. Install dependencies

From the project root:

```bash
npm run install-all
```

### 2. Set up environment variables

**Node server** — create `server/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/university-ai-chat
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
RAG_API_URL=http://localhost:8000/ask
```

**RAG backend** — create `rag-backend/.env`:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

> Never commit `.env` files. They are already in `.gitignore`.

### 3. Start MongoDB

If using local MongoDB, make sure it is running on port `27017`.  
With Atlas, use your connection string in `MONGODB_URI`.

### 4. Start the RAG backend (Python)

Open a terminal:

```bash
cd rag-backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The RAG API will be available at `http://localhost:8000/ask`.

### 5. Start the app (Node + React)

Open a **second** terminal from the project root:

```bash
npm run dev
```

This starts:
- **Backend API** → `http://localhost:5000`
- **Frontend** → `http://localhost:5173` (Vite default)

Open **http://localhost:5173** in your browser.

### 6. Admin panel (optional)

Visit **http://localhost:5000/admin** to view and export captured leads.

## Project Structure

```
university-ai-chat/
├── frontendd/          # React frontend (Vite)
├── server/             # Express API + MongoDB models
├── rag-backend/        # FastAPI RAG microservice
│   ├── app/            # RAG engine, vector index
│   └── college_md/     # University knowledge base (markdown)
├── env.example         # Environment variable template
├── render.yaml         # Render deployment config
└── DEPLOYMENT.md       # Production deployment guide
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rag-query` | Query via RAG backend (used by frontend) |
| POST | `/api/query` | Direct OpenAI query |
| POST | `/api/leads` | Submit lead form |
| POST | `/api/feedback` | Submit message feedback |
| GET | `/admin` | Lead management dashboard |

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deploying to Render with both the Node app and RAG backend.

## Resume / Portfolio Notes

This project demonstrates:
- Full-stack MERN development with React SPA
- AI integration (OpenAI + RAG pipeline)
- Microservice architecture (Node API + Python RAG service)
- MongoDB data modeling (leads, chats, feedback)
- Production deployment configuration

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `OPENAI_API_KEY is not set` | Add your key to `server/.env` and `rag-backend/.env` |
| MongoDB connection error | Check `MONGODB_URI` and that MongoDB is running |
| RAG query fails | Ensure RAG backend is running on port 8000 |
| Frontend can't reach API | Vite proxies `/api` to port 5000 — start the Node server first |
