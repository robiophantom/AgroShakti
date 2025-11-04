const app = require('./src/app');
const pool = require('./src/config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`\n🚀 AgroShakti Backend Server is running`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`\n📚 API Documentation:`);
      console.log(`   Auth:     /api/auth/*`);
      console.log(`   Schemes:  /api/schemes/*`);
      console.log(`   Surveys:  /api/surveys/*`);
      console.log(`   Hooks:    /api/hooks/*`);
      console.log(`   History:  /api/history/*`);
      console.log(`   Feedback: /api/feedback/*`);
      console.log(`   Admin:    /api/admin/*\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

startServer();