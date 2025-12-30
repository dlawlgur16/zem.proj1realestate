// ============================================
// src/utils/geminiReportGenerator.js (최종 버전)
// ============================================

import { calculateAgeInsights } from "./ageInsights.js"; // 경로는 프로젝트 구조에 맞게 수정

/**
 * Gemini API를 사용한 보고서 생성
 */
export async function generateGeminiInsights(stats, apiKey, csvData = null) {
    // 연령대별 인사이트가 없으면 계산
    if (!stats.ageInsights) {
        if (csvData && Array.isArray(csvData)) {
            stats.ageInsights = calculateAgeInsights(csvData);
        } else if (stats.rows && Array.isArray(stats.rows)) {
            stats.ageInsights = calculateAgeInsights(stats.rows);
        }
    }
    
    const prompt = createAnalysisPrompt(stats);
    
    try {
      const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 24000,
              topP: 0.9,
              topK: 20
            }
          })
        }
      );
  
      if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;
      
      // Response body는 한 번만 읽을 수 있으므로 clone하거나 text로 먼저 읽기
      const responseText = await response.text();

      try {
        const errorData = JSON.parse(responseText);
        const apiError = errorData.error?.message || '알 수 없는 오류';
        errorMessage += ` - ${apiError}`;

        // 429 에러 (할당량 초과) 특별 처리
        if (response.status === 429) {
          
          // 에러 데이터에서 할당량 정보 추출
          const quotaViolations = errorData.error?.details?.find(d => d['@type'] === 'type.googleapis.com/google.rpc.QuotaFailure')?.violations || [];
          const quotaDetails = quotaViolations.map(v => `- ${v.quotaMetric || '알 수 없음'}: limit ${v.quotaId || 'N/A'}`).join('\n');
          
          // 재시도 시간 추출
          const retryInfo = errorData.error?.details?.find(d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
          const retryDelay = retryInfo?.retryDelay ? `재시도 가능 시간: ${retryInfo.retryDelay}` : '';
          
          throw new Error(`API 할당량 초과 (429)\n\n무료 티어의 할당량이 모두 소진되었습니다.\n\n에러 상세:\n${apiError}\n\n할당량 정보:\n${quotaDetails || '상세 정보 없음'}\n${retryDelay ? retryDelay + '\n' : ''}\n해결 방법:\n1. Google AI Studio에서 할당량 확인: https://ai.dev/usage?tab=rate-limit\n2. 유료 플랜으로 업그레이드 (즉시 사용 가능)\n3. 할당량 리셋 대기 (보통 24시간마다 리셋)\n4. 다른 API 키 사용\n\n⚠️ 무료 티어의 일일 할당량이 0으로 설정되어 있어 당장 사용할 수 없습니다.`);
        }
      } catch (jsonError) {
        // JSON 파싱 실패 시
        if (response.status === 429) {
          throw new Error('API 할당량 초과 (429)\n\n무료 티어의 일일 사용량을 초과했습니다.\n\n해결 방법:\n1. Google AI Studio에서 할당량 확인\n2. 유료 플랜으로 업그레이드\n3. 할당량 리셋 대기');
        }
        errorMessage += ` - HTML 응답을 받았습니다. API 키를 확인해주세요.`;
      }
      throw new Error(errorMessage);
    }

    // response.ok가 true이므로 여기서는 body를 읽을 수 있음
    const responseText = await response.text();
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('API가 유효하지 않은 JSON을 반환했습니다. API 키를 확인해주세요.');
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      const generatedText = data.candidates[0].content.parts[0].text;
      return generatedText;
    } else {
      throw new Error('API 응답 구조가 올바르지 않습니다.');
    }
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 통계 데이터 기반 프롬프트 생성
   */
  function createAnalysisPrompt(stats) {
  
    const residenceRate = ((stats.residenceCount / stats.total) * 100).toFixed(1);
    const investmentRate = ((stats.investmentCount / stats.total) * 100).toFixed(1);
    const avgLoan = stats.averageLoanAmount ? (stats.averageLoanAmount / 100000000).toFixed(1) : '0';
  
  return `당신은 재건축 전문 컨설턴트입니다. 시공사 의사결정을 위한 데이터 기반 분석 보고서를 작성하세요.

**필수 준수사항:**
1. 반드시 8개 섹션 모두 완성할 것 (중간에 멈추지 말 것)
2. 제공된 실제 수치만 사용 (추정치 사용 금지)
3. 각 섹션은 최소 150자 이상 작성
4. 전체 길이: 2500-3000단어
5. 마지막에 반드시 "---END OF REPORT---" 표시

## 📊 실제 분석 데이터
**분석 대상:** 전체통계
**총 세대수:** ${stats.total}세대
**실거주 세대:** ${stats.residenceCount}세대 (${residenceRate}%)
**투자 세대:** ${stats.investmentCount}세대 (${investmentRate}%)
**총 근저당액:** ${stats.totalLoanAmount ? (stats.totalLoanAmount / 100000000).toFixed(1) : '0'}억원
**가구당 평균 근저당액:** ${avgLoan}억원

## 📊 실제 CSV 데이터 통계 (가정 금지, 실제 데이터만 사용)
**총 데이터 건수:** ${stats.total}건

### 이전사유 분석 (실제 데이터):
${stats.transferReasons ? Object.entries(stats.transferReasons).map(([key, value]) => `- ${key}: ${value}건 (${((value/stats.total)*100).toFixed(1)}%)`).join('\n') : '데이터 없음'}

### 전용면적별 분포 (실제 데이터):
${stats.areaGroups ? Object.entries(stats.areaGroups).map(([key, value]) => `- ${key}: ${value}세대 (${((value/stats.total)*100).toFixed(1)}%)`).join('\n') : '데이터 없음'}

### 보유기간별 분포 (실제 데이터):
${stats.holdingGroups ? Object.entries(stats.holdingGroups)
  .sort((a, b) => {
    // 기간 기준으로 정렬 (1년 미만부터 30년 이상까지)
    const getPeriodOrder = (key) => {
      if (key === '1년 미만') return 1;
      if (key === '1년') return 2;
      if (key === '2년') return 3;
      if (key === '3년') return 4;
      if (key === '4년') return 5;
      if (key === '5년') return 6;
      if (key === '6년') return 7;
      if (key === '7년') return 8;
      if (key === '8년') return 9;
      if (key === '9년') return 10;
      if (key === '10년') return 11;
      if (key === '11년') return 12;
      if (key === '12년') return 13;
      if (key === '13년') return 14;
      if (key === '14년') return 15;
      if (key === '15년') return 16;
      if (key === '16년') return 17;
      if (key === '17년') return 18;
      if (key === '18년') return 19;
      if (key === '19년') return 20;
      if (key === '20년') return 21;
      if (key === '21년') return 22;
      if (key === '22년') return 23;
      if (key === '23년') return 24;
      if (key === '24년') return 25;
      if (key === '25년') return 26;
      if (key === '26년') return 27;
      if (key === '27년') return 28;
      if (key === '28년') return 29;
      if (key === '29년') return 30;
      if (key === '30년 이상') return 31;
      return 999;
    };
    return getPeriodOrder(a[0]) - getPeriodOrder(b[0]);
  })
  .map(([key, value]) => `- ${key}: ${value}건 (${((value/stats.total)*100).toFixed(1)}%)`).join('\n') : '데이터 없음'}

### 압류/가압류 현황 (실제 데이터):
${stats.seizureStatusData ? stats.seizureStatusData.map(item => `- ${item.name}: ${item.value}건 (${((item.value/stats.total)*100).toFixed(1)}%)`).join('\n') : '데이터 없음'}

### 연령대별 분포 (실제 데이터):
${stats.ageGroups ? Object.entries(stats.ageGroups)
  .sort((a, b) => {
    // 나이 기준으로 정렬 (10대부터 90대까지)
    const getAgeOrder = (key) => {
      if (key === '10대') return 1;
      if (key === '20대') return 2;
      if (key === '30대') return 3;
      if (key === '40대') return 4;
      if (key === '50대') return 5;
      if (key === '60대') return 6;
      if (key === '70대') return 7;
      if (key === '80대') return 8;
      if (key === '90대') return 9;
      return 999;
    };
    return getAgeOrder(a[0]) - getAgeOrder(b[0]);
  })
  .map(([key, value]) => `- ${key}: ${value}건 (${((value/stats.total)*100).toFixed(1)}%)`).join('\n') : '데이터 없음'}

### 💡 연령대별 인사이트 (확장형):
${stats.ageInsights ? Object.entries(stats.ageInsights)
  .sort((a, b) => {
    // 연령대 순서: 10대, 20대, 30대, 40대, 50대, 60대, 70대, 80대, 90대 이상
    const ageOrder = ['10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대 이상'];
    
    const indexA = ageOrder.indexOf(a[0]);
    const indexB = ageOrder.indexOf(b[0]);
    
    // 디버깅: 정렬 과정 로그
    console.log(`🔍 정렬: ${a[0]}(${indexA}) vs ${b[0]}(${indexB})`);
    
    // 둘 다 ageOrder에 있으면 순서대로 정렬
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // 하나만 ageOrder에 있으면 그것을 앞으로
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // 둘 다 ageOrder에 없으면 알파벳 순으로 정렬
    return a[0].localeCompare(b[0]);
  })
  .map(([age, insight]) => `
#### 🔹 ${age}층 분석

**1. 대출 현황 분석:**
- 대출 비율: ${insight.loanRate != null ? `${insight.loanRate}%` : '데이터 없음'}
- 평균 근저당액: ${insight.avgLoan != null ? `${insight.avgLoan}억원` : '데이터 없음'}
- 대출 현황의 특징과 투자 성향에 미치는 영향 분석

<!-- 디버깅: ${age}층 insight 데이터 -->
<!-- loanRate: ${insight.loanRate}, avgLoan: ${insight.avgLoan}, residenceRate: ${insight.residenceRate} -->

**2. 실거주 비율 분석:**
- 실거주 비율: ${insight.residenceRate != null ? `${insight.residenceRate}%` : '데이터 없음'}
- 거주 vs 투자 성향 분석 및 조합 안정성에 미치는 영향

**3. 보유기간 요약:**
- ${insight.holdingSummary || '데이터 없음'}
- 장기/단기 보유 특성과 재개발 참여 의향 분석

**4. 압류/가압류 현황:**
- 압류/가압류 비율: ${insight.seizureRate != null ? `${insight.seizureRate}%` : '데이터 없음'}
- 법적 리스크와 조합 설립 시 주의사항 분석

**5. 면적 집중도:**
- 주요 면적: ${Array.isArray(insight.topAreas) && insight.topAreas.length ? insight.topAreas.map(a => `${a.area}㎡(${a.rate}%)`).join(', ') : '데이터 없음'}
- 평형별 투자 성향과 선호도 분석

💡 **${age}의 종합적 해석 포인트:** 
위 5가지 분석 사항(대출현황, 실거주비율, 보유기간, 압류/가압류현황, 면적집중도)을 종합하여 ${age}층의 투자 성향, 조합 참여 가능성, 리스크 요인, 시공사 전략 수립에 필요한 핵심 인사이트를 제공해주세요.
`).join('\n') : '연령대별 상세 데이터 부족으로 분석 불가'}

**중요: 위 연령대별 인사이트 데이터를 보고서의 "연령대별 인사이트 분석" 섹션에 반드시 포함해주세요.**


### 대출 현황 (실제 데이터):
${stats.loanStatusData ? stats.loanStatusData
  .sort((a, b) => a.value - b.value) // 적은 순으로 정렬
  .map(item => `- ${item.name}: ${item.value}건 (${((item.value/stats.total)*100).toFixed(1)}%)`).join('\n') : '데이터 없음'}

### 거주/투자 비율 (실제 데이터):
${stats.residenceInvestmentData ? stats.residenceInvestmentData.map(item => `- ${item.name}: ${item.value}세대 (${((item.value/stats.total)*100).toFixed(1)}%)`).join('\n') : '데이터 없음'}

### 대출금액대별 분포 (실제 데이터):
${stats.loanAmountGroups ? Object.entries(stats.loanAmountGroups)
  .sort((a, b) => {
    // 금액 기준으로 정렬 (1억 미만부터 10억 이상까지)
    const getAmountOrder = (key) => {
      if (key === '1억 미만') return 1;
      if (key === '1억대') return 2;
      if (key === '2억대') return 3;
      if (key === '3억대') return 4;
      if (key === '4억대') return 5;
      if (key === '5억대') return 6;
      if (key === '6억대') return 7;
      if (key === '7억대') return 8;
      if (key === '8억대') return 9;
      if (key === '9억대') return 10;
      if (key === '10억 이상') return 11;
      return 999;
    };
    return getAmountOrder(a[0]) - getAmountOrder(b[0]);
  })
  .map(([key, value]) => `- ${key}: ${value}건 (${((value/stats.total)*100).toFixed(1)}%)`).join('\n') : '데이터 없음'}

## 📋 보고서 작성 형식 (반드시 모든 섹션 작성)

### 1. 사업성 종합 평가
**작성 내용:** 핵심 지표 4개 + 사업 난이도(상/중/하) + 예상 동의율
**분량:** 200-250자

### 2. 조합 구성 분석
**작성 내용:**
- 1문단: 실거주(${residenceRate}%) vs 투자자(${investmentRate}%) 비율 해석
- 2문단: 연령대 상위 3개 분석 및 의사결정 성향
**분량:** 300-350자

### 3. 재무 건전성 분석
**작성 내용:**
- 1문단: 평균 근저당액(${avgLoan}억) 및 근저당 비율 분석
- 2문단: 대출금액대별 분포 특징 및 분담금 납부 능력
**분량:** 300-350자

### 4. 사업 추진력 분석
**작성 내용:**
- 1문단: 보유기간별 분포 및 조합원 안정성
- 2문단: 소유권 변동 패턴(매매/증여/상속) 및 이탈 가능성
**분량:** 300-350자

### 5. 물리적 특성 분석
**작성 내용:** 면적별 분포 + 신축 평형 전략 + 압류/가압류 현황
**분량:** 200-250자

### 6. 핵심 리스크 및 기회 요인
**작성 형식:** 반드시 표 형식 사용
| 구분 | 요인 | 영향도 | 대응 전략 |
|------|------|--------|-----------|
| 긍정 | [구체적 기회 요인] | 상/중/하 | [실행 가능한 전략] |
| 리스크 | [구체적 위험 요인] | 상/중/하 | [완화 방안] |

**최소 3개씩 작성**

### 7. 시공사 전략 제언
**작성 형식:** 5개 제언, 각각 아래 구조
1. **[제언 제목]**
   - 배경: [1문장]
   - 목표: [1문장]
   - 실행: [구체적 방법 2-3문장]

### 8. 결론
**작성 내용:**
- 사업 추진 권고 수준: "적극 권장" 또는 "조건부 권장" 또는 "신중 검토"
- 핵심 성공 요인 3개
- 주의사항 3개
**분량:** 200-250자

---
**⚠️ 중요: 반드시 8개 섹션을 모두 작성한 후 "---END OF REPORT---"로 마무리하세요.**`;
}

