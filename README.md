# 재건축 데이터 분석 시스템

Excel/CSV 데이터를 자동으로 전처리하고 AI 기반 분석 보고서를 생성하는 재건축 아파트 데이터 분석 시스템입니다.

## 🌟 주요 기능

### 📊 자동 데이터 전처리
- **Excel 파일 자동 감지**: `input-data` 폴더에 Excel 파일을 넣으면 자동으로 전처리
- **CSV 변환**: Excel을 CSV로 자동 변환하여 분석 가능한 형태로 가공
- **데이터 정규화**: 생년월일, 주소, 금액 등 다양한 형태의 데이터를 표준화
- **중복 처리 방지**: 이미 전처리된 파일은 자동으로 건너뛰기

### 📈 실시간 데이터 분석
- **연령대별 분석**: 20대~80대+ 연령대별 상세 통계
- **투자자 거주지역**: 전국 및 해외 거주지 분포 (미국, 중국 등 별도 분류)
- **대출 현황**: 근저당 설정 비율, 평균 대출금액 분석
- **보유기간**: 장기/단기 보유 패턴 분석
- **압류/가압류 현황**: 법적 리스크 분석
- **면적별 분포**: 평형별 투자 성향 분석

### 🤖 AI 보고서 생성
- **Google Gemini AI**: 고도화된 AI 분석 보고서 자동 생성
- **연령대별 인사이트**: 각 연령대의 특성과 조합 참여 가능성 분석
- **시공사 관점**: 실무진이 활용할 수 있는 실용적 분석
- **다양한 형식**: Markdown, HTML 형식으로 다운로드 가능

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Service    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Gemini API)  │
│                 │    │                 │    │                 │
│ • 데이터 시각화   │    │ • 자동 전처리    │    │ • AI 보고서 생성 │
│ • 차트 렌더링    │    │ • 파일 감시     │    │ • 인사이트 분석  │
│ • 보고서 미리보기 │    │ • API 서버     │    │ • 자연어 생성    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/dlawlgur16/zem.proj1realestate.git
cd zem.proj1realestate
```

### 2. 프론트엔드 설정
```bash
# 의존성 설치
npm install

# 환경 변수 설정 (선택사항)
# .env 파일에 REACT_APP_GEMINI_API_KEY 설정

# 개발 서버 실행
npm start
```

### 3. 백엔드 설정
```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env
# .env 파일에서 GEMINI_API_KEY 설정

# 개발 서버 실행
npm start
```

### 4. 데이터 분석 시작
1. `backend/input-data` 폴더에 Excel 파일 업로드
2. 자동으로 전처리되어 `backend/processed-data`에 저장
3. 브라우저에서 `http://localhost:3000` 접속
4. 전처리된 프로젝트 선택하여 분석 시작

## 📁 프로젝트 구조

```
zem.proj1realestate/
├── src/                          # 프론트엔드 소스코드
│   ├── components/
│   │   ├── DataAnalysis/         # 데이터 분석 및 시각화
│   │   │   ├── Charts/           # 차트 컴포넌트들
│   │   │   └── DataAnalysis.js   # 메인 분석 컴포넌트
│   │   ├── ReportGenerator.js    # AI 보고서 생성
│   │   ├── ReportPreview.js      # 보고서 미리보기
│   │   └── MainApp.js           # 메인 앱 컴포넌트
│   ├── utils/
│   │   ├── geminiReportGenerator.js  # AI 보고서 생성 로직
│   │   ├── ageInsights.js           # 연령대별 인사이트 계산
│   │   └── dataLoader.js            # 데이터 로딩 유틸리티
│   └── pages/
│       └── ProjectIndex.js       # 프로젝트 목록 페이지
├── backend/                      # 백엔드 소스코드
│   ├── input-data/              # 원본 Excel 파일 저장소
│   ├── processed-data/          # 전처리된 CSV 파일 저장소
│   ├── services/
│   │   └── autoPreprocessor.js  # 자동 전처리 서비스
│   ├── routes/
│   │   └── processedData.js     # 전처리된 데이터 API
│   └── server.js               # Express 서버
└── README.md
```

