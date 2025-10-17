const axios = require('axios');

class AIReportService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generateReport(data, activeTab) {
    try {
      // 데이터 분석
      const analysis = this.analyzeDataForReport(data, activeTab);
      
      // AI 프롬프트 생성
      const prompt = this.generatePrompt(analysis, activeTab);
      
      // Gemini API 호출
      const report = await this.callGeminiAPI(prompt);
      
      return report;
    } catch (error) {
      throw new Error(`AI 리포트 생성 실패: ${error.message}`);
    }
  }

  analyzeDataForReport(data, activeTab) {
    const filteredData = activeTab === '전체통계' ? data : 
      data.filter(row => {
        if (!row.건물명) return false;
        const buildingName = activeTab.replace('대교아파트 ', '');
        return row.건물명.includes(buildingName);
      });

    const total = filteredData.length;
    
    // 나이대별 분포
    const ageGroups = {};
    filteredData.forEach(row => {
      if (row.주민번호 && row.주민번호.length >= 7) {
        const birthYear = parseInt(row.주민번호.substring(0, 2));
        const currentYear = new Date().getFullYear();
        let fullBirthYear;
        
        if (birthYear <= 30) {
          fullBirthYear = 2000 + birthYear;
        } else {
          fullBirthYear = 1900 + birthYear;
        }
        
        const age = currentYear - fullBirthYear;
        let ageGroup;
        
        if (age < 20) ageGroup = '10대';
        else if (age < 30) ageGroup = '20대';
        else if (age < 40) ageGroup = '30대';
        else if (age < 50) ageGroup = '40대';
        else if (age < 60) ageGroup = '50대';
        else if (age < 70) ageGroup = '60대';
        else if (age < 80) ageGroup = '70대';
        else if (age < 90) ageGroup = '80대';
        else ageGroup = '90대';
        
        ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + 1;
      }
    });

    // 대출 현황
    const loanCount = filteredData.filter(row => {
      if (!row.유효근저당총액) return false;
      const amount = parseFloat(row.유효근저당총액);
      return !isNaN(amount) && amount > 0;
    }).length;

    // 압류/가압류 현황
    const seizureCount = filteredData.filter(row => {
      const seizure = row['압류가압류유무'] || 'N';
      return seizure === 'Y' || seizure === '1' || seizure === 'true';
    }).length;

    // 소유권 변동
    const ownershipChanges = {};
    filteredData.forEach(row => {
      if (row.이전사유) {
        const reason = row.이전사유.trim();
        if (reason) {
          ownershipChanges[reason] = (ownershipChanges[reason] || 0) + 1;
        }
      }
    });

    return {
      total,
      ageGroups,
      loanCount,
      loanRate: total > 0 ? (loanCount / total * 100).toFixed(1) : 0,
      seizureCount,
      seizureRate: total > 0 ? (seizureCount / total * 100).toFixed(1) : 0,
      ownershipChanges,
      activeTab
    };
  }

  generatePrompt(analysis, activeTab) {
    return `
다음은 재건축 아파트의 실제 데이터 분석 결과입니다. 이 데이터를 바탕으로 시공사 관점에서 전문적이고 실무적인 분석 보고서를 작성해주세요.

## 📊 데이터 분석 결과

### 기본 정보
- 분석 대상: ${analysis.activeTab}
- 총 세대수: ${analysis.total}세대

### 나이대별 분포
${Object.entries(analysis.ageGroups).map(([age, count]) => 
  `- ${age}: ${count}세대 (${((count/analysis.total)*100).toFixed(1)}%)`
).join('\n')}

### 대출 현황
- 대출 세대: ${analysis.loanCount}세대 (${analysis.loanRate}%)
- 무대출 세대: ${analysis.total - analysis.loanCount}세대 (${(100 - parseFloat(analysis.loanRate)).toFixed(1)}%)

### 압류/가압류 현황
- 정상 세대: ${analysis.total - analysis.seizureCount}세대 (${(100 - parseFloat(analysis.seizureRate)).toFixed(1)}%)
- 압류/가압류 세대: ${analysis.seizureCount}세대 (${analysis.seizureRate}%)

### 소유권 변동 현황
${Object.entries(analysis.ownershipChanges).map(([reason, count]) => 
  `- ${reason}: ${count}건 (${((count/analysis.total)*100).toFixed(1)}%)`
).join('\n')}

## 📋 보고서 작성 요구사항

위 실제 데이터를 바탕으로 다음 구조의 전문가 수준 보고서를 작성해주세요:

1. **개요** - 프로젝트 기본 정보와 분석 목적
2. **주민 구성 분석** - 나이대별 분포와 특성 분석
3. **금융 현황 분석** - 대출 현황과 리스크 평가
4. **법적 리스크 분석** - 압류/가압류 현황과 조합 설립 시 주의사항
5. **소유권 변동 분석** - 거래 패턴과 시장 동향
6. **종합 평가** - 핵심 지표 요약과 시공사 전략 제언
7. **결론** - 긍정적 요인과 리스크 요인 구분

**중요 지침:**
- 제공된 실제 데이터만을 사용하여 분석
- 시공사 관점의 실무적 인사이트 제공
- 구체적인 수치와 비율 활용
- 실행 가능한 전략 제언
- 전문적이고 객관적인 톤 유지
`;
  }

  async callGeminiAPI(prompt) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      throw new Error(`Gemini API 호출 실패: ${error.message}`);
    }
  }

  async getTemplates() {
    return [
      {
        id: 'standard',
        name: '표준 분석 보고서',
        description: '기본적인 데이터 분석과 시공사 전략 제언'
      },
      {
        id: 'detailed',
        name: '상세 분석 보고서',
        description: '심화 분석과 리스크 평가 포함'
      },
      {
        id: 'executive',
        name: '경영진 보고서',
        description: '핵심 지표 중심의 간결한 보고서'
      }
    ];
  }
}

module.exports = new AIReportService();
