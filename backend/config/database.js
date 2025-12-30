/**
 * Supabase PostgreSQL 데이터베이스 연결
 */

const { Pool } = require('pg');
const path = require('path');

// 환경 설정
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL;

// 로컬 개발 환경에서만 dotenv 사용
if (!isProduction && !isVercel) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv가 없어도 계속 진행
  }
}

// placeholder 값인지 확인하는 함수
function isPlaceholder(value) {
  if (!value) return true;
  const placeholderPatterns = [
    /postgresql:\/\/user:/i,
    /postgresql:\/\/.*@host:/i,
    /postgresql:\/\/.*:port\//i,
    /\[PASSWORD\]/i,
    /\[HOST\]/i,
    /\[PORT\]/i
  ];
  return placeholderPatterns.some(pattern => pattern.test(value));
}

// DATABASE_URL 가져오기
let DATABASE_URL = null;

// 1. process.env에서 먼저 확인
const envDbUrl = process.env.DATABASE_URL
  || process.env.POSTGRES_URL
  || process.env.POSTGRES_CONNECTION_STRING;

if (envDbUrl && !isPlaceholder(envDbUrl)) {
  DATABASE_URL = envDbUrl;
}

// 2. 로컬 환경에서 estate-registry-et1/.env 파일 확인
if (!DATABASE_URL && !isVercel) {
  try {
    const fs = require('fs');
    const estateEnvPath = path.join(__dirname, '../../estate-registry-et1/.env');

    if (fs.existsSync(estateEnvPath)) {
      const envContent = fs.readFileSync(estateEnvPath, 'utf8');
      const lines = envContent.split(/\r?\n/);

      for (const line of lines) {
        if (line.trim().startsWith('DATABASE_URL=')) {
          const match = line.match(/DATABASE_URL\s*=\s*(.+)$/);
          if (match) {
            const url = match[1].trim().replace(/^["']|["']$/g, '');
            if (!isPlaceholder(url)) {
              DATABASE_URL = url;
              break;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ .env 파일 읽기 실패:', error.message);
  }
}

// DATABASE_URL 검증
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
}

if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
  throw new Error('DATABASE_URL은 postgresql:// 또는 postgres://로 시작해야 합니다.');
}

// PostgreSQL 연결 풀 생성
const pool = new Pool({
  connectionString: DATABASE_URL.trim(),
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// 연결 이벤트 (개발 환경에서만 로그)
if (!isProduction) {
  pool.on('connect', () => {
    console.log('✅ PostgreSQL 연결 성공');
  });
}

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 연결 오류:', err.message);
});

/**
 * 쿼리 실행
 */
async function query(text, params) {
  try {
    const res = await pool.query(text, params);
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
}

module.exports = {
  pool,
  query,
  get,
  all,
  close
};
