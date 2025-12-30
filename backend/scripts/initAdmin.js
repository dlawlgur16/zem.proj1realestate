/**
 * 초기 관리자 계정 생성 스크립트
 *
 * 사용법: node backend/scripts/initAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/database');

async function initAdmin() {
  try {
    console.log('🔧 users 테이블 생성 중...');

    // users 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('✅ users 테이블 생성 완료');

    // 기존 admin 계정 확인
    const existingAdmin = await query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('ℹ️ admin 계정이 이미 존재합니다.');
    } else {
      // 비밀번호 해시화 (기본 비밀번호: admin123)
      const password = 'admin123';
      const passwordHash = await bcrypt.hash(password, 10);

      // admin 계정 생성
      await query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        ['admin', passwordHash, 'admin']
      );

      console.log('✅ 관리자 계정 생성 완료');
      console.log('   - 사용자명: admin');
      console.log('   - 비밀번호: admin123');
      console.log('   - 역할: admin');
    }

    console.log('✅ 초기화 완료');
  } catch (error) {
    console.error('❌ 초기화 실패:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

initAdmin();
