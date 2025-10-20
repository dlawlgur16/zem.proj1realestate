/**
 * 연령대별 인사이트 계산 함수
 * CSV 데이터를 받아서 연령대별로 다양한 통계를 계산합니다.
 */

export function calculateAgeInsights(rows) {
  const AGE_KEYS = ["20대", "30대", "40대", "50대", "60대", "70대", "80대", "90대 이상"];
  const insights = {};

  const toFixed1 = (n) => (typeof n === "number" ? n.toFixed(1) : (Number(n) || 0).toFixed(1));

  AGE_KEYS.forEach((age) => {
    const group = rows.filter((r) => r.연령대 === age);
    const total = group.length;
    if (!total) return;

    // 대출 현황
    const loaned = group.filter((r) => Number(r.유효근저당총액) > 0);
    const loanRate = Number(((loaned.length / total) * 100).toFixed(1));
    const avgLoan = loaned.length
      ? Number(
          (loaned.reduce((sum, r) => sum + Number(r.유효근저당총액 || 0), 0) / loaned.length / 1e8).toFixed(1)
        )
      : 0;

    // 실거주 비율
    const residence = group.filter((r) => String(r.실거주여부).trim() === "실거주");
    const residenceRate = Number(((residence.length / total) * 100).toFixed(1));

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
  });

  return insights;
}
