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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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
              maxOutputTokens: 8000,
              topP: 0.9,
              topK: 1
            }
          })
        }
      );
  
      if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.error?.message || '알 수 없는 오류'}`;
      } catch (jsonError) {
        // JSON 파싱 실패 시 HTML 응답일 가능성
        const htmlResponse = await response.text();
        console.error('HTML 응답:', htmlResponse.substring(0, 200));
        errorMessage += ` - HTML 응답을 받았습니다. API 키를 확인해주세요.`;
      }
      throw new Error(errorMessage);
    }

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
      return data.candidates[0].content.parts[0].text;
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
  
  return `당신은 20년 경력의 부동산 재건축 전문가입니다. 다음 실제 데이터를 분석하여 시공사가 바로 활용할 수 있는 구체적이고 실무적인 분석 보고서를 작성해주세요.

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
    // 연령대 순서: 20대, 30대, 40대, 50대, 60대, 70대
    const ageOrder = ['20대', '30대', '40대', '50대', '60대', '70대'];
    return ageOrder.indexOf(a[0]) - ageOrder.indexOf(b[0]);
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

## 🎯 보고서 작성 요구사항
위 실제 데이터를 바탕으로 다음 구조의 전문가 수준 보고서를 작성해주세요:

**보고서 구조 (실제 데이터 기반):**
1. **단지 개요** - 기본 정보와 해석 포인트
2. **실거주 vs 투자자 비율 분석** - 조합 안정성과 사업 추진 동력
3. **소유권 변동 분석** - 거래 패턴과 시장 동향 (실제 데이터만)
4. **면적별 분포** - 평형별 특성과 투자 성향 (실제 데이터만)
5. **보유기간 분석** - 장기/단기 보유자 특성 (실제 데이터만)
6. **등기이전 원인 분석** - 매매/증여/상속/경매 비율 (실제 데이터만)
7. **금융 현황 분석** - 근저당, 대출 현황, 리스크 분석 (실제 데이터만)
8. **압류/가압류 현황 분석** - 법적 리스크와 조합 설립 시 주의사항 (실제 데이터만)
9. **종합 요약** - 핵심 지표 요약표 (간결한 형태)
10. **종합 인사이트 분석** - 각 연령대별 상세 특성과 투자 성향 (실제 데이터만)
    - 각 연령대별로 다음 6가지 항목을 상세 분석:
      * 대출 현황 분석 (대출 비율, 평균 근저당액, 투자 성향에 미치는 영향)
      * 실거주 비율 분석 (거주 vs 투자 성향, 조합 안정성에 미치는 영향)
      * 보유기간 요약 (장기/단기 보유 특성, 재개발 참여 의향)
      * 소유권 변동 패턴 (거래 유형별 특성, 시장 동향)
      * 압류/가압류 현황 (법적 리스크, 조합 설립 시 주의사항)
      * 면적 집중도 (평형별 투자 성향, 선호도)
    - 각 연령대별 종합적 해석 포인트 제공 (위 6가지 분석을 종합한 핵심 인사이트)
11. **시공사 전략 제언** - 구체적이고 실행 가능한 방안
12. **결론** - 긍정적 요인과 리스크 요인 구분

**중요: 제공된 데이터에 없는 정보는 분석하지 마세요:**
- 연령대별 분포 (주민번호로 추정 가능한 경우만)
- 거주지별 분포 (현주소 데이터가 있는 경우만)
- 기타 가정이나 추정 데이터 사용 금지

**실제 데이터 기반 분석만 수행:**
- 실거주 vs 투자자 비율 (실거주여부 컬럼 기반)
- 소유권 변동 (이전사유 컬럼 기반) - 매매, 증여, 상속, 경매 비율 분석
- 면적별 분포 (전용면적_제곱미터 컬럼 기반) - 151.74, 95.5 등 면적별 세대수 분석
- 보유기간 (보유기간_년 컬럼 기반) - 22년, 2년, 10년 등 보유기간별 분포 분석
- 금융 현황 (유효근저당총액 컬럼 기반) - 근저당 설정 세대수와 금액 분석
- 압류/가압류 현황 (압류가압류유무 컬럼 기반) - N, Y 등 압류 현황 분석
- 거주지별 분석 (현주소 컬럼 기반) - 서울시 강북구, 은평구 등 거주지 분포
- 연령대별 분석 (주민번호 컬럼 기반) - 주민번호 앞자리로 연령대 추정

