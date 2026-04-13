# Smart Medication Manager

A full-stack app to **store medicines**, **extract medicine info from images (OCR)**, **optionally enrich data using AI**, and **schedule reminders/notifications**.

## Features

- **Authentication**: register/login with JWT.
- **Medicine management**: create/list/update medicine records.
- **OCR upload**: upload a prescription/medicine photo and extract text/medicine fields.
- **AI suggestions (optional)**: enrich extracted medicine data (provider-configurable).
- **Reminders/notifications**: background scheduler with optional email/WhatsApp integrations.

## Tech stack

- **Frontend**: React + React Router, Vite, Tailwind CSS
- **Backend**: Node.js (TypeScript), Express, MongoDB (Mongoose)
- **OCR**: `tesseract.js` (default), optional Google Vision
- **Notifications**: `node-cron`, optional SMTP (email) + Twilio WhatsApp

## Project structure

```text
smart-medication-manager/
  src/                  # Frontend
  package.json          # Frontend scripts/deps
  .env.example          # Frontend env example (Vite)
  backend/
    src/                # Backend
    package.json        # Backend scripts/deps
    .env.example        # Backend env example
```

## Prerequisites

- **Node.js** (recommended: latest LTS)
- **MongoDB** running locally or a hosted MongoDB URI

## Setup

### 1) Backend

From the project root:

```bash
cd backend
npm install
```

Create `backend/.env` (copy from `backend/.env.example`) and set values:

- **Required**
  - `PORT` (default `4000`)
  - `MONGO_URI` (example: `mongodb://localhost:27017/smm`)
  - `JWT_SECRET` (set a strong secret)
- **Recommended**
  - `PUBLIC_BASE_URL` (default `http://localhost:4000`)
- **Optional**
  - OCR: `OCR_PROVIDER` (`tesseract` by default), `GOOGLE_VISION_API_KEY`
  - AI: `AI_PROVIDER` (`gemini` or `openai`), `GEMINI_API_KEY`/`OPENAI_API_KEY`, `GEMINI_MODEL`/`OPENAI_MODEL`
  - Email: `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - WhatsApp: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_WHATSAPP`

Start backend:

```bash
npm run dev
```

Health check:

- `GET /health` → `{ ok: true }`

API base routes:

- `POST /api/auth/...`
- `/api/medicines/...`
- `/api/ocr/...`
- `/api/ai/...`

### 2) Frontend

From the project root:

```bash
npm install
```

Create `.env` (copy from `.env.example`) and point it to your backend:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Start frontend:

```bash
npm run dev
```

## Running the full app (recommended dev flow)

- Terminal A:

```bash
cd backend
npm run dev
```

- Terminal B (project root):

```bash
npm run dev
```

## Notes & security

- **Do not commit secrets**. If any API key is present in local env files, rotate it immediately and keep keys only in `.env` (never in docs or source control).
- Uploads are served from **`/uploads`** on the backend (created at runtime).

## Troubleshooting

- **Mongo connection fails**: verify MongoDB is running and `MONGO_URI` is correct.
- **CORS/auth issues**: ensure `VITE_API_BASE_URL` matches backend URL and port.
- **OCR accuracy**: better lighting/cropping improves results; consider switching providers if needed.
- **Vercel 404 on refresh / deep links**: keep `vercel.json`, or use **Docker + Nginx** (section below).

## Deploy frontend (Docker + Nginx)

For Railway, Fly.io, ECS, Kubernetes, etc.: `Dockerfile.frontend` builds Vite output and serves it with Nginx (`try_files` → SPA routes work on refresh).

```bash
docker build -f Dockerfile.frontend --build-arg VITE_API_BASE_URL=https://your-api.example.com -t medmind-frontend .
docker compose -f docker-compose.frontend.yml up --build
```

Open `http://localhost:8080`. GitHub Actions (`.github/workflows/frontend-container.yml`) pushes to **GHCR** as `ghcr.io/<owner>/<repo>-frontend:latest`. Set repository variable **`VITE_API_BASE_URL`** under Actions variables so the production bundle calls your API.



