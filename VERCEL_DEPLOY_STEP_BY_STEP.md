# 🚀 Vercel 배포 단계별 가이드

## 📋 준비사항

1. Vercel CLI 설치 확인: `vercel --version`
2. Vercel 로그인 확인: `vercel whoami`
3. 환경 변수 준비:
   - `DATABASE_URL`: Supabase PostgreSQL 연결 문자열
   - `REACT_APP_GEMINI_API_KEY`: Gemini API 키

---

## 🔧 1단계: 백엔드 배포

### 1-1. 백엔드 디렉토리로 이동
```bash
cd backend
```

### 1-2. Vercel 배포
```bash
vercel
```

**질문에 답변:**
- Set up and deploy? → **Y**
- Which scope? → 본인 계정 선택
- Link to existing project? → **N** (처음 배포하는 경우)
- What's your project's name? → `zem-proj1realestate-backend` (또는 원하는 이름)
- In which directory is your code located? → `./` (현재 디렉토리)
- Want to override the settings? → **N**

### 1-3. Production 배포
```bash
vercel --prod
```

---

## 🔐 2단계: 백엔드 환경 변수 설정

### 2-1. Vercel Dashboard 접속
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 방금 배포한 백엔드 프로젝트 클릭
3. **Settings** → **Environment Variables** 클릭

### 2-2. DATABASE_URL 추가
- **Name**: `DATABASE_URL`
- **Value**: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require`
  - `[PASSWORD]`: Supabase 비밀번호
  - `[HOST]`: Supabase 호스트 주소
- **Environment**: Production, Preview, Development 모두 선택
- **Save** 클릭

### 2-3. 백엔드 재배포
환경 변수 추가 후 자동으로 재배포되거나, 수동으로:
```bash
cd backend
vercel --prod
```

### 2-4. 백엔드 Health Check
배포된 백엔드 URL 확인:
```
https://[프로젝트명].vercel.app/api/health
```

정상 응답 예시:
```json
{
  "status": "ok",
  "message": "재건축 데이터 분석 시스템 백엔드 서버",
  "database": "connected",
  "environment": "vercel"
}
```

**백엔드 URL 저장**: 다음 단계에서 사용합니다.
예: `https://zem-proj1realestate-backend.vercel.app`

---

## 🎨 3단계: 프론트엔드 배포

### 3-1. 루트 디렉토리로 이동
```bash
cd ..  # backend에서 루트로
```

### 3-2. Vercel 배포
```bash
vercel
```

**질문에 답변:**
- Set up and deploy? → **Y**
- Which scope? → 본인 계정 선택
- Link to existing project? → **N** (처음 배포하는 경우)
- What's your project's name? → `zem-proj1realestate-frontend` (또는 원하는 이름)
- In which directory is your code located? → `./` (현재 디렉토리)
- Want to override the settings? → **N**

### 3-3. Production 배포
```bash
vercel --prod
```

---

## 🔐 4단계: 프론트엔드 환경 변수 설정

### 4-1. Vercel Dashboard 접속
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 방금 배포한 프론트엔드 프로젝트 클릭
3. **Settings** → **Environment Variables** 클릭

### 4-2. REACT_APP_API_URL 추가
- **Name**: `REACT_APP_API_URL`
- **Value**: `https://[백엔드-프로젝트명].vercel.app/api`
  - 예: `https://zem-proj1realestate-backend.vercel.app/api`
- **Environment**: Production, Preview, Development 모두 선택
- **Save** 클릭

### 4-3. REACT_APP_GEMINI_API_KEY 추가
- **Name**: `REACT_APP_GEMINI_API_KEY`
- **Value**: `AIzaSyC_YQfGwUuvEst0q5yWgnjgwj3YT7rkmew` (또는 실제 API 키)
- **Environment**: Production, Preview, Development 모두 선택
- **Save** 클릭

### 4-4. 프론트엔드 재배포
환경 변수 추가 후 자동으로 재배포되거나, 수동으로:
```bash
vercel --prod
```

---

## ✅ 5단계: 최종 확인

### 5-1. 프론트엔드 접속
배포된 프론트엔드 URL로 접속:
```
https://[프론트엔드-프로젝트명].vercel.app
```

### 5-2. 확인 사항
1. ✅ 프로젝트 목록이 표시되는지
2. ✅ DB에 저장된 건물들이 보이는지
3. ✅ 프로젝트 클릭 시 데이터 분석이 작동하는지
4. ✅ 파일 업로드가 작동하는지
5. ✅ 보고서 생성이 작동하는지

---

## 🔧 문제 해결

### 백엔드가 DB에 연결되지 않는 경우
- [ ] `DATABASE_URL` 환경 변수가 올바른지 확인
- [ ] Supabase 연결 문자열 형식 확인 (`postgresql://...`)
- [ ] Vercel Dashboard에서 환경 변수가 설정되었는지 확인
- [ ] 백엔드 로그 확인: Vercel Dashboard → Deployments → Functions → Logs

### 프론트엔드가 백엔드에 연결되지 않는 경우
- [ ] `REACT_APP_API_URL`이 올바른 백엔드 URL인지 확인
- [ ] 백엔드 URL이 `/api`로 끝나는지 확인
- [ ] 브라우저 콘솔에서 네트워크 에러 확인
- [ ] CORS 에러가 있는지 확인 (백엔드 CORS 설정 확인)

---

## 📝 참고사항

- 환경 변수 변경 후 자동 재배포가 되지 않으면 수동으로 `vercel --prod` 실행
- 로컬 개발 환경에서는 자동으로 `localhost:5000`을 사용합니다
- 배포 환경에서는 `REACT_APP_API_URL` 환경 변수를 사용합니다

