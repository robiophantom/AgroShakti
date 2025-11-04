# AgroShakti Backend API

Complete backend system for AgroShakti - An AI-powered Agricultural Chatbot Platform.

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT (Access & Refresh Tokens)
- **File Upload:** Multer
- **HTTP Client:** Axios (for Flask ML services)

## 📁 Project Structure

```
agroshakti-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection
│   │   └── constants.js         # App constants
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── isAdmin.js           # Admin authorization
│   │   ├── uploadImage.js       # File upload handler
│   │   └── errorHandler.js      # Global error handler
│   ├── routes/                  # API routes
│   ├── controllers/             # Business logic
│   ├── services/
│   │   └── flaskService.js      # Flask ML API integration
│   ├── utils/
│   │   └── jwt.js               # JWT utilities
│   └── app.js                   # Express app setup
├── migrations/
│   └── database_migration.sql   # Database schema
├── uploads/                     # Uploaded images
├── .env                         # Environment variables
├── package.json
└── server.js                    # Entry point
```

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 2. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd agroshakti-backend

# Install dependencies
npm install
```

### 3. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE agroshakti;
\q

# Run migrations
psql -U postgres -d agroshakti -f migrations/database_migration.sql
```

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=agroshakti

JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

FLASK_ML_BASE_URL=http://localhost:8000
FLASK_DISEASE_DETECTION_URL=http://localhost:8001

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

CORS_ORIGIN=http://localhost:3000
```

### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## 📡 API Endpoints

### Authentication APIs

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |
| DELETE | `/api/auth/delete-account` | Delete account | Yes |

### Scheme APIs

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| POST | `/api/schemes` | Create scheme | Yes | Yes |
| GET | `/api/schemes` | Get all schemes | Yes | No |
| GET | `/api/schemes/search` | Search schemes | Yes | No |
| GET | `/api/schemes/:id` | Get scheme by ID | Yes | No |
| PUT | `/api/schemes/:id` | Update scheme | Yes | Yes |
| DELETE | `/api/schemes/:id` | Delete scheme | Yes | Yes |

### Survey APIs

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| POST | `/api/surveys` | Create survey | Yes | Yes |
| GET | `/api/surveys/active` | Get active survey | Yes | No |
| GET | `/api/surveys` | Get all surveys | Yes | Yes |
| POST | `/api/surveys/:id/respond` | Submit response | Yes | No |
| GET | `/api/surveys/:id/responses` | Get responses | Yes | Yes |

### AgroShakti Hooks (ML Integration)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/hooks/chatbot` | Chat with AI | Yes |
| POST | `/api/hooks/soil-analysis` | Analyze soil data | Yes |
| POST | `/api/hooks/resource-estimation` | Estimate resources | Yes |
| POST | `/api/hooks/weather-advisory` | Get weather info | Yes |
| POST | `/api/hooks/scheme-search` | Search schemes via AI | Yes |
| POST | `/api/hooks/disease-detection` | Detect plant disease | Yes |

### History APIs

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/history/chat` | Get chat history | Yes |
| GET | `/api/history/disease` | Get disease detection history | Yes |
| GET | `/api/history/soil` | Get soil data history | Yes |
| GET | `/api/history/weather` | Get weather query history | Yes |
| GET | `/api/history/resource` | Get resource estimation history | Yes |

### Feedback & Reports APIs

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| POST | `/api/feedback` | Submit feedback | Yes | No |
| GET | `/api/feedback` | Get all feedback | Yes | Yes |
| POST | `/api/feedback/reports` | Submit report | Yes | No |
| GET | `/api/feedback/reports` | Get all reports | Yes | Yes |
| PUT | `/api/feedback/reports/:id/resolve` | Resolve report | Yes | Yes |

### Admin APIs

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/admin/stats` | Get platform statistics | Yes | Yes |
| GET | `/api/admin/users` | Get all users | Yes | Yes |
| PUT | `/api/admin/users/:id/role` | Change user role | Yes | Yes |
| DELETE | `/api/admin/users/:id` | Delete user | Yes | Yes |

## 🔒 Authentication

All protected routes require an access token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## 📝 Sample API Requests

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Farmer",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "secure123",
  "role": "farmer",
  "location": "Punjab"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure123"
}
```

### Chatbot
```bash
POST /api/hooks/chatbot
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What is the best time to sow wheat?",
  "session_id": "optional_session_id"
}
```

### Disease Detection
```bash
POST /api/hooks/disease-detection
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <file>
```

### Create Scheme (Admin)
```bash
POST /api/schemes
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "PM-KISAN Scheme",
  "description": "Income support to farmers",
  "eligibility": "All farmers with cultivable land",
  "how_to_apply": "Visit PM-KISAN portal",
  "last_date": "2025-12-31",
  "benefits": "Rs 6000 per year",
  "category": "Income Support",
  "state": "All India"
}
```

## 🤖 Flask ML Services Integration

The backend integrates with two Flask ML services:

### Flask Service :8000
Handles 5 hooks:
- Chatbot (Core LLM)
- Soil Analysis
- Resource Estimation
- Weather Advisory
- Scheme Recommendations

### Flask Service :8001
Handles disease detection from images.

**Flow for Disease Detection:**
1. Backend receives image from user
2. Calls Flask :8001 `/detect-disease`
3. If disease detected → Calls Flask :8000 `/disease-cure` (RAG)
4. Returns both detection and cure to user

## 🗄️ Database Schema

The system uses 12 tables:
- users
- refresh_tokens
- schemes
- surveys
- survey_responses
- chat_history
- disease_detections
- soil_data
- resource_estimations
- weather_queries
- feedback
- reports

## 🔐 User Roles

1. **Farmer** - Regular user with access to all features
2. **Admin** - Can create schemes, manage surveys, view analytics

## 📊 Features

✅ JWT-based authentication with refresh tokens
✅ Role-based access control (Farmer/Admin)
✅ Image upload for disease detection and surveys
✅ Integration with Flask ML models
✅ Complete history tracking for all user interactions
✅ Feedback and reporting system
✅ Weekly survey system for disease data collection
✅ Government scheme management
✅ Admin analytics dashboard

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production
npm start
```

## 📦 Dependencies

- express
- pg (PostgreSQL)
- bcryptjs
- jsonwebtoken
- axios
- multer
- dotenv
- cors
- express-validator
- form-data

## 🚨 Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## 📄 License

MIT

## 👥 Team

AgroShakti Development Team

---

**Note:** Make sure both Flask ML services are running on ports 8000 and 8001 before using the hooks functionality.
