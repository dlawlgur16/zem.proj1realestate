const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const processedDataRoutes = require('./routes/processedData');
const AutoPreprocessor = require('./services/autoPreprocessor');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 자동 전처리 시스템 시작
let autoPreprocessor;
try {
  autoPreprocessor = new AutoPreprocessor();
  console.log('🤖 자동 전처리 시스템 시작됨');
} catch (error) {
  console.error('❌ 자동 전처리 시스템 시작 실패:', error);
}

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 라우트
app.use('/api/processed', processedDataRoutes);

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: '서버 내부 오류가 발생했습니다.',
    message: err.message 
  });
});

// 404 핸들링
app.use('*', (req, res) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
