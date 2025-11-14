# 🚀 Vercel 배포 완전 가이드

## 📋 1단계: Supabase 연결 문자열 확인

### Supabase Dashboard에서 연결 문자열 가져오기

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **Database** 이동
4. **Connection string** 섹션에서:
   - **Connection pooling** 탭 선택 (권장)
   - **Session mode** 또는 **Transaction mode** 선택
   - **URI** 형식 선택
   - 연결 문자열 복사

**연결 문자열 형식 예시:**
```
postgresql://postgres.xxxxx:[YOUR_PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

또는 일반 연결:
```
postgresql://postgres.xxxxx:[YOUR_PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

---

## 📋 2단계: Vercel 백엔드 환경 변수 설정

### 백엔드 프로젝트 환경 변수 추가

1. [Vercel Dashboard - Backend](https://vercel.com/jis-projects-55d8fd7d/backend/settings/environment-variables) 접속
2. **"Add New"** 버튼 클릭
3. 다음 정보 입력:
   - **Name**: `DATABASE_URL`
   - **Value**: 위에서 복사한 Supabase 연결 문자열 (전체 붙여넣기)
   - **Environment**: 
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
     - (모두 체크!)
4. **"Save"** 클릭

**⚠️ 중요:**
- 연결 문자열에 비밀번호가 포함되어야 합니다
- `postgresql://` 또는 `postgres://`로 시작해야 합니다
- 공백이나 줄바꿈이 없어야 합니다

---

## 📋 3단계: 백엔드 재배포

### 방법 1: Vercel Dashboard에서 (자동)

환경 변수를 저장하면 자동으로 재배포됩니다. "Deployments" 탭에서 재배포 상태를 확인하세요.

### 방법 2: CLI에서 (수동)

```bash
cd backend
vercel --prod
```

### 배포 완료 확인

배포가 완료되면 새로운 URL이 생성됩니다:
```
https://backend-xxxxx-jis-projects-55d8fd7d.vercel.app
```

---

## 📋 4단계: 백엔드 Health Check 테스트

### 브라우저에서 확인

새로운 백엔드 URL로 접속:
```
https://backend-xxxxx-jis-projects-55d8fd7d.vercel.app/api/health
```

**정상 응답 예시:**
```json
{
  "status": "ok",
  "message": "재건축 데이터 분석 시스템 백엔드 서버",
  "database": "connected",
  "timestamp": "2025-11-14T..."
}
```

**에러 응답이면:**
- Vercel Dashboard에서 로그 확인
- 환경 변수가 제대로 설정되었는지 다시 확인

---

## 📋 5단계: Vercel 로그 확인 (문제 해결용)

### 로그 확인 방법

1. [Vercel Dashboard - Backend](https://vercel.com/jis-projects-55d8fd7d/backend) 접속
2. **"Deployments"** 탭 클릭
3. 최신 배포 클릭
4. **"Functions"** 탭 클릭
5. 로그 확인

### 확인할 메시지

**정상:**
- `🔍 환경 변수 확인:` → `DATABASE_URL_exists: true`
- `📡 DATABASE_URL 발견: postgresql://...`
- `🔧 PostgreSQL 연결 풀 생성 시도...`
- `✅ PostgreSQL 연결 풀 생성 완료`
- `✅ PostgreSQL 데이터베이스 연결 성공`

**문제:**
- `DATABASE_URL_exists: false` → 환경 변수가 설정되지 않음
- `❌ DATABASE_URL 환경 변수가 설정되지 않았습니다` → 환경 변수 추가 필요
- `❌ DATABASE_URL 형식 오류` → 연결 문자열 형식 확인

---

## 📋 6단계: 프론트엔드 환경 변수 설정

### 프론트엔드 프로젝트 환경 변수 추가

1. [Vercel Dashboard - Frontend](https://vercel.com/jis-projects-55d8fd7d/zem.proj1realestate/settings/environment-variables) 접속
2. 다음 환경 변수들을 추가:

#### REACT_APP_GEMINI_API_KEY
- **Name**: `REACT_APP_GEMINI_API_KEY`
- **Value**: `AIzaSyBnfd3pbvrTdC8qL7vdUuOxKpAu7D7nXMg`
- **Environment**: Production, Preview, Development 모두 선택

#### REACT_APP_API_URL
- **Name**: `REACT_APP_API_URL`
- **Value**: `https://backend-xxxxx-jis-projects-55d8fd7d.vercel.app/api`
  - ⚠️ 위의 `xxxxx`를 실제 백엔드 URL로 교체!
- **Environment**: Production, Preview, Development 모두 선택

3. 각각 **"Save"** 클릭

---

## 📋 7단계: 프론트엔드 재배포

### 방법 1: Vercel Dashboard에서 (자동)

환경 변수를 저장하면 자동으로 재배포됩니다.

### 방법 2: CLI에서 (수동)

```bash
# 루트 디렉토리에서
vercel --prod
```

---

## 📋 8단계: 최종 확인

### 프론트엔드 접속

프론트엔드 URL로 접속:
```
https://zemproj1realestate-xxxxx-jis-projects-55d8fd7d.vercel.app
```

### 확인 사항

1. 프로젝트 목록이 표시되는지
2. DB에 저장된 건물들이 보이는지
3. 프로젝트 클릭 시 데이터 분석이 작동하는지

---

## 🔧 문제 해결 체크리스트

### 백엔드가 DB에 연결되지 않는 경우

- [ ] Supabase 연결 문자열이 올바른지 확인
- [ ] Vercel Dashboard에서 `DATABASE_URL` 환경 변수가 있는지 확인
- [ ] 환경 변수의 Environment가 모두 선택되어 있는지 확인
- [ ] 연결 문자열에 비밀번호가 포함되어 있는지 확인
- [ ] 연결 문자열이 `postgresql://` 또는 `postgres://`로 시작하는지 확인
- [ ] 백엔드가 재배포되었는지 확인
- [ ] Vercel 로그에서 에러 메시지 확인

### 프론트엔드가 백엔드에 연결되지 않는 경우

- [ ] `REACT_APP_API_URL`이 올바른 백엔드 URL인지 확인
- [ ] 백엔드 URL이 `/api`로 끝나는지 확인
- [ ] 프론트엔드가 재배포되었는지 확인
- [ ] 브라우저 콘솔에서 네트워크 에러 확인

---

## 📞 추가 도움

문제가 계속되면:
1. Vercel Dashboard의 로그를 스크린샷으로 공유
2. Health Check 응답을 공유
3. 브라우저 콘솔 에러를 공유

