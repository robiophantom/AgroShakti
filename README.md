## AgroShakti – Full Stack Features Overview

Here’s a concise list of what the **AgroShakti** system currently does end‑to‑end.

### Backend features (Node + Postgres + Flask)

- **Authentication & users**
  - Register, login, logout, refresh tokens (`/api/auth/*`) using JWT (access + refresh).
  - Roles: **farmer** and **admin**.
  - Profile management (`/api/auth/me`, `/api/auth/profile`, `/api/auth/delete-account`).

- **Core AI hooks (all require auth)**
  - **Chatbot**: `POST /api/hooks/chatbot` – general agri Q&A (LLM via Flask `:8000`).
  - **Soil analysis**: `POST /api/hooks/soil-analysis` – takes soil params and returns recommendations.
  - **Resource estimation**: `POST /api/hooks/resource-estimation` – fertilizer/water/resources for a crop and land size.
  - **Weather advisory**: `POST /api/hooks/weather-advisory` – weather + market info by location/crop.
  - **Scheme search**: `POST /api/hooks/scheme-search` – ML-based search on government schemes.
  - **Disease detection**: `POST /api/hooks/disease-detection` – image upload → detect disease (Flask `:8001`) → get cure (Flask `:8000`), store image in Cloudinary.

- **History & analytics**
  - Chat history: `GET /api/history/chat` (paginated, by user & optional session).
  - Disease, soil, weather, resource histories: `GET /api/history/*`.
  - All interactions recorded in Postgres (12 tables: users, chat_history, soil_data, etc.).

- **Schemes & surveys**
  - Schemes CRUD with search (`/api/schemes/*`) – admin manages, farmers read.
  - Surveys system: active survey, responses, admin analytics (`/api/surveys/*`).

- **Feedback & admin**
  - Feedback & reports: create and resolve issues (`/api/feedback/*`).
  - Admin stats & user management (`/api/admin/*`).

- **Infra**
  - CORS configured for dev (any origin in your environment).
  - Integrates two Flask ML services (`:8000`, `:8001`) and Cloudinary.

---

### Frontend features (Vite + React, no mock data)

- **Landing page**
  - Modern hero section describing AgroShakti, feature cards (Chatbot, Disease Detection, Multi-language), “Get Started” button.
  - Built to visually match your old `frontend` app style.

- **Auth & session handling**
  - Login & registration UI (name, email, phone, password, location).
  - Real calls to backend `/api/auth/register`, `/api/auth/login`.
  - Stores access + refresh tokens, automatic **access-token refresh** via `/api/auth/refresh-token`.
  - User info loaded from `/api/auth/me`; logout calls `/api/auth/logout` and clears tokens.

- **Chat interface**
  - Fully wired to `POST /api/hooks/chatbot` (real LLM reply, no mocks).
  - Uses **session_id** so multiple messages stay in the same session.
  - Shows past messages by pulling `GET /api/history/chat` on login.
  - Displays chat bubbles with timestamps and session badge, and lets you “Start fresh” for a new session.

- **Voice & text interaction**
  - **Text input**: standard chat box.
  - **Speech input**: mic button uses browser **SpeechRecognition** to convert speech → text, fills the input, then you send to backend.
  - **Speech output**: speaker button + auto-read latest assistant message via **speechSynthesis**.
  - Graceful fallback: if the browser doesn’t support these APIs, the mic/speaker controls are hidden.

---

### Repository structure

- `agroshakti-backend/` – Express + Postgres API, integrates with Flask ML services and Cloudinary.
- `frontend/` – Original prototype frontend (used as design reference).
