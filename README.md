# 재건축 데이터 분석 시스템

재건축 아파트의 데이터를 분석하고 AI 기반 보고서를 생성하는 시스템입니다.

## 🏗️ 아키텍처

### 프론트엔드 (React)
```
src/
├── components/
│   ├── CsvLoader/           # CSV 로드 기능
│   ├── DataAnalysis/        # 데이터 분석 및 시각화
│   ├── ReportGenerator/     # AI 리포트 작성
│   └── MainApp.js          # 메인 앱 컴포넌트
├── services/
│   └── api.js              # API 호출 서비스
└── utils/
    └── dataProcessor.js    # 데이터 처리 유틸리티
```

### 백엔드 (Node.js + Express)
```
backend/
├── server.js              # Express 서버
├── routes/
│   ├── data.js           # 데이터 처리 라우트
│   └── report.js         # 리포트 생성 라우트
├── services/
│   ├── dataAnalysis.js   # 데이터 분석 서비스
│   └── aiReport.js       # AI 리포트 서비스
└── package.json
```

## 🚀 설치 및 실행

### 1. 프론트엔드 설정
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

### 2. 백엔드 설정
```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env
# .env 파일에서 GEMINI_API_KEY 설정

# 개발 서버 실행
npm run dev
```

## 🔧 환경 변수 설정

### 백엔드 (.env)
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## 📊 주요 기능

### 1. CSV 데이터 로드
- CSV 파일 업로드 및 파싱
- 데이터 검증 및 오류 처리
- 실시간 로딩 상태 표시

### 2. 데이터 분석 및 시각화
- 나이대별 분포 차트
- 대출 여부 비율 분석
- 압류/가압류 현황 분석
- 연령대별 필터링 기능

### 3. AI 리포트 생성
- Gemini AI를 활용한 자동 보고서 생성
- 시공사 관점의 실무적 분석
- 보고서 다운로드 기능

## 🛠️ 기술 스택

### 프론트엔드
- React 18
- Recharts (차트 라이브러리)
- Papa Parse (CSV 파싱)
- Tailwind CSS (스타일링)

### 백엔드
- Node.js
- Express.js
- Gemini AI API
- CORS

## 📁 파일 구조

### 컴포넌트별 역할

#### CsvLoader
- CSV 파일 업로드 및 파싱
- 데이터 검증
- 오류 처리

#### DataAnalysis
- 데이터 시각화
- 차트 컴포넌트 관리
- 필터링 기능

#### ReportGenerator
- AI 리포트 생성
- 보고서 미리보기
- 다운로드 기능

## 🔄 데이터 플로우

1. **데이터 업로드**: 사용자가 CSV 파일 업로드
2. **데이터 파싱**: Papa Parse로 CSV 데이터 파싱
3. **데이터 분석**: 백엔드에서 통계 계산
4. **시각화**: Recharts로 차트 렌더링
5. **AI 리포트**: Gemini API로 보고서 생성

## 🚀 배포

### 프론트엔드 배포
```bash
npm run build
# build 폴더를 웹 서버에 배포
```

### 백엔드 배포
```bash
# PM2를 사용한 프로덕션 배포
npm install -g pm2
pm2 start server.js --name "reconstruction-api"
```

## 📝 API 엔드포인트

### 데이터 분석
- `POST /api/data/analyze` - 데이터 분석
- `GET /api/data/summary` - 통계 요약

### 리포트 생성
- `POST /api/generate-report` - AI 리포트 생성
- `GET /api/templates` - 리포트 템플릿 조회

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.