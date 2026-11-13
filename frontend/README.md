# 🧠💬 Mental Coach — Frontend

A clean, no-fuss Next.js chat UI for the FastAPI backend in [`/api`](../api). Type a message, get a pep talk. A little pill in the corner tells you if the backend is awake. 🟢🔴

## ✨ What it does

| Feature | How |
|---|---|
| 💬 Chat | `POST /api/chat` with `{ "message": "..." }` → shows `reply` |
| 🩺 Backend status | `GET /api/health` on load, every 15s, and when you come back to the tab |
| ⌨️ Keyboard friendly | **Enter** sends, **Shift+Enter** adds a new line |
| 📏 Auto-grow | The input box and message bubbles grow to fit what's inside |
| 🌗 Light and dark mode | Follows your OS setting, with readable contrast in both |

> Heads up: the backend is **stateless**. Each message goes over by itself, so the coach doesn't remember earlier messages. The chat history you see lives only in your browser tab.

## 🏃 Run it locally

You need **Node.js 20.9+** and the backend's prerequisites (see [`api/README.md`](../api/README.md)).

**Terminal 1: backend** (from the repo root)

```bash
uv sync
uv run uvicorn api.index:app --reload
```

**Terminal 2: frontend**

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. The pill should flip to **Backend connected** 🟢.

In dev, the frontend talks to `http://localhost:8000` automatically. No config needed.

## 🔧 Configuration

There's exactly one knob:

| Variable | What it does | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend, no trailing slash | `http://localhost:8000` in `npm run dev`; same domain (`/api/...`) in production builds |

To override it locally, create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

⚠️ `NEXT_PUBLIC_*` values are **baked in at build time**. Change it → rebuild/redeploy.

## 🚀 Deploy to Vercel (Root Directory = `frontend`)

With **Root Directory** set to `frontend`, Vercel only builds this folder. The Python backend in `/api` **is not included**, and the root `vercel.json` is ignored. So you run two Vercel projects from the same repo:

1. **Backend project** (Root Directory = repo root): this is the full-repo deploy from the [main README](../README.md). Add your `LLM_PROVIDER` and API key env vars there. Check that `https://<backend>.vercel.app/api/health` returns `{"status":"ok"}`.
2. **Frontend project** (Root Directory = `frontend`):
   - Vercel → **Add New… → Project** → import this repo
   - **Root Directory** → `frontend` (Framework Preset auto-detects **Next.js**)
   - **Environment Variables** → `NEXT_PUBLIC_API_URL` = `https://<backend>.vercel.app`
   - **Deploy** 🎉

CLI alternative, from the `frontend` folder:

```bash
cd frontend
npx vercel link
npx vercel env add NEXT_PUBLIC_API_URL production   # paste your backend URL
npx vercel --prod
```

The backend allows all origins (CORS `*`), so cross-domain calls just work.

## 🩹 Troubleshooting

- **Pill says "Backend offline" 🔴**: is uvicorn running on port 8000? Try `curl http://localhost:8000/api/health`. On Vercel, double-check `NEXT_PUBLIC_API_URL` and redeploy after changing it.
- **Red error bubble after sending**: the backend's error message is shown as-is. "is not configured" means the API key env var is missing on the backend.
- **Works on prod but not on preview URLs**: Vercel Deployment Protection may be blocking the backend's preview URL. Point `NEXT_PUBLIC_API_URL` at the backend's production domain.

## 🗂️ Where things live

```
frontend/
├── app/
│   ├── layout.tsx       # HTML shell, font, page title
│   ├── page.tsx         # The chat screen (client component)
│   ├── page.module.css  # Chat styles
│   └── globals.css      # Color tokens (light and dark) and resets
└── lib/
    └── api.ts           # fetch helpers for /api/health and /api/chat
```
