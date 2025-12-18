<<<<<<< HEAD
# AgroShakti 🌱🤖

**Web interface powered by LLM to help farmers.**

AgroShakti is an intelligent web application designed to empower farmers with real-time crop guidance, disease detection, weather insights, soil recommendations, government scheme information, and agricultural resource estimation. The platform uses advanced AI (Large Language Models), image processing, IoT integration, and weather APIs to deliver personalized support, primarily in Hindi.

---

## 🚀 Features

### 1. 🗣️ Farmer Chatbot (Hindi)
- **Interact in Hindi**: Farmers can ask questions and get answers in Hindi.
- **LLM-powered guidance**: The chatbot understands queries and provides actionable advice.

### 2. 🌾 Crop Disease Detection
- **Image-based diagnosis**: Farmers upload crop images to detect diseases.
- **AI-powered analysis**: The system identifies the disease and recommends treatments.

### 3. 🌤️ Hyperlocal Weather Advisory
- **Weather API integration**: Fetches real-time, location-specific weather data.
- **Actionable recommendations**: Suggests irrigation, pest control, and harvesting actions based on weather.

### 4. 🏞️ Soil Information via IoT
- **IoT sensor support**: Integrate soil sensors to fetch soil health data.
- **Crop recommendations**: Suggests suitable crops based on current soil conditions.

### 5. 🏛️ Government Schemes Guidance
- **Latest schemes**: Provides information about new and existing government schemes for farmers.
- **Eligibility & benefits**: Explains how to apply and the advantages.

### 6. 🧮 Resource Estimation & Advice
- **Fertilizer, seed, and water estimation**: Calculates required quantities tailored to crop and field size.
- **Pros/Cons analysis**: Advises on the benefits and drawbacks of different fertilizers and practices.

---

## 🖥️ Tech Stack

- **Frontend**: React / Next.js (Responsive UI, Hindi language support)
- **Backend**: Node.js / Python (Flask/FastAPI) for LLM and image processing
- **AI/ML**: OpenAI API, custom disease detection models
- **IoT Integration**: MQTT / REST API for soil sensors
- **Weather Data**: OpenWeatherMap, IMD, or other weather APIs
- **Database**: MongoDB / PostgreSQL (for storing farmer queries, images, recommendations)
- **Authentication**: OTP/SMS (for farmer logins)
- **Deployment**: Docker, Vercel/AWS/Azure

---

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/robiophantom/AgroShakti.git
cd AgroShakti
```

### 2. Install Dependencies

```bash
# For Node.js/React frontend
cd frontend
npm install

# For Python backend
cd ../backend
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in both `frontend` and `backend` directories:

- **Weather API keys**
- **OpenAI API keys**
- **IoT sensor endpoints**
- **Database credentials**

### 4. Run the Application

```bash
# Start backend server
cd backend
python app.py

# Start frontend server
cd ../frontend
npm start
```

---

## 🧑‍🌾 Usage Guide

### 1. **Ask a Question (in Hindi)**
> "मुझे गेहूं की फसल में कौनसी बीमारी है?"

### 2. **Upload Crop Image for Disease Detection**
> Click on 'Disease Diagnosis', upload an image, and get instant analysis.

### 3. **Check Weather and Get Recommendations**
> Enter your location or allow location access for local weather-based advice.

### 4. **View Soil Data & Crop Suggestions**
> Connect your IoT soil sensor, or manually enter soil parameters.

### 5. **Government Scheme Information**
> Browse or search for latest schemes, eligibility, and application process.

### 6. **Resource Estimation**
> Input field/crop details for fertilizer, seed, water, and get recommendations.

---

## 📸 Screenshots

> *(Add screenshots/gifs here for each feature)*

---

## 🛠️ Contributing

We welcome contributions from the community!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🙋‍♂️ Support & Feedback

- For issues, create a [GitHub Issue](https://github.com/robiophantom/AgroShakti/issues)
- For suggestions, contact [robiophantom](https://github.com/robiophantom)

---

## 📄 License

This project is licensed under the MIT License.

---

### AgroShakti: Empowering Farmers with AI, IoT, and Real-time Guidance!
=======
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
- `agroshakti-frontend/` – Vite + React SPA using real backend APIs (no mock data).
- `frontend/` – Original prototype frontend (used as design reference).

>>>>>>> origin/gaurav
