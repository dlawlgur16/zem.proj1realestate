/**
 * 연령대별 인사이트 계산 함수 (v3 - 완전 정규화 포함)
 * 주민번호, 생년월일, 출생년도 등 다양한 형태 자동 인식
 * 문자열 금액("1억", "500000000"), 기간("4년 11개월"), 실거주("거주", "Y")도 정규화
 */

export function calculateAgeInsights(rows) {
  // console.log('🔍 calculateAgeInsights 시작 - 입력 데이터:', rows?.length || 0, '건');
  // console.log('🔍 첫 번째 행 샘플:', rows?.[0]);

  // -------------------------------------------------------
  // 1️⃣ 출생년도 파싱 (주민번호 및 생년월일)
  // -------------------------------------------------------
  const parseBirthYear = (value) => {
    if (!value) return null;
    const match = String(value).match(/(\d{6})/); // 앞 6자리만 추출
    if (!match) return null;
    const digits = match[1]; // 예: 110111
    const yy = Number(digits.slice(0, 2));
    if (!Number.isFinite(yy)) return null;
    
    // 현재 연도 기준으로 2000년대/1900년대 판단
    const currentYear = new Date().getFullYear();
    const currentYY = currentYear % 100;
    
    // 00~현재년도까지는 2000년대, 그 외는 1900년대
    const birthYearGuess = yy <= currentYY ? 2000 + yy : 1900 + yy;
    return birthYearGuess;
  };

  // -------------------------------------------------------
  // 2️⃣ 연령대 계산 함수
  // -------------------------------------------------------
  const deriveAgeGroup = (row) => {
    if (row && row.연령대) return row.연령대;

    const birthYearSources = [
      row.생년월일, row.생년, row.출생년도, row.출생연도,
      row.생년월일_YYYYMMDD, row.주민번호, row.주민등록번호
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

    const decade = Math.floor(age / 10) * 10;
    if (decade < 20) return '10대';
    if (decade >= 90) return '90대 이상';
    
    return `${decade}대`;
  };

  // -------------------------------------------------------
  // 3️⃣ 데이터 전처리
  // -------------------------------------------------------
  const normalizedRows = Array.isArray(rows)
    ? rows.map(r => ({ ...r, 연령대: r?.연령대 || deriveAgeGroup(r) }))
    : [];

  const ageValues = [...new Set(normalizedRows.map(r => r.연령대).filter(Boolean))];
  // console.log('🔍 실제 연령대 값들:', ageValues);
  // console.log('🔍 연령대 정렬 전:', ageValues);
  
  // 연령대를 올바른 순서로 정렬
  const ageOrder = ['10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대 이상'];
  const sortedAgeValues = ageValues.sort((a, b) => {
    const indexA = ageOrder.indexOf(a);
    const indexB = ageOrder.indexOf(b);
    return indexA - indexB;
  });
  // console.log('🔍 연령대 정렬 후:', sortedAgeValues);

  // -------------------------------------------------------
  // 4️⃣ 유틸리티 함수들 (정규화)
  // -------------------------------------------------------

  // 💰 금액 정규화: "1억", "5,000만원", "500000000" → 숫자(원 단위)
  // 💰 문자열 금액을 숫자로 변환
  const parseAmount = (value) => {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    const str = String(value).replace(/[^0-9.-]/g, ''); // 숫자와 마이너스만 남김
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  // 🏠 실거주 여부 판별
  const isResidence = (value) => {
    const v = String(value ?? '').trim().toLowerCase();
    if (!v) return false;
    return ['거주', '실거주', 'y', 'yes', '1', 'ㅇ', '주거', '거주자'].some(k => v.includes(k));
  };

  // ⏳ 보유기간 정규화: "4년 11개월" → 4.9
  const parseYears = (val) => {
    if (!val) return 0;
    const str = String(val);
    const yearMatch = str.match(/(\d+)\s*년/);
    const monthMatch = str.match(/(\d+)\s*개월/);
    const years = yearMatch ? Number(yearMatch[1]) : 0;
    const months = monthMatch ? Number(monthMatch[1]) / 12 : 0;
    return years + months;
  };

  // ⚖️ 압류/가압류 판별
  const isSeized = (val) => {
    const s = String(val ?? '').trim().toUpperCase();
    return ['Y', '있음', '압류', '가압류', 'O', 'TRUE'].some(tok => s.includes(tok));
  };

  // -------------------------------------------------------
  // 5️⃣ 연령대별 통계 계산
  // -------------------------------------------------------
  const AGE_KEYS = sortedAgeValues; // 정렬된 연령대 순서 사용
  const insights = {};
  const toFixed1 = (n) => (typeof n === 'number' ? n.toFixed(1) : (Number(n) || 0).toFixed(1));

  AGE_KEYS.forEach((age) => {
    const group = normalizedRows.filter((r) => r.연령대 === age);
    const total = group.length;
    if (!total) return;

    // console.log(`\n🔹 [${age}] 그룹 전체 데이터 샘플:`);
    // console.log(group.slice(0, 5));

    // console.groupCollapsed(`🏠 [${age}] residence debug (총 ${total}명)`);

    // ✅ 대출 현황
    const loaned = group.filter(r => {
      const raw = r.유효근저당총액 || r.근저당금액 || 0;
      const amount = parseAmount(raw);
      return amount > 0;
    });
    
    const loanRate = Number(((loaned.length / total) * 100).toFixed(1));
    const avgLoan = loaned.length
    ? Number(
      (
        loaned.reduce(
          (sum, r) => sum + parseAmount(r.유효근저당총액 || r.근저당금액 || 0),
          0
        ) / loaned.length / 1e8
      ).toFixed(1)
    )
    : 0;


    // ✅ 실거주 비율
    const residence = group.filter((r) =>
      isResidence(r.실거주여부 || r.거주형태 || r["거주/투자구분"])
    );  
    const residenceRate = Number(((residence.length / total) * 100).toFixed(1));

    // ✅ 보유기간
    const holdingCounts = {};
    group.forEach((r) => {
      const y = parseYears(r.보유기간 || r.보유기간_년);
      let key;
      if (y < 3) key = '1~3년';
      else if (y < 5) key = '3~5년';
      else if (y < 10) key = '5~10년';
      else if (y < 15) key = '10~15년';
      else key = '15년 이상';
      holdingCounts[key] = ((holdingCounts[key] || 0) + 1);
    });

    const holdingTop = Object.entries(holdingCounts).sort((a, b) => b[1] - a[1])[0];
    const holdingSummary = holdingTop
      ? `${holdingTop[0]} ${(holdingTop[1] / total * 100).toFixed(1)}%`
      : '데이터 없음';

    // ✅ 압류/가압류
    const seizure = group.filter((r) => isSeized(r.압류가압류유무 || r.압류가압류)).length;
    const seizureRate = Number(((seizure / total) * 100).toFixed(1));

    // ✅ 면적 집중도 TOP3
    const areaCounts = {};
    group.forEach((r) => {
      const a = r.전용면적_제곱미터 || r.건축물_연면적;
      if (!a) return;
      areaCounts[a] = (areaCounts[a] || 0) + 1;
    });
    const topAreas = Object.entries(areaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([area, cnt]) => ({ area, rate: toFixed1((cnt / total) * 100) }));

    // ✅ 해석 포인트
    let comment = '';
    if (loanRate >= 70 && residenceRate < 50)
      comment = '대출 의존도 높고 투자 중심. 금융 리스크 주의.';
    else if (residenceRate >= 70 && holdingSummary.includes('10년 이상'))
      comment = '장기보유 실거주 중심. 조합 안정성 높음.';
    else if (seizureRate >= 5)
      comment = '압류/가압류 비율 높음. 법적 리스크 관리 필요.';
    else comment = '균형 잡힌 구조. 맞춤형 커뮤니케이션 필요.';

    insights[age] = {
      loanRate,
      avgLoan,
      residenceRate,
      holdingSummary,
      seizureRate,
      topAreas,
      comment
    };

    // console.log(`✅ ${age} 계산 결과:`, insights[age]);
  });



  // -------------------------------------------------------
  // 6️⃣ 최종 반환
  // -------------------------------------------------------
  // console.log('🎯 ageInsights 최종 반환:', insights);
  return insights;
}

