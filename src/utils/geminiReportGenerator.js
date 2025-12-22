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
            console.log('📊 CSV 데이터로 연령대별 인사이트 계산 시작...');
            console.log('📊 CSV 데이터 길이:', csvData.length);
            stats.ageInsights = calculateAgeInsights(csvData);
            console.log('📊 CSV 데이터로 연령대별 인사이트 계산됨:', stats.ageInsights);
            console.log('📊 연령대별 인사이트 키들:', Object.keys(stats.ageInsights));
        } else if (stats.rows && Array.isArray(stats.rows)) {
            console.log('📊 rows 데이터로 연령대별 인사이트 계산 시작...');
            console.log('📊 rows 데이터 길이:', stats.rows.length);
            stats.ageInsights = calculateAgeInsights(stats.rows);
            console.log('📊 rows 데이터로 연령대별 인사이트 계산됨:', stats.ageInsights);
            console.log('📊 연령대별 인사이트 키들:', Object.keys(stats.ageInsights));
        } else {
            console.log('⚠️ 연령대별 인사이트 계산을 위한 데이터가 없습니다.');
            console.log('⚠️ csvData:', csvData);
            console.log('⚠️ stats.rows:', stats.rows);
        }
    } else {
        console.log('📊 이미 계산된 연령대별 인사이트 사용:', stats.ageInsights);
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
              temperature: 0.2,
              maxOutputTokens: 32000,
              topP: 0.9,
              topK: 1
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
          console.error('❌ API 할당량 초과 - 전체 에러 데이터:', JSON.stringify(errorData, null, 2));
          console.error('❌ 에러 상세:', errorData.error);
          
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
          console.error('❌ 429 에러 - 텍스트 응답:', responseText.substring(0, 500));
          throw new Error('API 할당량 초과 (429)\n\n무료 티어의 일일 사용량을 초과했습니다.\n\n해결 방법:\n1. Google AI Studio에서 할당량 확인\n2. 유료 플랜으로 업그레이드\n3. 할당량 리셋 대기');
        }
        console.error('HTML 응답:', responseText.substring(0, 200));
        errorMessage += ` - HTML 응답을 받았습니다. API 키를 확인해주세요.`;
      }
      throw new Error(errorMessage);
    }

    // response.ok가 true이므로 여기서는 body를 읽을 수 있음
    const responseText = await response.text();
    console.log('API 응답:', responseText.substring(0, 200));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.error('응답 내용:', responseText.substring(0, 500));
      throw new Error('API가 유효하지 않은 JSON을 반환했습니다. API 키를 확인해주세요.');
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      const generatedText = data.candidates[0].content.parts[0].text;
      const finishReason = data.candidates[0].finishReason;

      // 응답이 잘렸는지 확인
      if (finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ 응답이 최대 토큰 수로 인해 잘렸습니다. maxOutputTokens를 늘려보세요.');
      } else if (finishReason === 'STOP') {
        console.log('✅ 응답이 정상적으로 완료되었습니다.');
      } else {
        console.warn('⚠️ 예상치 못한 finishReason:', finishReason);
      }

      console.log('📝 생성된 텍스트 길이:', generatedText.length, '문자');

      return generatedText;
    } else {
      console.error('API 응답 구조 오류:', data);
      throw new Error('API 응답 구조가 올바르지 않습니다.');
    }
    } catch (error) {
      console.error('Gemini API 오류:', error);
      throw error;
    }
  }
  
  /**
   * 통계 데이터 기반 프롬프트 생성
   */
  function createAnalysisPrompt(stats) {
  // 디버깅: 통계 데이터 구조 확인
  console.log('📊 프롬프트 생성 - 통계 데이터:', stats);
  console.log('📊 ageGroups:', stats.ageGroups);
  console.log('📊 transferReasons:', stats.transferReasons);
  console.log('📊 areaGroups:', stats.areaGroups);
  console.log('📊 holdingGroups:', stats.holdingGroups);
  console.log('📊 seizureStatusData:', stats.seizureStatusData);
  console.log('📊 loanStatusData:', stats.loanStatusData);
  console.log('📊 residenceInvestmentData:', stats.residenceInvestmentData);
  console.log('📊 ageInsights:', stats.ageInsights);
  
  // ageInsights 상세 디버깅
  if (stats.ageInsights) {
    console.log('📊 ageInsights 상세 분석:');
    Object.entries(stats.ageInsights).forEach(([age, insight]) => {
      console.log(`📊 ${age}:`, {
        loanRate: insight.loanRate,
        avgLoan: insight.avgLoan,
        residenceRate: insight.residenceRate,
        seizureRate: insight.seizureRate
      });
    });
  } else {
    console.log('❌ ageInsights 데이터가 없습니다!');
  }
  
    const residenceRate = ((stats.residenceCount / stats.total) * 100).toFixed(1);
    const investmentRate = ((stats.investmentCount / stats.total) * 100).toFixed(1);
    const avgLoan = stats.averageLoanAmount ? (stats.averageLoanAmount / 100000000).toFixed(1) : '0';
  
  return `당신은 20년 경력의 부동산 재건축 전문가입니다. 제공된 실제 데이터만을 사용하여 간결하고 실무적인 분석 보고서를 작성하세요.

**중요 규칙:**
1. 제공된 수치만 사용 (추정/가정 금지)
2. 각 섹션은 간결하게 (1-2문단)
3. 보고서 총 길이: 최대 5000단어
4. 반복 금지 - 각 내용은 한 번만 작성

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

## 🎯 보고서 구조

다음 순서로 작성하세요. 각 섹션은 간결하게 1-2문단으로:

1. **단지 개요** - 총 세대수, 실거주/투자 비율, 핵심 특징
2. **거주 현황 분석** - 실거주 vs 투자자 비율, 조합 안정성 평가
3. **금융 현황** - 근저당 비율, 평균 대출액, 금융 리스크
4. **소유권 변동** - 이전사유 비율 (매매/증여/상속/경매)
5. **보유기간 분석** - 장기/단기 보유자 비율, 사업 지속성
6. **면적별 분포** - 주요 평형대, 투자 성향
7. **연령대별 특징** - 주요 연령대 (상위 3개만), 각각의 특징
8. **압류/가압류 현황** - 법적 리스크 수준
9. **종합 평가** - 핵심 지표 3-5개 요약 (표 형식)
10. **시공사 전략** - 실행 가능한 제언 3-5개 (불릿 포인트)
11. **결론** - 긍정 요인 2-3개, 리스크 요인 2-3개

**작성 완료 후 "---END OF REPORT---"를 마지막 줄에 추가하세요.**

지금 바로 작성을 시작하세요.`;
}

/**
 * 하이브리드 보고서 생성 (Gemini API + Fallback)
 */
export async function generateHybridReport(stats, apiKey, csvData = null) {
  // API 키 확인
  if (!apiKey) {
    console.error('❌ API 키가 없습니다.');
    console.warn('⚠️ Fallback 보고서로 전환합니다.');
    return generateFallbackReport(stats);
  }
  
  try {
    console.log('🤖 Gemini API로 보고서 생성 시도...');
    console.log('🔑 API 키 확인:', apiKey ? `${apiKey.substring(0, 10)}...` : '없음');
    const result = await generateGeminiInsights(stats, apiKey, csvData);
    console.log('✅ Gemini API 성공!');
    return result;
  } catch (error) {
    console.error('❌ Gemini API 실패:', error);
    console.error('❌ 에러 상세:', error.message);
    console.error('❌ 에러 스택:', error.stack);
    console.warn('⚠️ Fallback 보고서로 전환합니다.');
    
    // Fallback 보고서 반환 (에러 정보는 콘솔에만 출력)
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