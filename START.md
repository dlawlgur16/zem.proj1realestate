# 🚀 서버 시작 가이드

## 📋 사전 준비사항

1. **환경 변수 설정**
   - 루트 디렉토리에 `.env` 파일 생성 (프론트엔드용)
   - `backend/.env` 파일 생성 또는 `estate-registry-et1/.env` 파일 확인 (백엔드용)
   
2. **필수 환경 변수**
   - 프론트엔드: `REACT_APP_GEMINI_API_KEY=your_api_key`
   - 백엔드: `DATABASE_URL=postgresql://...` (또는 `estate-registry-et1/.env`에 설정)

---

## 🔧 백엔드 서버 시작

### 방법 1: 기본 시작 (권장)
```bash
cd backend
npm install  # 처음 한 번만 실행
npm start
```

### 방법 2: 개발 모드 (자동 재시작)
```bash
cd backend
npm install  # 처음 한 번만 실행
npm run dev
```

**서버 정보:**
- 포트: `5000` (기본값)
- API 엔드포인트: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/api/health`

---

## 🎨 프론트엔드 서버 시작

### 방법 1: 기본 시작
```bash
npm install  # 처음 한 번만 실행
npm start
```

### 방법 2: 개발 모드 (파일 목록 자동 업데이트)
```bash
npm install  # 처음 한 번만 실행
npm run dev
```

**서버 정보:**
- 포트: `3000` (기본값)
- URL: `http://localhost:3000`

---

## 🔄 동시 실행 (두 터미널 사용)

### 터미널 1: 백엔드
```bash
cd backend
npm start
```

### 터미널 2: 프론트엔드
```bash
npm start
```

---

## ✅ 서버 실행 확인

### 백엔드 확인
브라우저에서 접속:
```
http://localhost:5000/api/health
```

정상 응답 예시:
```json
{
  "status": "ok",
  "message": "재건축 데이터 분석 시스템 백엔드 서버",
  "database": "connected",
  "timestamp": "2025-01-XX..."
}
```

### 프론트엔드 확인
브라우저에서 접속:
```
http://localhost:3000
```

---

## 📊 새 CSV 파일 추가하기

새로운 CSV 파일을 받았을 때 DB에 반영하는 방법:

### 방법 1: 프론트엔드에서 업로드 (권장) ⭐

1. **프론트엔드 페이지 접속**
   - `http://localhost:3000` 접속
   - 프로젝트 선택 페이지에서 "새 CSV 파일 업로드" 섹션 확인

2. **CSV 파일 선택**
   - "CSV 파일 선택" 버튼 클릭
   - 업로드할 CSV 파일 선택

3. **자동 처리**
   - 파일이 자동으로 업로드되고 DB에 저장됩니다
   - 업로드 완료 후 프로젝트 목록이 자동으로 새로고침됩니다
   - 새 건물이 프로젝트 목록에 나타납니다

**장점:**
- 로컬 파일 복사 불필요
- 마이그레이션 스크립트 실행 불필요
- 즉시 사용 가능

---

### 방법 2: 로컬 파일 복사 + 마이그레이션 (기존 방식)

1. **CSV 파일 복사**
   ```
   public/processed-data/ 폴더에 CSV 파일을 복사하세요.
   ```

2. **마이그레이션 실행**
   ```bash
   cd backend
   node scripts/migrate-csv-to-db.js
   ```

3. **프론트엔드에서 확인**
   - 프론트엔드 페이지를 새로고침하세요
   - 프로젝트 선택 드롭다운에서 새 건물이 나타납니다

**참고:**
- CSV 파일 형식은 기존과 동일해야 합니다
- 건물명은 파일명에서 추출됩니다 (확장자 제외)
- 같은 건물명의 파일이 있으면 기존 데이터를 덮어씁니다
- 파일 크기 제한: 10MB

---

## 🛠️ 문제 해결

### 백엔드 연결 실패 시
1. `DATABASE_URL` 환경 변수 확인
2. `estate-registry-et1/.env` 파일 확인
3. PostgreSQL 데이터베이스 연결 상태 확인

### 프론트엔드 API 연결 실패 시
1. 백엔드 서버가 실행 중인지 확인
2. `REACT_APP_API_URL` 환경 변수 확인 (기본값: `http://localhost:5000/api`)
3. CORS 설정 확인

---

## 📝 참고사항

- 백엔드는 포트 5000, 프론트엔드는 포트 3000을 사용합니다
- 백엔드가 먼저 실행되어야 프론트엔드에서 API 호출이 가능합니다
- 개발 중에는 `npm run dev`를 사용하면 파일 변경 시 자동으로 재시작됩니다

