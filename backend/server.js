/**
 * 재건축 데이터 분석 시스템 백엔드 서버
 * Express.js 기반 REST API 서버
 * Supabase PostgreSQL DB 연결
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// DB 연결 테스트
const { query } = require('./config/database');

// 라우트 임포트
const uploadRouter = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 라우트
app.use('/api/upload', uploadRouter);

// 헬스 체크 및 DB 연결 테스트
app.get('/api/health', async (req, res) => {
  try {
    // DB 연결 테스트
    await query('SELECT 1');
    res.json({ 
      status: 'ok', 
      message: '재건축 데이터 분석 시스템 백엔드 서버',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: '데이터베이스 연결 실패',
      error: error.message
    });
  }
});

// 루트 경로
app.get('/', (req, res) => {
  res.json({ 
    message: '재건축 데이터 분석 시스템 API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      upload: '/api/upload/csv'
    }
  });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error('에러 발생:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || '서버 내부 오류가 발생했습니다.',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

// 서버 시작
app.listen(PORT, async () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}/api`);
  
  // DB 연결 테스트
  try {
    await query('SELECT 1');
    console.log('✅ 데이터베이스 연결 성공');
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
    console.error('💡 estate-registry-et1/.env 파일의 DATABASE_URL을 확인해주세요.');
  }
});

module.exports = app;

