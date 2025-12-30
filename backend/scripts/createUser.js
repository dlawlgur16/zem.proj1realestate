/**
 * 사용자 계정 생성 스크립트
 *
 * 사용법: node backend/scripts/createUser.js <username> <password> [role]
 * 예시:
 *   node backend/scripts/createUser.js user1 mypassword        (일반 계정)
 *   node backend/scripts/createUser.js admin2 adminpass admin  (관리자 계정)
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/database');

async function createUser() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('사용법: node createUser.js <username> <password> [role]');
    console.log('예시: node createUser.js user1 mypassword');
    console.log('      node createUser.js admin2 adminpass admin');
    process.exit(1);
  }

  const username = args[0];
  const password = args[1];
  const role = args[2] || 'user'; // 기본값: user

  if (role !== 'admin' && role !== 'user') {
    console.error('역할은 admin 또는 user만 가능합니다.');
    process.exit(1);
  }

  try {
    // 중복 체크
    const existing = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      console.error(`❌ "${username}" 계정이 이미 존재합니다.`);
      process.exit(1);
    }

    // 비밀번호 해시화
    const passwordHash = await bcrypt.hash(password, 10);

    // 계정 생성
    await query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
      [username, passwordHash, role]
    );

    console.log('✅ 계정 생성 완료');
    console.log(`   - 사용자명: ${username}`);
    console.log(`   - 역할: ${role === 'admin' ? '관리자' : '일반'}`);
  } catch (error) {
    console.error('❌ 계정 생성 실패:', error.message);
  } finally {
    await pool.end();
  }
}

createUser();
