const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
});

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');
  
  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');

    // Read migration file
    console.log('📄 Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', 'database_migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('✅ Migration file loaded!\n');

    // Run migrations
    console.log('⚙️  Running migrations...');
    await pool.query(sql);
    console.log('✅ All tables created successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('✅ Tables created:');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 Total tables:', result.rows.length);
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Tip: Check your database connection settings in .env file');
    } else if (error.code === '28P01') {
      console.error('\n💡 Tip: Check your database password in .env file');
    } else if (error.code === '42P07') {
      console.error('\n💡 Tip: Tables already exist. Drop them first or skip migration.');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
