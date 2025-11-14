# 데이터베이스 스키마

## 📋 테이블 구조

### 1. buildings (단지 정보)
- `id`: 건물 고유 ID
- `name`: 건물명
- `address`: 주소
- `city`: 시/도
- `district`: 구/군
- `created_at`: 생성일시

### 2. units (세대 정보)
**기본 컬럼:**
- `id`: 세대 고유 ID
- `building_id`: 건물 ID (외래키)
- `dong`: 동
- `ho`: 호수
- `area_m2`: 면적 (제곱미터)
- `created_at`: 생성일시

**분석용 추가 컬럼:**
- `소유자명`: 소유자 이름
- `생년월일`: 생년월일 (YYMMDD 형식)
- `소유자_주소`: 소유자 거주지 주소
- `아파트_소재지`: 아파트 위치
- `건물명`: 건물명
- `거주형태`: 실거주/투자 구분
- `등기목적_분류`: 매매/상속/증여/경매 등
- `근저당금액`: 근저당 설정 금액
- `보유기간`: 보유 기간 (예: "4년 11개월")
- `압류가압류`: 압류/가압류 여부
- `등기원인_년월일`: 등기 원인 일자
- `전용면적_제곱미터`: 전용면적
- `유효근저당총액`: 유효 근저당 총액
- `압류가압류유무`: 압류/가압류 유무 (Y/N)
- `주민번호`: 주민등록번호
- `연령대`: 연령대 (10대, 20대 등)

### 3. mortgages (근저당/담보 정보)
- `id`: 근저당 고유 ID
- `unit_id`: 세대 ID (외래키)
- `bank_name`: 은행명
- `max_amount`: 최대 금액
- `registration_date`: 등기일
- `cancelled`: 취소 여부

### 4. raw_documents (PDF 원본 정보)
- `id`: 문서 고유 ID
- `building_id`: 건물 ID (외래키)
- `original_filename`: 원본 파일명
- `storage_path`: 저장 경로
- `file_size_bytes`: 파일 크기
- `content_type`: 파일 타입
- `uploaded_at`: 업로드 일시
- `parsed_at`: 파싱 완료 일시
- `parse_status`: 파싱 상태 (pending/success/error)
- `parse_error_msg`: 파싱 에러 메시지

## 🚀 스키마 적용 방법

### 방법 1: SQL 파일 직접 실행
```bash
# Supabase SQL Editor에서 실행
# 또는 psql로 실행
psql -h your-host -U your-user -d your-database -f complete_schema.sql
```

### 방법 2: Node.js 스크립트 실행
```bash
cd backend
node scripts/add-columns.js
```

## 📝 참고사항

- `IF NOT EXISTS` 구문을 사용하여 이미 존재하는 컬럼은 건너뜀
- 기존 데이터는 유지되며, 새 컬럼은 NULL로 시작
- 인덱스는 쿼리 성능 향상을 위해 추가됨

