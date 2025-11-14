# 🔐 Vercel 환경 변수 설정 가이드

## 📋 프론트엔드 환경 변수 설정

### 1단계: Vercel Dashboard 접속

1. [프론트엔드 프로젝트 Settings](https://vercel.com/jis-projects-55d8fd7d/zem.proj1realestate/settings/environment-variables) 접속
2. **Environment Variables** 섹션으로 이동

### 2단계: REACT_APP_API_URL 추가

1. **"Add New"** 또는 **"+"** 버튼 클릭
2. 다음 정보 입력:
   - **Key (이름)**: `REACT_APP_API_URL`
   - **Value (값)**: `https://backend-9njiwjrm5-jis-projects-55d8fd7d.vercel.app/api`
   - **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
     - (모두 선택)
3. **Save** 클릭

### 3단계: REACT_APP_GEMINI_API_KEY 추가

1. 다시 **"Add New"** 또는 **"+"** 버튼 클릭
2. 다음 정보 입력:
   - **Key (이름)**: `REACT_APP_GEMINI_API_KEY`
   - **Value (값)**: `AIzaSyC_YQfGwUuvEst0q5yWgnjgwj3YT7rkmew`
   - **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
     - (모두 선택)
3. **Save** 클릭

### 4단계: 재배포 확인

환경 변수를 저장하면 자동으로 재배포가 시작됩니다.

1. [Deployments 탭](https://vercel.com/jis-projects-55d8fd7d/zem.proj1realestate/deployments)에서 재배포 상태 확인
2. 재배포가 완료될 때까지 대기 (보통 1-3분)

### 5단계: 확인

재배포 완료 후 프론트엔드 URL로 접속:
```
https://zemproj1realestate-7s7gsf282-jis-projects-55d8fd7d.vercel.app
```

브라우저 콘솔(F12)에서 확인:
- `📡 API URL: https://backend-9njiwjrm5-jis-projects-55d8fd7d.vercel.app/api`
- DB 프로젝트가 목록에 표시되는지 확인

---

## 📝 참고사항

- 환경 변수는 **대소문자를 구분**합니다
- `REACT_APP_` 접두사가 있어야 React 앱에서 사용 가능합니다
- 환경 변수 변경 후 **자동으로 재배포**됩니다
- 재배포가 완료될 때까지 몇 분 기다려야 합니다

---

## 🔧 문제 해결

### 환경 변수가 적용되지 않는 경우

1. **재배포 확인**: Deployments 탭에서 최신 배포가 완료되었는지 확인
2. **환경 변수 확인**: Settings → Environment Variables에서 값이 올바른지 확인
3. **브라우저 캐시**: 하드 리프레시 (Ctrl+Shift+R 또는 Ctrl+F5)
4. **수동 재배포**: 
   ```bash
   cd C:\Users\zemstone\Desktop\zem.proj1realestate
   vercel --prod
   ```

