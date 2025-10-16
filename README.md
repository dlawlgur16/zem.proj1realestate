# 대교아파트 조합원 분석 시스템

이 프로젝트는 대교아파트 조합원 데이터를 분석하고 시각화하는 React 애플리케이션입니다.

## 주요 기능

### 📊 데이터 분석
- 나이대 분포 분석
- 거주/투자 비율 분석
- 성별 분포 분석
- 면적별 분포 분석
- 대출 현황 분석
- 부동산 보유 기간 분석
- 등기이전원인별 분석

### 🔄 자동 CSV 감지
- `public/data` 폴더의 CSV 파일 자동 감지
- 파일 변경 시 자동 새로고침 (5초 간격)
- 드롭다운으로 파일 선택 가능
- 실시간 파일 목록 업데이트

### 📁 파일 관리
- CSV 파일 업로드 기능
- 동적 건물명 탭 생성
- 파일별 데이터 독립 분석

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집하여 API 키 설정
# REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
```

**API 키 발급 방법:**
1. [Google AI Studio](https://aistudio.google.com/app/apikey) 방문
2. Google 계정으로 로그인
3. "Create API Key" 클릭
4. 생성된 API 키를 `.env` 파일에 설정

## 사용 방법

### 1. 기본 실행
```bash
npm start
```

### 2. 파일 목록 업데이트 후 실행
```bash
npm run dev
```

### 3. 파일 목록만 업데이트
```bash
npm run update-files
```

## CSV 파일 형식

CSV 파일은 다음 컬럼을 포함해야 합니다:
- `건물명`: 건물 이름
- `주민번호`: 주민등록번호 (나이, 성별 계산용)
- `소재지`: 부동산 소재지
- `현주소`: 현재 거주지
- `전용면적_제곱미터`: 전용면적
- `유효근저당총액`: 대출금액
- `소유권취득일`: 소유권 취득일
- `이전사유`: 등기이전 사유

## 파일 구조

```
src/
├── components/
│   ├── ReconstructionAnalysis.js  # 메인 분석 컴포넌트
│   └── FileUpload.js             # 파일 업로드 컴포넌트
├── data.js                       # 기본 데이터
└── App.js                        # 앱 진입점

public/
└── data/
    ├── data.csv                  # 기본 데이터 파일
    └── file-list.json            # 파일 목록 (자동 생성)

scripts/
└── update-file-list.js          # 파일 목록 업데이트 스크립트
```

## 기술 스택

- React 18
- Recharts (차트 라이브러리)
- Papa Parse (CSV 파싱)
- Tailwind CSS (스타일링)
