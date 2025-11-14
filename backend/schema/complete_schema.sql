-- ============================================
-- 재건축 데이터 분석 시스템 - 완전한 DB 스키마
-- ============================================

-- 단지 정보
CREATE TABLE IF NOT EXISTS buildings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  address TEXT,
  city TEXT,
  district TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 세대 정보 (기본 컬럼)
CREATE TABLE IF NOT EXISTS units (
  id BIGSERIAL PRIMARY KEY,
  building_id BIGINT REFERENCES buildings(id),
  dong TEXT,
  ho TEXT,
  area_m2 NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 세대 정보에 분석에 필요한 추가 컬럼들
-- (DataAnalysis 컴포넌트가 필요로 하는 모든 컬럼)
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS 소유자명 TEXT,
ADD COLUMN IF NOT EXISTS 생년월일 TEXT,
ADD COLUMN IF NOT EXISTS 소유자_주소 TEXT,
ADD COLUMN IF NOT EXISTS 아파트_소재지 TEXT,
ADD COLUMN IF NOT EXISTS 건물명 TEXT,
ADD COLUMN IF NOT EXISTS 거주형태 TEXT,
ADD COLUMN IF NOT EXISTS 등기목적_분류 TEXT,
ADD COLUMN IF NOT EXISTS 근저당금액 NUMERIC,
ADD COLUMN IF NOT EXISTS 보유기간 TEXT,
ADD COLUMN IF NOT EXISTS 압류가압류 TEXT,
ADD COLUMN IF NOT EXISTS 등기원인_년월일 TEXT,
ADD COLUMN IF NOT EXISTS 전용면적_제곱미터 NUMERIC,
ADD COLUMN IF NOT EXISTS 유효근저당총액 NUMERIC,
ADD COLUMN IF NOT EXISTS 압류가압류유무 TEXT,
ADD COLUMN IF NOT EXISTS 주민번호 TEXT,
ADD COLUMN IF NOT EXISTS 연령대 TEXT,
ADD COLUMN IF NOT EXISTS 공유자수 INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS 세대유형 TEXT;

-- 근저당/담보 정보
CREATE TABLE IF NOT EXISTS mortgages (
  id BIGSERIAL PRIMARY KEY,
  unit_id BIGINT REFERENCES units(id),
  bank_name TEXT,
  max_amount NUMERIC,
  registration_date DATE,
  cancelled BOOLEAN DEFAULT FALSE
);

-- PDF 원본 정보
CREATE TABLE IF NOT EXISTS raw_documents (
  id BIGSERIAL PRIMARY KEY,
  building_id BIGINT REFERENCES buildings(id),
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  content_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  parsed_at TIMESTAMPTZ,
  parse_status TEXT DEFAULT 'pending', -- pending/success/error
  parse_error_msg TEXT
);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_units_building_id ON units(building_id);
CREATE INDEX IF NOT EXISTS idx_units_dong_ho ON units(dong, ho);
CREATE INDEX IF NOT EXISTS idx_mortgages_unit_id ON mortgages(unit_id);
CREATE INDEX IF NOT EXISTS idx_raw_documents_building_id ON raw_documents(building_id);

