/**
 * Supabase PostgreSQL 데이터베이스 연결
 * estate-registry-et1 폴더의 DB와 연결
 */

require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');

// 환경 변수에서 DB 연결 정보 가져오기
// estate-registry-et1/.env 파일의 DATABASE_URL 사용
let DATABASE_URL = process.env.DATABASE_URL;

// .env 파일이 없거나 DATABASE_URL이 없으면 estate-registry-et1 폴더의 .env에서 읽기 시도
if (!DATABASE_URL) {
  try {
    const fs = require('fs');
    const estateEnvPath = path.join(__dirname, '../../estate-registry-et1/.env');
    if (fs.existsSync(estateEnvPath)) {
      const envContent = fs.readFileSync(estateEnvPath, 'utf8');
      const match = envContent.match(/DATABASE_URL=(.+)/);
      if (match) {
        DATABASE_URL = match[1].trim().replace(/^["']|["']$/g, '');
        console.log('✅ estate-registry-et1/.env에서 DATABASE_URL 로드됨');
      }
    }
  } catch (error) {
    console.warn('⚠️ estate-registry-et1/.env 읽기 실패:', error.message);
  }
}

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.\nbackend/.env 또는 estate-registry-et1/.env 파일에 DATABASE_URL을 설정해주세요.');
}

// PostgreSQL 연결 풀 생성
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 연결 테스트
pool.on('connect', () => {
  console.log('✅ PostgreSQL 데이터베이스 연결 성공');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 연결 오류:', err);
});

/**
 * 쿼리 실행 (Promise 기반)
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 쿼리 실행:', { text: text.substring(0, 50), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ 쿼리 오류:', error.message);
    throw error;
  }
}

/**
 * 단일 행 조회
 */
async function get(text, params) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

/**
 * 여러 행 조회
 */
async function all(text, params) {
  const result = await query(text, params);
  return result.rows;
}

/**
 * 연결 종료
 */
async function close() {
  await pool.end();
  console.log('데이터베이스 연결 종료');
}

module.exports = {
  pool,
  query,
  get,
  all,
  close
};

