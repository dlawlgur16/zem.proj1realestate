// ============================================
// src/utils/geminiReportGenerator.js
// ============================================

/**
 * Gemini API를 사용한 하이브리드 보고서 생성 유틸리티
 * 규칙 기반(70%) + AI 인사이트(30%)
 */

/**
 * Gemini로 AI 인사이트 생성
 */
export async function generateGeminiInsights(stats, apiKey) {
    const prompt = createAnalysisPrompt(stats);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
              temperature: 0.7,
              maxOutputTokens: 2000,
              topP: 0.8,
              topK: 40
            }
          })
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
      }
  
      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('응답에 결과가 없습니다.');
      }
      
      const generatedText = data.candidates[0].content.parts[0].text;
      return generatedText;
      
    } catch (error) {
      console.error('Gemini API 오류:', error);
      throw error;
    }
  }
  
  /**
   * 통계 데이터 기반 프롬프트 생성
   */
  function createAnalysisPrompt(stats) {
    const residenceRate = ((stats.residenceCount / stats.total) * 100).toFixed(1);
    const investmentRate = ((stats.investmentCount / stats.total) * 100).toFixed(1);
    const loanRate = stats.loanStatusData?.[0]?.percentage || '0';
    const avgLoan = (stats.averageLoanAmount / 100000000).toFixed(1);
    
    const dominantAge = stats.ageData && stats.ageData.length > 0 
      ? stats.ageData.reduce((max, age) => age.count > max.count ? age : max, stats.ageData[0])
      : null;
  
    return `
  당신은 20년 경력의 재건축 전문 컨설턴트입니다. 아래 통계를 바탕으로 전략적 인사이트만 간결하게 작성해주세요.
  
  ## 📊 통계 요약
  - 총 세대수: ${stats.total}세대
  - 실거주율: ${residenceRate}%
  - 투자 비율: ${investmentRate}%
  - 대출 보유율: ${loanRate}%
  - 평균 대출: ${avgLoan}억원
  - 주요 연령대: ${dominantAge ? dominantAge.range : '정보없음'}
  
  ## 📝 작성 요청
  
  ### 1. 전략적 시사점 (2-3문장)
  이 단지의 특성이 재건축 추진에 주는 핵심 시사점을 간결하게 서술하세요.
  
  ### 2. 주요 리스크 (3가지)
  형식: **리스크명**: 설명 (1문장)
  
  ### 3. 성공 전략 (4가지)
  형식: **전략명**: 실행 방안 (1문장)
  
  간결하고 실용적으로 작성해주세요. 한국어로 응답하세요.
  `;
  }
  
  /**
   * 하이브리드 보고서 생성 (규칙 70% + AI 30%)
   */
  export async function generateHybridReport(statsData, activeTab, csvData, apiKey) {
    const stats = statsData[activeTab] || {};
    const reportDate = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  
    // ========================================
    // 1단계: 규칙 기반 보고서 (70%)
    // ========================================
    let report = `
  # ${activeTab} 재건축 조합원 분석 보고서
  
  **작성일**: ${reportDate}
  **분석 대상**: ${activeTab}
  **총 세대수**: ${stats.total}세대
  
  ---
  
  ## 📊 핵심 지표 요약
  
  - **실거주 비율**: ${stats.residenceCount}세대 (${((stats.residenceCount / stats.total) * 100).toFixed(1)}%)
  - **투자 비율**: ${stats.investmentCount}세대 (${((stats.investmentCount / stats.total) * 100).toFixed(1)}%)
  - **대출 보유율**: ${stats.loanStatusData?.[0]?.percentage || '0'}%
  - **가구당 평균 대출**: ${(stats.averageLoanAmount / 100000000).toFixed(1)}억원
  
  ---
  
  ## 👥 인구통계 분석
  
  ### 연령대 분포
  
  ${generateAgeTable(stats)}
  
  **분석**: ${analyzeAge(stats)}
  
  ### 성별 분포
  
  - **남성**: ${stats.male}명 (${((stats.male / stats.total) * 100).toFixed(1)}%)
  - **여성**: ${stats.female}명 (${((stats.female / stats.total) * 100).toFixed(1)}%)
  
  ---
  
  ## 🏠 거주 현황 분석
  
  ### 거주/투자 비율
  
  | 구분 | 세대수 | 비율 |
  |------|--------|------|
  | 실거주 | ${stats.residenceCount}세대 | ${((stats.residenceCount / stats.total) * 100).toFixed(1)}% |
  | 투자목적 | ${stats.investmentCount}세대 | ${((stats.investmentCount / stats.total) * 100).toFixed(1)}% |
  
  **분석**: ${analyzeResidence(stats)}
  
  ### 투자자 거주지역 분포
  
  ${generateRegionTable(stats)}
  
  ---
  
  ## 💰 대출 현황 분석
  
  ### 대출 보유 현황
  
  - **대출 보유**: ${stats.loanStatusData?.[0]?.value || 0}세대 (${stats.loanStatusData?.[0]?.percentage || 0}%)
  - **무대출**: ${stats.loanStatusData?.[1]?.value || 0}세대 (${stats.loanStatusData?.[1]?.percentage || 0}%)
  
  ### 대출 규모
  
  - **총 근저당액**: ${(stats.totalLoanAmount / 100000000).toFixed(0)}억원
  - **가구당 평균**: ${(stats.averageLoanAmount / 100000000).toFixed(1)}억원
  
  **분석**: ${analyzeLoan(stats)}
  
  ### 대출금액대별 분포
  
  ${generateLoanTable(stats)}
  
  ---
  
  ## 📐 부동산 보유 현황
  
  ### 면적별 분포
  
  ${generateAreaTable(stats)}
  
  **분석**: ${analyzeArea(stats)}
  
  ### 보유 기간 분석
  
  ${generateOwnershipTable(stats)}
  
  **분석**: ${analyzeOwnership(stats)}
  
  ### 소유권 이전 원인
  
  ${generateTransferTable(stats)}
  
  ---
  `;
  
    // ========================================
    // 2단계: AI 인사이트 (30%)
    // ========================================
    if (apiKey) {
      try {
        report += `\n## 🤖 전문가 인사이트 (AI 분석)\n\n`;
        report += `*위 통계를 바탕으로 AI가 생성한 전략적 인사이트입니다.*\n\n`;
        
        const aiInsights = await generateGeminiInsights(stats, apiKey);
        report += aiInsights;
        report += `\n\n---\n`;
      } catch (error) {
        console.error('AI 분석 실패:', error);
        // AI 실패 시 규칙 기반 인사이트로 대체
        report += `\n## 📈 종합 분석\n\n`;
        report += generateRuleBasedInsights(stats);
        report += `\n\n---\n`;
      }
    } else {
      // API 키 없으면 규칙 기반 인사이트 제공
      report += `\n## 📈 종합 분석\n\n`;
      report += generateRuleBasedInsights(stats);
      report += `\n\n---\n`;
    }
  
    // 3단계: 데이터 출처
    report += `
  ## 📋 데이터 출처
  
  - **분석 기준일**: ${reportDate}
  - **데이터 건수**: ${csvData.length}건
  - **분석 범위**: ${activeTab}
  
  ---
  
  *본 보고서는 등기부등본 및 조합원 명부를 기반으로 생성되었습니다.*
  ${apiKey ? '\n*AI 인사이트는 Google Gemini 1.5 Flash를 사용하여 생성되었습니다.*' : ''}
  `;
  
    return report;
  }
  
  // ========================================
  // 규칙 기반 분석 함수들 (항상 동일한 결과)
  // ========================================
  
  function analyzeAge(stats) {
    if (!stats.ageData || stats.ageData.length === 0) return '연령 데이터가 부족합니다.';
    
    const dominant = stats.ageData.reduce((max, age) => 
      age.count > max.count ? age : max
    , stats.ageData[0]);
    
    const percentage = ((dominant.count / stats.total) * 100).toFixed(1);
    
    let analysis = `${dominant.range}가 ${percentage}%로 가장 많은 비중을 차지하고 있습니다. `;
    
    if (dominant.range === '50대' || dominant.range === '60대') {
      analysis += '주요 연령층이 중장년층으로, 재건축에 대한 관심이 높으며 장기 거주 의향이 있을 것으로 예상됩니다. 임시 거주 시 편의성과 접근성을 중요하게 고려해야 합니다.';
    } else if (dominant.range === '30대' || dominant.range === '40대') {
      analysis += '주요 연령층이 경제활동이 활발한 세대로, 자녀 교육과 직장 접근성을 중시할 것으로 보입니다. 디지털 소통 채널을 적극 활용할 수 있습니다.';
    } else {
      analysis += '다양한 연령층이 고루 분포되어 있어, 세대별 맞춤형 소통 전략이 필요합니다.';
    }
    
    return analysis;
  }
  
  function analyzeResidence(stats) {
    const residenceRate = (stats.residenceCount / stats.total) * 100;
    
    let analysis = '';
    
    if (residenceRate >= 70) {
      analysis = `실거주 비율이 ${residenceRate.toFixed(1)}%로 매우 높습니다. 재건축 추진 시 조합원들의 주거 안정성을 최우선으로 고려해야 하며, 임시 거주 대책과 이주비 지원이 핵심 이슈가 될 것입니다. 분양가보다 거주 편의성이 더 중요한 의사결정 요소로 작용할 가능성이 높습니다.`;
    } else if (residenceRate >= 50) {
      analysis = `실거주 비율이 ${residenceRate.toFixed(1)}%로 과반을 차지하고 있습니다. 실거주자의 주거권 보호와 투자자의 재산권 보호를 균형있게 고려해야 합니다. 양측의 이해관계를 조정하는 세심한 의사소통 전략이 필요합니다.`;
    } else {
      analysis = `투자 목적 보유 비율이 ${(100 - residenceRate).toFixed(1)}%로 더 높습니다. 재건축 추진 시 투자 수익성이 중요한 의사결정 요소로 작용할 것입니다. 분양가 전망과 시세 차익에 대한 명확한 정보 제공이 필요합니다.`;
    }
    
    return analysis;
  }
  
  function analyzeLoan(stats) {
    const loanRate = parseFloat(stats.loanStatusData?.[0]?.percentage || 0);
    const avgLoan = stats.averageLoanAmount / 100000000;
    
    let analysis = '';
    
    if (loanRate >= 70) {
      analysis = `대출 보유율이 ${loanRate.toFixed(1)}%로 매우 높습니다. `;
      if (avgLoan >= 4) {
        analysis += `가구당 평균 대출액이 ${avgLoan.toFixed(1)}억원으로 상당한 수준입니다. 재건축 시 추가 분담금 조달에 어려움을 겪을 수 있으므로, 금융기관과의 협약을 통한 금리 우대, 분할 납부 옵션 등 다양한 금융 지원 방안을 마련해야 합니다.`;
      } else {
        analysis += `가구당 평균 대출액은 ${avgLoan.toFixed(1)}억원으로 관리 가능한 수준입니다. 그러나 대출 보유자 비율이 높으므로 금융 부담 완화 방안을 고려해야 합니다.`;
      }
    } else if (loanRate >= 40) {
      analysis = `대출 보유율이 ${loanRate.toFixed(1)}%로 적정 수준입니다. 가구당 평균 대출액은 ${avgLoan.toFixed(1)}억원으로, 추가 분담금 조달 시 일부 조합원에게는 부담이 될 수 있으나 전반적으로는 안정적인 편입니다.`;
    } else {
      analysis = `대출 보유율이 ${loanRate.toFixed(1)}%로 낮고, 가구당 평균 대출액도 ${avgLoan.toFixed(1)}억원으로 낮은 편입니다. 재정적 여유가 있는 조합원이 많아 추가 분담금 납부 여력이 충분할 것으로 보입니다.`;
    }
    
    return analysis;
  }
  
  function analyzeArea(stats) {
    if (!stats.areaData || stats.areaData.length === 0) return '면적 데이터가 부족합니다.';
    
    const dominant = stats.areaData.reduce((max, area) => 
      area.count > max.count ? area : max
    );
    
    return `${dominant.range}가 ${dominant.percentage}%로 가장 많은 비중을 차지하고 있습니다. 재건축 설계 시 해당 평형대의 공급을 우선적으로 고려하고, 조합원 선호도 조사를 통해 평형 구성을 최적화해야 합니다.`;
  }
  
  function analyzeOwnership(stats) {
    if (!stats.ownershipPeriodData || stats.ownershipPeriodData.length === 0) {
      return '보유 기간 데이터가 부족합니다.';
    }
    
    // 10년 이상 장기 보유자 계산
    const longTerm = stats.ownershipPeriodData
      .filter(p => {
        if (p.period === '20년 이상') return true;
        const years = parseInt(p.period);
        return !isNaN(years) && years >= 10;
      })
      .reduce((sum, p) => sum + p.count, 0);
    
    const longTermRate = ((longTerm / stats.total) * 100).toFixed(1);
    
    if (longTermRate >= 50) {
      return `10년 이상 장기 보유자가 ${longTermRate}%로 과반을 차지합니다. 재건축에 대한 기대가 높고 사업 추진 의지가 강할 것으로 예상됩니다. 장기 거주자들의 의견을 적극 수렴하여 사업 추진 동력으로 활용할 수 있습니다.`;
    } else if (longTermRate >= 30) {
      return `10년 이상 장기 보유자가 ${longTermRate}%입니다. 장기 거주자와 최근 입주자의 기대가 다를 수 있으므로, 양측의 의견을 균형있게 반영해야 합니다.`;
    } else {
      return `10년 이상 장기 보유자가 ${longTermRate}%로 상대적으로 적습니다. 최근 취득자가 많아 단기 투자 수익에 대한 관심이 높을 수 있으며, 재건축 일정과 예상 수익률에 대한 명확한 정보 제공이 중요합니다.`;
    }
  }
  
  function generateRuleBasedInsights(stats) {
    const residenceRate = (stats.residenceCount / stats.total) * 100;
    const loanRate = parseFloat(stats.loanStatusData?.[0]?.percentage || 0);
    
    return `
  ### 조합원 구성의 특징
  
  실거주율 ${residenceRate.toFixed(1)}%, 대출 보유율 ${loanRate}%로 ${residenceRate >= 50 ? '실거주 중심' : '투자 중심'} 단지입니다. ${loanRate >= 60 ? '금융 부담이 있는 편이며' : '재정 여력이 있는 편이며'}, 이는 재건축 추진 시 ${residenceRate >= 60 ? '주거 안정성' : '투자 수익성'}을 우선적으로 고려해야 함을 의미합니다.
  
  ### 재건축 추진 시 핵심 고려사항
  
  1. **의사결정 구조**: ${residenceRate >= 60 ? '실거주자 중심의 의견 수렴이 필요하며, 임시 거주 대책을 최우선으로 고려해야 합니다' : '실거주자와 투자자 간 이해관계를 조율하는 세심한 소통 전략이 필요합니다'}
  
  2. **금융 부담 관리**: ${loanRate >= 60 ? '분담금 조달 지원 방안이 필수적입니다. 금융기관 협약을 통한 금리 우대, 분할 납부 등 다양한 옵션을 제공해야 합니다' : '대부분의 조합원이 안정적인 추가 분담금 조달이 가능할 것으로 예상됩니다'}
  
  3. **임시 거주 대책**: ${residenceRate >= 60 ? '실거주자가 많아 임시 거주 대책이 핵심 이슈입니다. 인근 임대 주택 확보, 이주비 지원 등 구체적인 계획이 필요합니다' : '일부 조합원을 대상으로 선택적 지원을 제공하면 됩니다'}
  
  4. **소통 전략**: 정기적인 설명회 개최, 투명한 정보 공개, 단계별 진행 상황 보고를 통해 조합원 신뢰를 구축해야 합니다
  
  ### 실무 제언
  
  1. **단계적 추진**: 사전 타당성 검토 → 조합원 의견 수렴 → 조합 설립 → 정관 작성 → 사업 시행 순으로 체계적으로 진행
  
  2. **전문가 활용**: 법률, 회계, 건축, 금융 전문가로 구성된 자문단을 운영하여 전문성 확보
  
  3. **리스크 관리**: 분양가 변동, 공사 지연, 법적 분쟁 등에 대한 시나리오별 대응책을 사전에 마련
  
  4. **투명성 확보**: 모든 의사결정 과정과 재정 집행 내역을 투명하게 공개하여 조합원 신뢰 확보
  
  5. **지속적 소통**: 온라인 플랫폼, 정기 뉴스레터, 분기별 총회 등 다양한 채널을 통한 소통 강화
  `;
  }
  
  // ========================================
  // 테이블 생성 함수들
  // ========================================
  
  function generateAgeTable(stats) {
    if (!stats.ageData || stats.ageData.length === 0) return '연령 데이터가 없습니다.';
    
    let table = '\n| 연령대 | 인원 | 비율 |\n|--------|------|------|\n';
    stats.ageData.forEach(age => {
      const ratio = ((age.count / stats.total) * 100).toFixed(1);
      table += `| ${age.range} | ${age.count}명 | ${ratio}% |\n`;
    });
    return table;
  }
  
  function generateRegionTable(stats) {
    if (!stats.regionData || stats.regionData.length === 0) return '지역 데이터가 없습니다.';
    
    let table = '\n| 지역 | 인원 | 비율 |\n|------|------|------|\n';
    stats.regionData.slice(0, 10).forEach(region => {
      const ratio = ((region.count / stats.investmentCount) * 100).toFixed(1);
      table += `| ${region.region} | ${region.count}명 | ${ratio}% |\n`;
    });
    return table;
  }
  
  function generateLoanTable(stats) {
    if (!stats.loanAmountData || stats.loanAmountData.length === 0) return '대출 데이터가 없습니다.';
    
    let table = '\n| 대출 구간 | 세대수 |\n|-----------|--------|\n';
    stats.loanAmountData.forEach(loan => {
      table += `| ${loan.range} | ${loan.count}세대 |\n`;
    });
    return table;
  }
  
  function generateAreaTable(stats) {
    if (!stats.areaData || stats.areaData.length === 0) return '면적 데이터가 없습니다.';
    
    let table = '\n| 면적 | 세대수 | 비율 |\n|------|--------|------|\n';
    stats.areaData.forEach(area => {
      table += `| ${area.range} | ${area.count}세대 | ${area.percentage}% |\n`;
    });
    return table;
  }
  
  function generateOwnershipTable(stats) {
    if (!stats.ownershipPeriodData || stats.ownershipPeriodData.length === 0) return '보유 기간 데이터가 없습니다.';
    
    let table = '\n| 보유 기간 | 세대수 |\n|-----------|--------|\n';
    stats.ownershipPeriodData.slice(0, 10).forEach(period => {
      table += `| ${period.period} | ${period.count}세대 |\n`;
    });
    return table;
  }
  
  function generateTransferTable(stats) {
    if (!stats.transferReasonData || stats.transferReasonData.length === 0) return '이전 원인 데이터가 없습니다.';
    
    let table = '\n| 이전 원인 | 건수 | 비율 |\n|-----------|------|------|\n';
    stats.transferReasonData.forEach(reason => {
      table += `| ${reason.reason} | ${reason.count}건 | ${reason.percentage}% |\n`;
    });
    return table;
  }
  
  // ========================================
  // 다운로드 함수들
  // ========================================
  
  /**
   * Markdown 다운로드
   */
  export function downloadAsMarkdown(content, filename = '재건축분석보고서') {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  /**
   * HTML 다운로드
   */
  export function downloadAsHTML(content, filename = '재건축분석보고서') {
    let html = content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>');
  
    const fullHTML = `
  <!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8">
    <title>${filename}</title>
    <style>
      body { 
        font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; 
        max-width: 900px; 
        margin: 40px auto; 
        padding: 20px; 
        line-height: 1.8; 
        color: #333;
      }
      h1 { 
        color: #1a202c; 
        border-bottom: 3px solid #10b981; 
        padding-bottom: 10px;
        margin-top: 40px;
      }
      h2 { 
        color: #2d3748; 
        margin-top: 40px; 
        border-bottom: 2px solid #e2e8f0; 
        padding-bottom: 8px; 
      }
      h3 { 
        color: #4a5568; 
        margin-top: 30px; 
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 20px 0; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      th, td { 
        border: 1px solid #e2e8f0; 
        padding: 12px; 
        text-align: left; 
      }
      th { 
        background-color: #10b981; 
        color: white; 
        font-weight: bold; 
      }
      tr:nth-child(even) { 
        background-color: #f7fafc; 
      }
      tr:hover {
        background-color: #edf2f7;
      }
      strong { 
        color: #10b981;
        font-weight: 600;
      }
      p {
        margin: 10px 0;
      }
      @media print { 
        body { margin: 0; }
        h1 { page-break-before: always; }
      }
    </style>
  </head>
  <body>
    ${html}
  </body>
  </html>
    `;
  
    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }