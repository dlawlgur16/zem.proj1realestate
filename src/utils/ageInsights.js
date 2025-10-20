/**
 * 연령대별 인사이트 계산 함수
 * CSV 데이터를 받아서 연령대별로 다양한 통계를 계산합니다.
 */

export function calculateAgeInsights(rows) {
  console.log('🔍 calculateAgeInsights 시작 - 입력 데이터:', rows?.length || 0, '건');
  console.log('🔍 첫 번째 행 샘플:', rows?.[0]);
  
  // 연령대 유도 함수 (연령대 컬럼이 없을 때 주민번호/생년월일에서 계산)
  const deriveAgeGroup = (row) => {
    // 1) 이미 연령대가 있으면 그대로 사용
    if (row && row.연령대) return row.연령대;

    // 2) 출생년도 파싱 유틸
    const parseBirthYear = (value) => {
      if (!value) return null;
      const str = String(value).replace(/[^0-9]/g, '');
      // yyyy, yyyyMMdd 형태
      if (str.length === 4) return Number(str);
      if (str.length === 8) return Number(str.slice(0, 4));

      // 주민번호 형태: YYMMDD[- ]?X...
      // 성별코드: 1,2 -> 1900대생 / 3,4 -> 2000대생 (간단 규칙)
      if (str.length >= 7) {
        const yy = Number(str.slice(0, 2));
        const genderCode = Number(str[6]);
        if (!Number.isFinite(yy) || !Number.isFinite(genderCode)) return null;
        const century = (genderCode === 1 || genderCode === 2) ? 1900 : 2000;
        return century + yy;
      }
      return null;
    };

    const birthYearSources = [
      row.생년, row.출생년도, row.출생연도, row.생년월일, row.생년월일_YYYYMMDD, row.주민번호, row.주민등록번호
    ];
    let birthYear = null;
    for (const v of birthYearSources) {
      birthYear = parseBirthYear(v);
      if (birthYear) break;
    }

    if (!birthYear) return null;

    const now = new Date();
    const age = now.getFullYear() - birthYear;
    if (!Number.isFinite(age) || age < 0 || age > 120) return null;
    const decade = Math.floor(age / 10) * 10; // 23 -> 20, 37 -> 30
    if (decade < 20) return '10대';
    if (decade >= 90) return '90대 이상';
    return `${decade}대`;
  };

  // 연령대가 비어있는 경우를 대비해 사전 계산한 연령대 컬럼을 추가한 배열로 변환
  const normalizedRows = Array.isArray(rows)
    ? rows.map(r => ({ ...r, 연령대: r?.연령대 || deriveAgeGroup(r) }))
    : [];

  // 실제 연령대 값들 확인
  const ageValues = [...new Set(normalizedRows.map(r => r.연령대).filter(Boolean))];
  console.log('🔍 실제 연령대 값들:', ageValues);
  
  const AGE_KEYS = ["20대", "30대", "40대", "50대", "60대", "70대", "80대", "90대 이상"];
  const insights = {};

  const toFixed1 = (n) => (typeof n === "number" ? n.toFixed(1) : (Number(n) || 0).toFixed(1));

  // 실거주여부 표준화: 다양한 표기를 boolean으로 변환
  const isResidence = (value) => {
    const v = String(value ?? '').trim().toLowerCase();
    if (!v) return false;
    // 부분 일치 우선 처리 ("실거주 추정", "거주자", 등)
    if (v.includes('실거주')) return true;
    if (v.includes('거주')) return true; // "거주", "거주자" 등
    // 정확 일치 토큰 처리
    return [
      'y','yes','true','1','t','o','ㅇ','예','네','투자아님'
    ].some(tok => v === tok);
  };

  // 실거주여부 값들 확인을 위한 디버깅
  const residenceValues = [...new Set(normalizedRows.map(r => r.실거주여부).filter(Boolean))];
  console.log('🔍 실제 실거주여부 값들:', residenceValues);

  AGE_KEYS.forEach((age) => {
    const group = normalizedRows.filter((r) => r.연령대 === age);
    const total = group.length;
    console.log(`🔍 ${age} 그룹: ${total}명`);
    if (!total) return;

    // 대출 현황
    const loaned = group.filter((r) => Number(r.유효근저당총액) > 0);
    const loanRate = Number(((loaned.length / total) * 100).toFixed(1));
    const avgLoan = loaned.length
      ? Number(
          (loaned.reduce((sum, r) => sum + Number(r.유효근저당총액 || 0), 0) / loaned.length / 1e8).toFixed(1)
        )
      : 0;

    // 실거주 비율 (다양한 표기 허용)
    const residence = group.filter((r) => isResidence(r.실거주여부));
    const residenceRate = Number(((residence.length / total) * 100).toFixed(1));
    
    console.log(`🔍 ${age} 실거주 현황:`, {
      total,
      residence: residence.length,
      residenceRate,
      sampleResidence: group.slice(0, 3).map(r => r.실거주여부)
    });

    // 보유기간 요약
    const holdingCounts = {};
    group.forEach((r) => {
      const y = Math.floor(Number(r.보유기간_년) || 0);
      const key =
        y < 3 ? "1~3년" :
        y < 5 ? "3~5년" :
        y < 10 ? "5~10년" :
        y < 15 ? "10~15년" : "15년 이상";
      holdingCounts[key] = (holdingCounts[key] || 0) + 1;
    });
    const holdingTop = Object.entries(holdingCounts).sort((a,b) => b[1]-a[1])[0];
    const holdingSummary = holdingTop ? `${holdingTop[0]} ${toFixed1((holdingTop[1]/total)*100)}%` : "데이터 없음";

    // 소유권 변동
    const transfers = {};
    group.forEach((r) => {
      const reason = String(r.이전사유 || "").trim();
      if (!reason) return;
      transfers[reason] = (transfers[reason] || 0) + 1;
    });
    const transferPattern = Object.keys(transfers).length
      ? Object.entries(transfers).map(([k,v]) => `${k} ${toFixed1((v/total)*100)}%`).join(", ")
      : "데이터 없음";

    // 압류/가압류
    const seizure = group.filter((r) => String(r.압류가압류유무 || "").trim().toUpperCase() === "Y").length;
    const seizureRate = Number(((seizure / total) * 100).toFixed(1));

    // 면적 집중도 TOP3
    const areaCounts = {};
    group.forEach((r) => {
      const a = r.전용면적_제곱미터;
      if (!a) return;
      areaCounts[a] = (areaCounts[a] || 0) + 1;
    });
    const topAreas = Object.entries(areaCounts)
      .sort((a,b) => b[1]-a[1])
      .slice(0,3)
      .map(([area, cnt]) => ({ area, rate: toFixed1((cnt/total)*100) }));

    // 해석 포인트
    let comment = "";
    if (loanRate >= 70 && residenceRate < 50) comment = "대출 의존도 높고 투자 중심. 금융 리스크 주의.";
    else if (residenceRate >= 70 && holdingSummary.includes("10년 이상")) comment = "장기보유 실거주 중심. 조합 안정성 높음.";
    else if (seizureRate >= 5) comment = "압류/가압류 비율 높음. 법적 리스크 관리 필요.";
    else comment = "균형 잡힌 구조. 맞춤형 커뮤니케이션 필요.";

    insights[age] = { loanRate, avgLoan, residenceRate, holdingSummary, transferPattern, seizureRate, topAreas, comment };
    
    // 디버깅: 각 연령대별 계산 결과 확인
    console.log(`🔍 ${age} 최종 계산 결과:`, {
      loanRate: typeof loanRate === 'number' ? loanRate : 'NaN',
      avgLoan: typeof avgLoan === 'number' ? avgLoan : 'NaN',
      residenceRate: typeof residenceRate === 'number' ? residenceRate : 'NaN'
    });
  });

  console.log('🔍 ageInsights 최종 반환값:', insights);
  return insights;
}
