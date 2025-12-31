# 재건축 데이터 분석 시스템

재건축 아파트 조합원 데이터를 분석하고 AI 기반 보고서를 생성하는 웹 애플리케이션입니다.

## 주요 기능

### 데이터 분석
- **연령대별 분석**: 20대~80대+ 연령대별 상세 통계
- **투자자 거주지역**: 전국 및 해외 거주지 분포
- **대출 현황**: 근저당 설정 비율, 평균 대출금액 분석
- **보유기간**: 장기/단기 보유 패턴 분석
- **압류/가압류 현황**: 법적 리스크 분석
- **면적별 분포**: 평형별 투자 성향 분석

### AI 보고서 생성
- **Google Gemini AI**: AI 분석 보고서 자동 생성
- **연령대별 인사이트**: 각 연령대의 특성과 조합 참여 가능성 분석
- **다양한 형식**: Markdown, HTML 형식으로 다운로드 가능

### 사용자 관리
- **JWT 인증**: 토큰 기반 로그인 시스템
- **역할 기반 권한**: admin(관리자), user(일반 사용자)
  - admin: 데이터 업로드/삭제 가능
  - user: 조회만 가능

## 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│   Vercel        │    │   EC2 + CF      │    │   Supabase      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

- **Frontend**: React (Vercel 배포)
- **Backend**: Node.js/Express (EC2 + Cloudflare Tunnel)
- **Database**: PostgreSQL (Supabase)
- **AI**: Google Gemini API

## 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/dlawlgur16/zem.proj1realestate.git
cd zem.proj1realestate
```

### 2. 프론트엔드 설정
```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# 개발 서버 실행
npm start
```

### 3. 백엔드 설정
```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정

# 개발 서버 실행
npm run dev
```

### 4. 초기 관리자 계정 생성
```bash
cd backend
node scripts/initAdmin.js
```

## 프로젝트 구조

```
zem.proj1realestate/
├── src/                          # 프론트엔드
│   ├── components/
│   │   ├── DataAnalysis/         # 데이터 분석 컴포넌트
│   │   │   └── Charts/           # 차트 컴포넌트
│   │   ├── ReportGenerator.js    # AI 보고서 생성
│   │   ├── ReportPreview.js      # 보고서 미리보기
│   │   └── ProjectCard.js        # 프로젝트 카드
│   ├── pages/
│   │   ├── Login.jsx             # 로그인 페이지
│   │   └── ProjectIndex.js       # 프로젝트 목록
│   └── utils/
│       ├── api.js                # API 호출
│       ├── auth.js               # 인증 유틸
│       └── dataLoader.js         # 데이터 로딩
├── backend/
│   ├── config/
│   │   └── database.js           # DB 연결 설정
│   ├── middleware/
│   │   └── auth.js               # JWT 인증 미들웨어
│   ├── routes/
│   │   ├── auth.js               # 인증 API
│   │   └── buildings.js          # 건물 데이터 API
│   ├── schema/
│   │   └── complete_schema.sql   # DB 스키마
│   ├── scripts/
│   │   └── initAdmin.js          # 관리자 초기화
│   └── server.js                 # Express 서버
└── .github/workflows/            # CI/CD
```

## 환경 변수

### 프론트엔드 (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

### 백엔드 (.env)
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

## 데이터베이스 테이블

- **buildings**: 단지 정보
- **units**: 세대 정보 (소유자, 연령, 대출 등)
- **users**: 사용자 정보 (인증용)
- **mortgages**: 근저당 정보
- **raw_documents**: PDF 원본 정보

## API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입 (admin만)
- `GET /api/auth/me` - 현재 사용자 정보

### 건물 데이터
- `GET /api/buildings` - 건물 목록
- `GET /api/buildings/:id/units` - 세대 목록
- `POST /api/upload/csv` - CSV 업로드 (admin만)
- `DELETE /api/buildings/:id` - 건물 삭제 (admin만)

## 배포

### Frontend (Vercel)
- GitHub 연동으로 자동 배포
- main 브랜치 push 시 자동 빌드

### Backend (EC2)
```bash
# PM2로 서버 실행
pm2 start ecosystem.config.js

# Cloudflare Tunnel로 외부 노출
cloudflared tunnel --url http://localhost:5001
```

## 기술 스택

### Frontend
- React 18
- Recharts (차트)
- React Router
- Papa Parse (CSV 파싱)

### Backend
- Node.js / Express
- PostgreSQL (pg)
- JWT (jsonwebtoken)
- bcryptjs (비밀번호 해싱)

### Infrastructure
- Vercel (Frontend)
- AWS EC2 (Backend)
- Cloudflare Tunnel
- Supabase (PostgreSQL)

## 라이선스

MIT License
