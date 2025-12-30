/**
 * Initialize admin user
 * Run once: node scripts/init-admin.js
 */

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123!';  // Change this in production

async function initAdmin() {
  try {
    // Create users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ users table ready');

    // Check if admin exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [ADMIN_USERNAME]
    );

    if (existing.rows.length > 0) {
      console.log('⚠️ Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
      [ADMIN_USERNAME, passwordHash, 'admin']
    );

    console.log('✅ Admin user created');
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('   ⚠️ Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initAdmin();
