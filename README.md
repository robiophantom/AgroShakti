# 🌱 AgroShakti

**Web interface powered by LLM to help farmers.**

AgroShakti is an AI-powered platform designed to empower farmers with real-time advice, disease detection, resource planning, weather forecasts, government schemes, and soil analysis, all via an easy-to-use web interface. It combines large language models, modern web technologies, and deep learning for a true farmer-centric experience.

---

## 🚀 Key Features

- **Conversational Chatbot** — Ask agriculture-related questions in simple language, get lengthy, practical, and step-by-step answers tailored for farmers.
- **AI Disease Detection** — Upload plant images to detect diseases using computer vision and deep learning.
- **Resource Planning &amp; Recommendations** — Get advice on crop management, soil health, irrigation, pest &amp; disease control, and government programs.
- **Weather Forecasts** — Integrated weather data via streamlined APIs.
- **Database &amp; History** — Secure user data, feedback, and interaction history using robust backend and PostgreSQL.
- **Modular Design** — Separate backend API, ML services, and frontend for extensibility.

---

## 🗂️ Repository Structure

```
.
├── agroshakti-backend/          # Node + Express backend API (DB, Auth, API endpoints, business logic)
├── flask-llm/                   # Python Flask microservice for LLM-based chatbot (Llama 3)
├── flask_disease_detection/     # Python Flask microservice for crop disease image detection (PyTorch/CV)
├── frontend/                    # React web frontend (UI, user interaction)
├── source_code_for_reference/   # Reference/legacy code (for migration or learning)
├── LICENSE
├── README.md
├── .gitignore
├── .gitattributes
```

---

## 🏗️ Component Overview

### 1. Backend API (`agroshakti-backend/`)
- **Node.js**, **Express**, **PostgreSQL via Supabase**, **Cloudinary**, **JWT Auth**
- Modular REST API: `auth`, `scheme`, `survey`, `hooks` (AI calls), `history`, `feedback`, and `admin`.
- **Files**: `server.js` (entry), `migrate.js` (DB migration), `.env.example`, `package.json`
- Integrates with Flask ML microservices for AI features.
- <a>View folder README &amp; docs</a>

### 2. LLM Chatbot Microservice (`flask-llm/`)
- **Python Flask** app wrapping a local Llama 3.1 model (`llama-cpp-python`)
- Custom prompt template to ensure friendly, detailed, farmer-focused responses
- `/chatbot` API endpoint: Input a query, get back detailed answer.
- **Requirements**: `flask`, `flask-cors`, `llama-cpp-python`
- <a>app.py</a>

### 3. Disease Detection Microservice (`flask_disease_detection/`)
- **Python Flask** + **PyTorch** for CV-based multi-crop disease detection (94 classes supported!)
- `/detect` API endpoint for uploading plant images and receiving a diagnosis
- **Requirements**: `Flask`, `torch`, `torchvision`, `Pillow`, `Werkzeug`
- Model weights: Download from <a>Google Drive link provided inside</a>
- <a>app.py</a>

### 4. Frontend (`frontend/`)
- **React**, **Vite**, **TailwindCSS**
- Modern, farmer-friendly UI for all features (chat, upload, history, etc.)
- See <a>frontend/README.md</a> for setup &amp; details.

### 5. Reference Code (`source_code_for_reference/`)
- Contains samples and legacy scripts used during prototyping/development (not production).

---

## 🛠️ Setup &amp; Installation

### Prerequisites
- Node.js, Python 3.9+, pip, PostgreSQL
- For local LLM: Download Llama 3.1 model weights (.gguf) as referenced in `flask-llm/app.py`

### 1. Backend API
```sh
cd agroshakti-backend
cp .env.example .env         # Add your actual credentials
npm install
npm run migrate              # Creates DB tables
npm run dev                  # Starts the backend server (port 5000)
```

### 2. LLM Chatbot Microservice
```sh
cd flask-llm
pip install -r requirement.txt
python app.py                # Runs on port 8000
```

### 3. Disease Detection Microservice
```sh
cd flask_disease_detection
pip install -r requirements.txt
# Download the trained model as explained in app.py
python app.py                # Runs on port 8001
```

### 4. Frontend
```sh
cd frontend
npm install
npm run dev                  # Starts React app (port 5173)
```

---

## 👥 Contributing

Contributions, issues, and feature requests are welcome! Please check existing issues/PRs before opening new ones.

---

## 📜 License

This project is licensed under the MIT License; see <a>LICENSE</a> for details.

---

## 🔗 Useful Links

- Explore code: <a href="https://github.com/robiophantom/AgroShakti">GitHub Repository</a>
- Backend Docs: <a>agroshakti-backend/README.md</a>
- Demo/model weights: See in-code comments

---

&gt; **Note:** This README is a high-level summary. For full docs and implementation guides, always check individual folders.