**중요 지침:**
- 위에 제공된 실제 CSV 데이터 통계만을 사용하여 분석
- "(가정)" 또는 "추정"이라는 표현 절대 금지
- "데이터 부족으로 인해 분석 불가"라고 하지 말고, 제공된 실제 데이터를 기반으로 분석
- 각 섹션별로 구체적인 수치와 비율을 제시
- 시공사 관점의 실무적 인사이트 제공
- 모든 분석은 제공된 실제 통계 데이터를 기반으로만 작성

**각 섹션별 분석 요구사항:**
1. **소유권 변동 분석**: 이전사유 컬럼의 매매/증여/상속/경매 비율과 해석
2. **면적별 분포**: 전용면적_제곱미터 컬럼의 면적별 세대수 분포와 해석
3. **보유기간 분석**: 보유기간_년 컬럼의 보유기간별 분포와 해석
4. **등기이전 원인 분석**: 이전사유 컬럼의 거래 유형별 비율과 해석
5. **금융 현황 분석**: 유효근저당총액 컬럼의 근저당 현황과 해석
6. **압류/가압류 현황 분석**: 압류가압류유무 컬럼의 압류/가압류 비율과 조합 설립 시 법적 리스크 분석

**종합 요약 표 작성 지침:**
- 각 지표별로 간결한 해석 (한 줄 이내)
- 핵심 포인트만 포함
- 시공사 관점의 실무적 인사이트
- 표 형식: | 지표 | 수치/비율 | 핵심 해석 |

**종합 요약 표 예시:**
| 지표 | 수치/비율 | 핵심 해석 |
| --- | --- | --- |
| 실거주 비율 | 74.5% | 조합 안정성 확보 가능 |
| 외지 투자자 | 25.5% | 사업 초기 동력 약함, 수익률 중심 설득 필요 |
| 고연령층 | 50~60대 추정 | 보수적·신중형 |
| 근저당 비율 | 69.3% | 높은 편, 금융 리스크 관리 필요 |
| 장기보유세대 | 52.4% | 사업 지속성 높음 |
| 거래 집중시기 | 2022~2025년 | 재건축 기대감 |
| 압류/가압류 현황 | 3.1% | 법적 리스크 낮음, 조합 설립 시 개별 협의 필요 |
| 핵심 리스크 | 높은 근저당 비율 | 높은 분담금 예상 |

**중요 지침:**
- 제공된 실제 데이터를 정확히 활용
- 각 섹션마다 "💡 해석 포인트" 포함
- 시공사 관점의 실무적 인사이트 제공
- 구체적인 수치와 비율 활용
- 실행 가능한 전략 제언

**데이터 분석 정확성 요구사항:**
- 제공된 수치를 정확히 반영 (예: 20대가 56.8%면 "20대가 압도적으로 높다"고 분석)
- 일반적인 추정이나 가정 금지
- 실제 데이터와 반대되는 해석 금지
- 데이터 기반의 객관적 분석만 제공

**보고서 퀄리티 기준:**
- 전문가 수준의 분석 깊이
- 시공사가 바로 활용할 수 있는 실무적 내용
- 데이터 기반의 객관적 분석
- 구체적이고 실행 가능한 전략 제언

**중요**: 템플릿적인 내용이 아닌, 제공된 실제 데이터(${stats.total}세대, ${stats.residenceCount}세대 등)를 기반으로 한 맞춤형 분석을 작성해주세요. 

**특히 연령대 분석 시:**
- 20대가 56.8%로 압도적이면 "20대가 압도적으로 높다"고 분석
- 실제 데이터와 반대되는 "고연령층이 많다"는 잘못된 해석 금지
- 데이터를 정확히 반영한 분석만 제공

**정확한 데이터 분석 예시:**
- 연령대 분포: 20대 56.8% > 60대 이상 16.8% > 40대 10.2% > 30대 8.2% > 50대 8.0%
- 해석: "20대 비율이 압도적으로 높은 것은 주민번호 기준 2000년대생으로 파악되는 층이며, 실제로는 부모 세대가 자녀 명의로 등기한 경우가 많을 것으로 추정된다."
- 잘못된 해석 금지: "고연령층이 많다", "50~60대가 주류다" 등 실제 데이터와 반대되는 내용`;
}

/**
 * 하이브리드 보고서 생성 (Gemini API + Fallback)
 */
export async function generateHybridReport(stats, apiKey, csvData = null) {
  try {
    console.log('🤖 Gemini API로 보고서 생성 시도...');
    return await generateGeminiInsights(stats, apiKey, csvData);
  } catch (error) {
    console.error('❌ Gemini API 실패:', error);
    console.log('🔄 Fallback 보고서로 전환...');
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