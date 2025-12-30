# 배포 가이드

## 📋 목차
1. [배포 아키텍처](#배포-아키텍처)
2. [사전 준비](#사전-준비)
3. [백엔드 배포 (AWS EC2)](#백엔드-배포-aws-ec2)
4. [프론트엔드 배포 (GitHub Pages)](#프론트엔드-배포-github-pages)
5. [환경변수 설정](#환경변수-설정)

---

## 배포 아키텍처

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  GitHub Pages   │─────▶│   AWS EC2        │─────▶│   Supabase      │
│  (Frontend)     │      │   (Backend)      │      │   (Database)    │
│  React App      │      │   Node.js API    │      │   PostgreSQL    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

**구성:**
- **프론트엔드**: GitHub Pages (무료)
- **백엔드**: AWS EC2 t3.micro (12개월 무료, 서울 리전)
- **데이터베이스**: Supabase PostgreSQL (무료 티어, 500MB)

---

## 사전 준비

### 1. 필요한 계정
- [x] GitHub 계정
- [x] AWS 계정
- [x] Supabase 계정

### 2. 로컬 환경 확인
```bash
# Node.js 버전 확인 (v14 이상 권장)
node --version

# npm 버전 확인
npm --version

# Git 확인
git --version
```

---

## 백엔드 배포 (AWS EC2)

### Step 1: EC2 인스턴스 생성

1. **AWS Console** → **EC2** → **인스턴스 시작**
2. 설정:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **인스턴스 타입**:
     - **t3.micro** (아시아/서울 리전 프리 티어, 권장)
     - 또는 t2.micro (미국/유럽 리전 프리 티어)
   - **키 페어**: 새로 생성 또는 기존 키 사용
   - **보안 그룹**:
     - SSH (22) - 내 IP만 허용
     - Custom TCP (5001) - 0.0.0.0/0 (또는 특정 IP)

### Step 2: EC2 접속 및 환경 설정

```bash
# SSH 접속
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Node.js 설치 (v18 LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 전역 설치
sudo npm install -g pm2

# Git 설치 확인
git --version
```

### Step 3: 프로젝트 배포

```bash
# 프로젝트 클론
cd ~
git clone https://github.com/dlawlgur16/zem.proj1realestate.git
cd zem.proj1realestate

# 필요한 브랜치로 전환
git checkout feature/database-integration

# Backend 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경변수 설정
nano .env
```

**`.env` 파일 내용:**
```env
# Supabase PostgreSQL Pooler URL
DATABASE_URL=postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

# 서버 포트
PORT=5001

# 환경
NODE_ENV=production

# Gemini API (선택사항)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 4: PM2로 서버 실행

```bash
# PM2로 서버 시작
pm2 start ecosystem.config.js

# 부팅 시 자동 시작 설정
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

# 서버 상태 확인
pm2 status
pm2 logs realestate-backend

# 서버 테스트
curl http://localhost:5001/api/health
```

### Step 5: 보안 그룹 확인

AWS Console에서 EC2 보안 그룹 확인:
- **인바운드 규칙**에 포트 5001이 허용되어 있는지 확인

---

## 프론트엔드 배포 (GitHub Pages)

### Step 1: package.json 설정

`package.json`에 homepage 추가 (이미 설정되어 있음):
```json
{
  "homepage": "https://dlawlgur16.github.io/zem.proj1realestate"
}
```

### Step 2: 환경변수 설정

프로덕션 환경변수 생성:
```bash
# .env.production 파일 생성
nano .env.production
```

**`.env.production` 내용:**
```env
# EC2 백엔드 URL
REACT_APP_API_URL=http://YOUR_EC2_PUBLIC_IP:5001/api

# Gemini API Key
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (프론트엔드에서 직접 접근할 경우)
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_BUCKET=registry-pdfs
```

### Step 3: 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# GitHub Pages에 배포
npm run deploy
```

배포 후 접속: `https://dlawlgur16.github.io/zem.proj1realestate`

---

## 환경변수 설정

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
PORT=5001
NODE_ENV=production
GEMINI_API_KEY=optional_key_here
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=http://YOUR_EC2_IP:5001/api
REACT_APP_GEMINI_API_KEY=your_key_here
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here
SUPABASE_BUCKET=registry-pdfs
```

---

## 유용한 PM2 명령어

```bash
# 서버 재시작
pm2 restart realestate-backend

# 서버 중지
pm2 stop realestate-backend

# 서버 삭제
pm2 delete realestate-backend

# 로그 보기
pm2 logs realestate-backend

# 실시간 모니터링
pm2 monit

# 저장된 프로세스 목록
pm2 list
```

---

## 문제 해결

### 1. EC2 서버 접속 안됨
- 보안 그룹에서 SSH 포트(22) 허용 확인
- 키 페어 권한 확인: `chmod 400 your-key.pem`

### 2. 백엔드 API 호출 실패
- EC2 보안 그룹에서 포트 5001 허용 확인
- PM2 프로세스 상태 확인: `pm2 status`
- 로그 확인: `pm2 logs`

### 3. 데이터베이스 연결 실패
- Supabase 프로젝트가 일시정지되지 않았는지 확인
- DATABASE_URL이 Pooler URL인지 확인
- Supabase 대시보드에서 연결 테스트

### 4. CORS 에러
- 백엔드 server.js의 CORS 설정 확인
- 프론트엔드 API URL이 정확한지 확인

---

## 비용 안내

### 무료 티어 기준
- **Supabase**: 500MB 데이터베이스 (영구 무료, 7일 미활동 시 일시정지)
- **AWS EC2**: t3.micro 12개월 무료 (월 750시간, 서울 리전)
- **GitHub Pages**: 무료

### 예상 비용 (12개월 후)
- **AWS EC2 t3.micro**: ~$8-10/월 (리전별 상이)
- **Supabase Pro** (선택사항): $25/월
- **GitHub Pages**: 무료

**참고**:
- 서울 리전(ap-northeast-2): t3.micro 프리 티어 ✅
- 미국/유럽 대부분 리전: t2.micro 또는 t3.micro 프리 티어 ✅

---

## 보안 권장사항

1. ✅ `.env` 파일은 절대 Git에 커밋하지 않기
2. ✅ EC2 SSH 접근은 특정 IP만 허용
3. ✅ Supabase Service Role Key는 서버에서만 사용
4. ✅ 정기적으로 의존성 업데이트: `npm audit fix`
5. ✅ PM2 로그 로테이션 설정

---

## 추가 리소스

- [AWS EC2 프리 티어 가이드](https://aws.amazon.com/free/)
- [Supabase 문서](https://supabase.com/docs)
- [PM2 공식 문서](https://pm2.keymetrics.io/)
- [GitHub Pages 배포 가이드](https://docs.github.com/en/pages)
