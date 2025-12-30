const jwt = require('jsonwebtoken');

// JWT_SECRET은 반드시 환경 변수로 설정해야 함
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET 환경 변수가 설정되지 않았습니다!');
  console.error('   EC2: export JWT_SECRET="your-secure-secret-key"');
  console.error('   또는 .env 파일에 JWT_SECRET=your-secure-secret-key 추가');
  throw new Error('JWT_SECRET 환경 변수가 필요합니다');
}

const JWT_SECRET = process.env.JWT_SECRET;

// JWT 토큰 검증 미들웨어
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
  }
};

// 관리자 권한 체크 미들웨어
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly, JWT_SECRET };
