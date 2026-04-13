# Smart Medication Manager — PPT (Copy/Paste Slides)

Use this file as a slide-by-slide script. Create a new PowerPoint/Google Slides deck and paste each slide’s title + bullets.

---

## Slide 1 — Title

**Smart Medication Manager**  
OCR + AI-assisted medicine tracking and reminders

- Name: <your name>
- Date: <date>

---

## Slide 2 — Problem Statement

- People often **forget doses**, misread labels, or lose prescription details
- Manual entry of medicine details is **slow and error-prone**
- Reminders and tracking are fragmented across apps/notes/messages

---

## Slide 3 — Proposed Solution

- A single app to:
  - **Store medicines**
  - **Extract details from images (OCR)**
  - **Optionally enrich details using AI**
  - **Schedule reminders/notifications**

---

## Slide 4 — Key Features

- **JWT authentication** (register/login)
- **Medicine CRUD** (create, view, update)
- **OCR upload** (photo → extracted text/fields)
- **AI suggestions (optional)** (structured enrichment)
- **Reminder scheduler** (optional email/WhatsApp)

---

## Slide 5 — Tech Stack (Frontend)

- **React** + **React Router**
- **Vite** dev server/build
- **Tailwind CSS** UI styling
- Config via `.env`:
  - `VITE_API_BASE_URL`

---

## Slide 6 — Tech Stack (Backend)

- **Express (TypeScript)** API server
- **MongoDB + Mongoose** persistence
- **OCR**: `tesseract.js` (default), optional Google Vision
- **Notifications**: `node-cron`, optional SMTP + Twilio WhatsApp

---

## Slide 7 — Architecture Overview

- Frontend calls backend REST API
- Backend responsibilities:
  - Auth + JWT
  - Medicine data storage
  - File upload (images) + OCR processing
  - Optional AI enrichment
  - Reminder scheduling + sending

Suggested diagram (add in PPT):
- Browser (React) → API (Express) → MongoDB
- Uploads → OCR → (optional AI) → Medicines
- Scheduler → Email/WhatsApp

---

## Slide 8 — API Overview (High Level)

- `GET /health`
- Auth:
  - `POST /api/auth/...`
- Medicines:
  - `/api/medicines/...`
- OCR:
  - `/api/ocr/...`
- AI:
  - `/api/ai/...`

---

## Slide 9 — Demo Flow (What to Show)

1. Sign up / Log in
2. Add a medicine manually (baseline)
3. Upload an image for OCR extraction
4. Review extracted fields
5. (Optional) Apply AI suggestion/enrichment
6. Configure reminders and show notification log/scheduling behavior

---

## Slide 10 — Configuration & Environment Variables

- Frontend:
  - `VITE_API_BASE_URL`
- Backend (required):
  - `PORT`, `MONGO_URI`, `JWT_SECRET`
- Optional integrations:
  - OCR provider keys (Google Vision)
  - AI provider keys (Gemini/OpenAI)
  - SMTP / Twilio for notifications

---

## Slide 11 — Security & Privacy Considerations

- Keep secrets in `.env` and **never commit API keys**
- Use **JWT** for authenticated requests
- Consider:
  - Input validation & rate limits (future hardening)
  - Image retention policy (cleanup old uploads)

---

## Slide 12 — Future Enhancements

- Push notifications/mobile app
- Better OCR with language models + field validation
- Medication interaction warnings
- Refill reminders and inventory tracking
- Role-based access for caregivers/family

---

## Slide 13 — Closing

- Summary: faster data entry + safer adherence through reminders
- Q&A