## 🔧 환경 변수 설정

### 프론트엔드 (.env)
```env
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
```

### 백엔드 (.env)
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=development
```

## 📊 지원하는 데이터 형식

### Excel 파일 컬럼 구조
- **소유자명**: 소유자 이름
- **생년월일**: YYMMDD 형식 (예: 580101)
- **동호수**: 아파트 동호수
- **소유자_주소**: 소유자 거주지 주소
- **아파트_소재지**: 아파트 위치
- **건축물_연면적**: 평수 (㎡)
- **거주형태**: 거주/투자 구분
- **등기목적_분류**: 매매/상속 등 거래 유형
- **근저당금액**: 대출 금액
- **보유기간**: 보유 기간
- **압류가압류**: 압류/가압류 여부

## 🎯 분석 항목

### 1. 대출 현황 분석
- 대출 비율 및 평균 대출금액
- 연령대별 대출 패턴
- 금융 리스크 평가

### 2. 실거주 비율 분석
- 거주 vs 투자 성향 분석
- 조합 안정성에 미치는 영향
- 연령대별 거주 패턴

### 3. 보유기간 요약
- 장기/단기 보유 특성
- 재개발 참여 의향 분석
- 연령대별 보유 패턴

### 4. 압류/가압류 현황
- 법적 리스크 분석
- 조합 설립 시 주의사항
- 연령대별 리스크 분포

### 5. 면적 집중도
- 평형별 투자 성향
- 선호도 분석
- 연령대별 평형 선호도

## 🤖 AI 보고서 특징

### 연령대별 상세 분석
- **20대**: 신규 투자자 특성, 금융 리스크
- **30-40대**: 가족형 투자, 중장기 전략
- **50-60대**: 안정형 투자, 상속 고려
- **70대+**: 보수적 투자, 건강 고려사항

### 시공사 관점 인사이트
- 조합 설립 가능성 평가
- 연령대별 커뮤니케이션 전략
- 리스크 요인 및 대응 방안
- 시장 동향 및 트렌드 분석

## 🛠️ 기술 스택

### 프론트엔드
- **React 18**: 사용자 인터페이스
- **Recharts**: 데이터 시각화
- **Tailwind CSS**: 스타일링
- **Papa Parse**: CSV 파싱

### 백엔드
- **Node.js**: 서버 런타임
- **Express.js**: 웹 프레임워크
- **xlsx**: Excel 파일 처리
- **chokidar**: 파일 감시

### AI 서비스
- **Google Gemini API**: AI 보고서 생성
- **자연어 처리**: 한국어 최적화

## 🚀 배포

### GitHub Actions 자동 배포
- 코드 푸시 시 자동 빌드 및 배포
- ESLint 검사 통과 후 배포 진행
- 정적 사이트로 배포

### 수동 배포
```bash
# 프론트엔드 빌드
npm run build

# 백엔드 프로덕션 실행
cd backend
npm start
```

## 📈 성능 최적화

### 프론트엔드
- React.memo를 활용한 컴포넌트 최적화
- 차트 렌더링 성능 개선
- 불필요한 리렌더링 방지

### 백엔드
- 파일 감시 최적화
- 메모리 사용량 최적화
- API 응답 시간 단축

## 🔍 문제 해결

### 자주 발생하는 문제
1. **Excel 파일이 전처리되지 않는 경우**
   - 파일이 `input-data` 폴더에 있는지 확인
   - 백엔드 서버가 실행 중인지 확인

2. **AI 보고서가 생성되지 않는 경우**
   - Gemini API 키가 올바르게 설정되었는지 확인
   - 네트워크 연결 상태 확인

3. **차트가 표시되지 않는 경우**
   - 데이터 형식이 올바른지 확인
   - 브라우저 콘솔에서 오류 메시지 확인

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해 주세요.

---

**재건축 데이터 분석 시스템** - AI 기반 스마트 분석으로 더 나은 재건축 프로젝트를 만들어가세요! 🏗️✨