/**
 * 하이브리드 보고서 생성 (Gemini API + Fallback)
 */
export async function generateHybridReport(stats, apiKey, csvData = null) {
  // API 키 확인
  if (!apiKey) {
    return generateFallbackReport(stats);
  }

  try {
    const result = await generateGeminiInsights(stats, apiKey, csvData);
    return result;
  } catch (error) {
    // Fallback 보고서 반환
    return generateFallbackReport(stats);
  }
}

/**
 * Fallback 보고서 생성
 */
function generateFallbackReport(stats) {
  const residenceRate = ((stats.residenceCount / stats.total) * 100).toFixed(1);
  const investmentRate = ((stats.investmentCount / stats.total) * 100).toFixed(1);
  const totalLoanAmount = stats.totalLoanAmount ? (stats.totalLoanAmount / 100000000).toFixed(1) : '0';
  const averageLoanAmount = stats.averageLoanAmount ? (stats.averageLoanAmount / 100000000).toFixed(1) : '0';

  return `# 재건축 분석 보고서 (Fallback)
  
  ## 📊 핵심 지표 요약
  
- **실거주 비율**: ${stats.residenceCount}세대 (${residenceRate}%)
- **투자 비율**: ${stats.investmentCount}세대 (${investmentRate}%)
- **총 근저당액**: ${totalLoanAmount}억원
- **가구당 평균 근저당액**: ${averageLoanAmount}억원
  
  ## 👥 인구통계 분석
  
  ### 연령대 분포
${stats.ageGroups ? Object.entries(stats.ageGroups).map(([age, count]) => `- ${age}: ${count}명`).join('\n') : '데이터 없음'}
  
  ### 성별 분포
${stats.genderGroups ? Object.entries(stats.genderGroups).map(([gender, count]) => `- ${gender}: ${count}명`).join('\n') : '데이터 없음'}
  
  ## 🏠 거주 현황 분석
  
  ### 거주/투자 비율
  | 구분 | 세대수 | 비율 |
  |------|--------|------|
| 실거주 | ${stats.residenceCount}세대 | ${residenceRate}% |
| 투자목적 | ${stats.investmentCount}세대 | ${investmentRate}% |
  
  ## 💰 대출 현황 분석
  
  ### 대출 보유 현황
- **대출 보유**: ${stats.loanCount || 0}세대
- **무대출**: ${stats.noLoanCount || 0}세대
  
  ### 대출 규모
- **총 근저당액**: ${totalLoanAmount}억원
- **가구당 평균**: ${averageLoanAmount}억원
  
  ## 📐 부동산 보유 현황
  
  ### 면적별 분포
${stats.areaGroups ? Object.entries(stats.areaGroups).map(([area, count]) => `- ${area}: ${count}세대`).join('\n') : '데이터 없음'}
  
  ### 보유 기간 분석
${stats.holdingGroups ? Object.entries(stats.holdingGroups).map(([period, count]) => `- ${period}: ${count}건`).join('\n') : '데이터 없음'}
  
  ### 소유권 이전 원인
${stats.transferReasons ? Object.entries(stats.transferReasons).map(([reason, count]) => `- ${reason}: ${count}건`).join('\n') : '데이터 없음'}

  ## 📋 데이터 출처
  
- **분석 기준일**: ${new Date().toLocaleDateString()}
- **데이터 건수**: ${stats.total}건
- **분석 범위**: 전체통계

---

*본 보고서는 등기부등본 데이터를 기반으로 생성되었습니다.*`;
}

/**
 * 마크다운 다운로드
 */
export function downloadAsMarkdown(content, filename = 'report.md') {
  const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * HTML 다운로드
   */
export function downloadAsHTML(content, filename = 'report.html') {
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>재건축 분석 보고서</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #2d3748; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background-color: #f7fafc; font-weight: 600; }
        code { background-color: #f7fafc; padding: 2px 4px; border-radius: 3px; }
        blockquote { border-left: 4px solid #4299e1; margin: 20px 0; padding-left: 20px; color: #4a5568; }
    </style>
  </head>
  <body>
    ${content.replace(/\n/g, '<br>')}
  </body>
</html>`;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
