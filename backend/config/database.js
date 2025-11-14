/**
 * Supabase PostgreSQL 데이터베이스 연결
 * estate-registry-et1 폴더의 DB와 연결
 */

// Vercel 환경 감지 (여러 방법으로 확인)
const isVercel = process.env.VERCEL 
  || process.env.VERCEL_ENV 
  || process.env.VERCEL_URL
  || (typeof process.env.NOW_REGION !== 'undefined');

// Vercel serverless 환경에서는 dotenv가 필요 없음 (환경 변수가 자동 주입됨)
// 로컬 개발 환경에서만 dotenv 사용
if (process.env.NODE_ENV !== 'production' && !isVercel) {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv가 없어도 계속 진행
  }
}

const { Pool } = require('pg');
const path = require('path');

// 환경 변수에서 DB 연결 정보 가져오기
// 로컬에서는 estate-registry-et1/.env 파일을 우선 사용
// Vercel에서는 process.env.DATABASE_URL을 직접 사용
let DATABASE_URL = null;

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

// 로컬 환경에서는 먼저 estate-registry-et1/.env 파일에서 읽기 시도
if (!isVercel) {
  try {
    const fs = require('fs');
    const estateEnvPath = path.join(__dirname, '../../estate-registry-et1/.env');
    console.log('🔍 estate-registry-et1/.env 파일 확인:', estateEnvPath);
    
    if (fs.existsSync(estateEnvPath)) {
      console.log('✅ estate-registry-et1/.env 파일 발견');
      const envContent = fs.readFileSync(estateEnvPath, 'utf8');
      
      // 여러 방법으로 DATABASE_URL 찾기
      let match = envContent.match(/^DATABASE_URL\s*=\s*(.+)$/m);
      if (!match) {
        match = envContent.match(/DATABASE_URL\s*=\s*(.+?)(?:\r?\n|$)/);
      }
      if (!match) {
        // 줄별로 검색
        const lines = envContent.split(/\r?\n/);
        for (const line of lines) {
          if (line.trim().startsWith('DATABASE_URL=')) {
            match = line.match(/DATABASE_URL\s*=\s*(.+)$/);
            if (match) break;
          }
        }
      }
      
      if (match) {
        DATABASE_URL = match[1].trim().replace(/^["']|["']$/g, '');
        if (!isPlaceholder(DATABASE_URL)) {
          console.log('✅ estate-registry-et1/.env에서 DATABASE_URL 로드됨 (로컬)');
          console.log('📝 DATABASE_URL 시작:', DATABASE_URL.substring(0, 50) + '...');
        } else {
          console.warn('⚠️ estate-registry-et1/.env의 DATABASE_URL도 placeholder 값입니다.');
          DATABASE_URL = null;
        }
      } else {
        console.warn('⚠️ estate-registry-et1/.env에서 DATABASE_URL을 찾을 수 없습니다.');
      }
    } else {
      console.warn('⚠️ estate-registry-et1/.env 파일이 존재하지 않습니다.');
    }
  } catch (error) {
    console.error('❌ estate-registry-et1/.env 읽기 실패:', error.message);
    console.error('❌ 에러 스택:', error.stack);
  }
}

// 파일에서 읽지 못했거나 Vercel 환경이면 process.env에서 가져오기
// 단, placeholder 값이면 무시
if (!DATABASE_URL || (isVercel && isPlaceholder(DATABASE_URL))) {
  const envDbUrl = process.env.DATABASE_URL 
    || process.env.POSTGRES_URL 
    || process.env.POSTGRES_CONNECTION_STRING
    || process.env.DATABASE_CONNECTION_STRING;
  
  // placeholder가 아니면 사용
  if (envDbUrl && !isPlaceholder(envDbUrl)) {
    DATABASE_URL = envDbUrl;
    if (isVercel) {
      console.log('✅ Vercel 환경에서 process.env.DATABASE_URL 로드됨');
    }
  } else if (envDbUrl && isPlaceholder(envDbUrl)) {
    console.warn('⚠️ process.env.DATABASE_URL이 placeholder 값입니다.');
    DATABASE_URL = null; // placeholder이면 null로 설정하여 파일 읽기 재시도
  } else if (isVercel && !envDbUrl) {
    console.error('❌ Vercel 환경인데 DATABASE_URL 환경 변수가 없습니다!');
  }
}

// 여전히 없고 로컬 환경이면 다시 파일 읽기 시도
if (!DATABASE_URL && !isVercel) {
  try {
    const fs = require('fs');
    const estateEnvPath = path.join(__dirname, '../../estate-registry-et1/.env');
    if (fs.existsSync(estateEnvPath)) {
      const envContent = fs.readFileSync(estateEnvPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const match = line.match(/^DATABASE_URL\s*=\s*(.+)$/);
        if (match) {
          DATABASE_URL = match[1].trim().replace(/^["']|["']$/g, '');
          if (!isPlaceholder(DATABASE_URL)) {
            console.log('✅ estate-registry-et1/.env에서 DATABASE_URL 로드됨 (재시도)');
            break;
          }
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ estate-registry-et1/.env 재읽기 실패:', error.message);
  }
}

// 디버깅: 모든 환경 변수 확인
console.log('🔍 환경 변수 확인:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  DATABASE_URL_exists: !!process.env.DATABASE_URL,
  DATABASE_URL_type: typeof process.env.DATABASE_URL,
  DATABASE_URL_length: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
  all_env_keys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('DB'))
});

// DATABASE_URL이 없으면 명확한 에러 메시지
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL을 찾을 수 없습니다!');
  console.error('🔍 확인한 환경 변수:', {
    'process.env.DATABASE_URL': process.env.DATABASE_URL,
    'process.env.POSTGRES_URL': process.env.POSTGRES_URL,
    'process.env.POSTGRES_CONNECTION_STRING': process.env.POSTGRES_CONNECTION_STRING
  });
  console.error('📋 모든 환경 변수 키 (처음 50개):', Object.keys(process.env).slice(0, 50));
}

if (DATABASE_URL) {
  const maskedUrl = DATABASE_URL.replace(/:[^:@]+@/, ':****@');
  console.log('📡 DATABASE_URL 발견:', maskedUrl.substring(0, 80) + '...');
} else {
  console.error('❌ process.env.DATABASE_URL이 설정되지 않았습니다.');
  console.error('🔍 사용 가능한 환경 변수:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DB')));
}

// (이미 위에서 estate-registry-et1/.env 파일을 읽었으므로 여기서는 제거)

if (!DATABASE_URL) {
  const errorMsg = 'DATABASE_URL 환경 변수가 설정되지 않았습니다.\n' +
    'Vercel Dashboard에서 환경 변수를 설정해주세요:\n' +
    'https://vercel.com/jis-projects-55d8fd7d/backend/settings/environment-variables';
  console.error('❌', errorMsg);
  throw new Error(errorMsg);
}

// DATABASE_URL 유효성 검사
if (typeof DATABASE_URL !== 'string') {
  console.error('❌ DATABASE_URL 타입 오류:', typeof DATABASE_URL, DATABASE_URL);
  throw new Error(`DATABASE_URL이 유효하지 않습니다. 문자열이어야 하는데 ${typeof DATABASE_URL} 타입입니다.`);
}

if (DATABASE_URL.trim() === '') {
  console.error('❌ DATABASE_URL이 빈 문자열입니다.');
  throw new Error('DATABASE_URL이 빈 문자열입니다.');
}

// DATABASE_URL 형식 검사 (postgresql://로 시작해야 함)
if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
  console.error('❌ DATABASE_URL 형식 오류:', DATABASE_URL.substring(0, 50));
  throw new Error('DATABASE_URL은 postgresql:// 또는 postgres://로 시작해야 합니다.');
}

// PostgreSQL 연결 풀 생성
let pool;
try {
  console.log('🔧 PostgreSQL 연결 풀 생성 시도...');
  console.log('📝 connectionString 길이:', DATABASE_URL.length);
  console.log('📝 connectionString 시작:', DATABASE_URL.substring(0, 30) + '...');
  
  pool = new Pool({
    connectionString: DATABASE_URL.trim(), // 공백 제거
    ssl: (DATABASE_URL.includes('supabase') || DATABASE_URL.includes('postgres')) ? { rejectUnauthorized: false } : false,
    max: 20, // 최대 연결 수
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // 타임아웃 증가
  });
  console.log('✅ PostgreSQL 연결 풀 생성 완료');
} catch (error) {
  console.error('❌ PostgreSQL 연결 풀 생성 실패:', error.message);
  console.error('❌ 에러 스택:', error.stack);
  throw new Error(`데이터베이스 연결 풀 생성 실패: ${error.message}`);
}

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

