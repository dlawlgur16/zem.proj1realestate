# 🔧 Vercel 배포 DB 연결 문제 해결 가이드

## 📋 현재 상황

배포 후 DB 연결에 문제가 발생하는 경우, 다음을 확인하세요.

---

## ✅ 1단계: Vercel Dashboard에서 로그 확인

### 로그 확인 방법

1. [Vercel Dashboard - Backend](https://vercel.com/jis-projects-55d8fd7d/backend) 접속
2. **Deployments** 탭 클릭
3. 최신 배포 클릭
4. **Functions** 탭 클릭
5. **server.js** 클릭
6. **Logs** 확인

### 확인할 메시지

**정상:**
```
✅ Vercel 환경에서 process.env.DATABASE_URL 로드됨
📡 DATABASE_URL 발견: postgresql://postgres:****@...
🔧 PostgreSQL 연결 풀 생성 시도...
✅ PostgreSQL 연결 풀 생성 완료
✅ PostgreSQL 데이터베이스 연결 성공
```

**문제:**
```
❌ Vercel 환경인데 DATABASE_URL 환경 변수가 없습니다!
❌ DATABASE_URL을 찾을 수 없습니다!
❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.
```

---

## 🔐 2단계: 환경 변수 설정 확인

### 환경 변수 설정 방법

1. [Vercel Dashboard - Backend Settings](https://vercel.com/jis-projects-55d8fd7d/backend/settings/environment-variables) 접속
2. **Environment Variables** 섹션 확인

### DATABASE_URL 설정

- **Name**: `DATABASE_URL`
- **Value**: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require`
  - `[PASSWORD]`: Supabase 비밀번호
  - `[HOST]`: Supabase 호스트 주소 (예: `aws-1-ap-southeast-1.pooler.supabase.com`)
- **Environment**: 
  - ✅ Production
  - ✅ Preview
  - ✅ Development
  - (모두 선택)
- **Save** 클릭

### 환경 변수 형식 예시

```
postgresql://postgres.uifztzjwxhvwhbonhkeq:598612I...@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**중요:**
- 비밀번호에 특수문자가 있으면 URL 인코딩 필요
- `@`, `:`, `/` 등의 특수문자는 `%40`, `%3A`, `%2F`로 변환

---

## 🔄 3단계: 재배포

환경 변수를 추가/수정한 후:

### 자동 재배포
환경 변수 저장 시 자동으로 재배포됩니다.

### 수동 재배포
```bash
cd backend
vercel --prod
```

---

## 🧪 4단계: Health Check 테스트

### 브라우저에서 테스트

배포된 백엔드 URL로 접속:
```
https://backend-9njiwjrm5-jis-projects-55d8fd7d.vercel.app/api/health
```

**정상 응답:**
```json
{
  "status": "ok",
  "message": "재건축 데이터 분석 시스템 백엔드 서버",
  "database": "connected",
  "environment": "vercel",
  "timestamp": "2025-11-14T..."
}
```

**에러 응답:**
```json
{
  "status": "error",
  "message": "데이터베이스 연결 실패",
  "error": "...",
  "environment": "vercel"
}
```

---

## 🔍 5단계: 문제 해결 체크리스트

### DATABASE_URL이 로드되지 않는 경우

- [ ] Vercel Dashboard에서 `DATABASE_URL` 환경 변수가 있는지 확인
- [ ] 환경 변수의 Environment가 모두 선택되어 있는지 확인
- [ ] 연결 문자열 형식이 올바른지 확인 (`postgresql://`로 시작)
- [ ] 비밀번호에 특수문자가 있으면 URL 인코딩 확인
- [ ] 환경 변수 저장 후 재배포 확인

### DATABASE_URL은 로드되지만 연결 실패하는 경우

- [ ] Supabase 연결 문자열이 올바른지 확인
- [ ] Supabase Dashboard에서 외부 연결이 허용되어 있는지 확인
- [ ] 비밀번호가 올바른지 확인
- [ ] 호스트 주소가 올바른지 확인
- [ ] SSL 모드가 `require`로 설정되어 있는지 확인

### 기타 문제

- [ ] Vercel 로그에서 구체적인 에러 메시지 확인
- [ ] Supabase Dashboard에서 연결 로그 확인
- [ ] 네트워크 방화벽 설정 확인

---

## 📞 추가 도움

문제가 계속되면:
1. Vercel Dashboard의 로그를 스크린샷으로 공유
2. Health Check 응답을 공유
3. 환경 변수 설정 화면 스크린샷 공유 (비밀번호는 가림)

