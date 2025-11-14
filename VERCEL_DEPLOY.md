# 🚀 Vercel 배포 가이드

## 📋 배포 전 준비사항

### 1. Vercel 계정 생성
- [Vercel](https://vercel.com)에 가입
- GitHub 계정으로 연동 (권장)

### 2. 환경 변수 준비
다음 환경 변수들을 Vercel에 설정해야 합니다:

#### 프론트엔드 프로젝트
- `REACT_APP_GEMINI_API_KEY`: Google Gemini API 키
- `REACT_APP_API_URL`: 백엔드 API URL (백엔드 배포 후 설정)

#### 백엔드 프로젝트
- `DATABASE_URL`: PostgreSQL 연결 문자열 (Supabase)
- `PORT`: 서버 포트 (자동 설정됨)

---

## 🔧 배포 방법

### 방법 1: Vercel CLI 사용 (권장)

#### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

#### 2. 프론트엔드 배포
```bash
# 루트 디렉토리에서
vercel

# 프로젝트 이름 설정 (예: zem-proj1realestate-frontend)
# 프레임워크: Other
# 빌드 명령어: npm run build
# 출력 디렉토리: build
```

#### 3. 백엔드 배포
```bash
# backend 디렉토리로 이동
cd backend
vercel

# 프로젝트 이름 설정 (예: zem-proj1realestate-backend)
# 프레임워크: Other
# 루트 디렉토리: backend
```

#### 4. 환경 변수 설정
```bash
# 프론트엔드 프로젝트에 환경 변수 추가
vercel env add REACT_APP_GEMINI_API_KEY
vercel env add REACT_APP_API_URL

# 백엔드 프로젝트에 환경 변수 추가
cd backend
vercel env add DATABASE_URL
```

---

### 방법 2: GitHub 연동 (자동 배포)

#### 1. GitHub 저장소 연결
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택: `dlawlgur16/zem.proj1realestate`

#### 2. 프론트엔드 프로젝트 설정
- **Project Name**: `zem-proj1realestate-frontend`
- **Framework Preset**: Other
- **Root Directory**: `./` (루트)
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

**Environment Variables:**
```
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
```

#### 3. 백엔드 프로젝트 설정 (별도 프로젝트로)
1. 다시 "Add New..." → "Project" 클릭
2. 같은 GitHub 저장소 선택
3. **Project Name**: `zem-proj1realestate-backend`
- **Framework Preset**: Other
- **Root Directory**: `./backend`
- **Build Command**: (비워두기)
- **Output Directory**: (비워두기)
- **Install Command**: `npm install`

**Environment Variables:**
```
DATABASE_URL=postgresql://user:password@host:port/database
```

---

## 🔄 배포 후 설정

### 1. 백엔드 URL 확인
백엔드 배포 후 생성된 URL 확인:
```
https://zem-proj1realestate-backend.vercel.app
```

### 2. 프론트엔드 환경 변수 업데이트
프론트엔드 프로젝트의 `REACT_APP_API_URL`을 백엔드 URL로 업데이트:
```
REACT_APP_API_URL=https://zem-proj1realestate-backend.vercel.app/api
```

### 3. 재배포
환경 변수 변경 후 자동으로 재배포되거나, 수동으로 재배포:
```bash
vercel --prod
```

---

## 📝 주의사항

### 1. 파일 크기 제한
- Vercel은 함수 실행 시간 제한이 있습니다 (무료 플랜: 10초)
- 큰 파일 업로드는 제한될 수 있습니다

### 2. 데이터베이스 연결
- Supabase PostgreSQL은 외부 연결을 허용해야 합니다
- Supabase Dashboard에서 연결 설정 확인

### 3. CORS 설정
- 백엔드의 CORS 설정이 프론트엔드 도메인을 허용하는지 확인
- `backend/server.js`에서 CORS 설정 확인

### 4. 환경 변수 보안
- `.env` 파일은 Git에 커밋하지 않음
- Vercel Dashboard에서만 환경 변수 관리

---

## 🧪 배포 확인

### 프론트엔드 확인
```
https://your-frontend-url.vercel.app
```

### 백엔드 Health Check
```
https://your-backend-url.vercel.app/api/health
```

정상 응답 예시:
```json
{
  "status": "ok",
  "message": "재건축 데이터 분석 시스템 백엔드 서버",
  "database": "connected",
  "timestamp": "2025-11-14T..."
}
```

---

## 🐛 문제 해결

### 빌드 실패
- `npm install`이 제대로 실행되는지 확인
- 빌드 로그에서 에러 메시지 확인

### API 연결 실패
- `REACT_APP_API_URL`이 올바르게 설정되었는지 확인
- 백엔드가 정상적으로 배포되었는지 확인

### 데이터베이스 연결 실패
- `DATABASE_URL`이 올바른지 확인
- Supabase에서 외부 연결이 허용되었는지 확인

---

## 📚 참고 자료
- [Vercel 공식 문서](https://vercel.com/docs)
- [Vercel Node.js 가이드](https://vercel.com/docs/concepts/functions/serverless-functions)
- [React 앱 배포 가이드](https://vercel.com/docs/frameworks/react)

