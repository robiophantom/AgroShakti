const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const schemeRoutes = require('./routes/scheme.routes');
const surveyRoutes = require('./routes/survey.routes');
const hooksRoutes = require('./routes/hooks.routes');
const historyRoutes = require('./routes/history.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const adminRoutes = require('./routes/admin.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
// Development-friendly CORS: reflect any origin that calls the API.
// This avoids "Not allowed by CORS" errors while you build the frontend.
app.use(cors({
  origin: true,        // reflect request origin
  credentials: true    // allow Authorization header / cookies
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'AgroShakti Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/hooks', hooksRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;