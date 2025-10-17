class DataAnalysisService {
  analyzeData(data, activeTab = '전체통계') {
    try {
      // 데이터 필터링
      const filteredData = activeTab === '전체통계' ? data : 
        data.filter(row => {
          if (!row.건물명) return false;
          const buildingName = activeTab.replace('대교아파트 ', '');
          return row.건물명.includes(buildingName);
        });

      // 기본 통계 계산
      const total = filteredData.length;
      
      // 나이대별 분포
      const ageGroups = this.calculateAgeDistribution(filteredData);
      
      // 대출 현황
      const loanStatus = this.calculateLoanStatus(filteredData);
      
      // 압류/가압류 현황
      const seizureStatus = this.calculateSeizureStatus(filteredData);
      
      // 소유권 변동 분석
      const ownershipChanges = this.calculateOwnershipChanges(filteredData);
      
      // 면적별 분포
      const areaDistribution = this.calculateAreaDistribution(filteredData);

      return {
        total,
        ageGroups,
        loanStatus,
        seizureStatus,
        ownershipChanges,
        areaDistribution,
        activeTab
      };
    } catch (error) {
      throw new Error(`데이터 분석 실패: ${error.message}`);
    }
  }

  calculateAgeDistribution(data) {
    const ageGroups = {};
    
    data.forEach(row => {
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
    
    return ageGroups;
  }

  calculateLoanStatus(data) {
    const loanCount = data.filter(row => {
      if (!row.유효근저당총액) return false;
      const amount = parseFloat(row.유효근저당총액);
      return !isNaN(amount) && amount > 0;
    }).length;
    
    const noLoanCount = data.length - loanCount;
    
    return {
      loanCount,
      noLoanCount,
      loanRate: data.length > 0 ? (loanCount / data.length * 100).toFixed(1) : 0
    };
  }

  calculateSeizureStatus(data) {
    const seizureCount = data.filter(row => {
      const seizure = row['압류가압류유무'] || 'N';
      return seizure === 'Y' || seizure === '1' || seizure === 'true';
    }).length;
    
    const normalCount = data.length - seizureCount;
    
    return {
      seizureCount,
      normalCount,
      seizureRate: data.length > 0 ? (seizureCount / data.length * 100).toFixed(1) : 0
    };
  }

  calculateOwnershipChanges(data) {
    const changes = {};
    
    data.forEach(row => {
      if (row.이전사유) {
        const reason = row.이전사유.trim();
        if (reason) {
          changes[reason] = (changes[reason] || 0) + 1;
        }
      }
    });
    
    return changes;
  }

  calculateAreaDistribution(data) {
    const areas = {};
    
    data.forEach(row => {
      if (row.전용면적_제곱미터) {
        const area = parseFloat(row.전용면적_제곱미터);
        if (!isNaN(area)) {
          const areaGroup = this.getAreaGroup(area);
          areas[areaGroup] = (areas[areaGroup] || 0) + 1;
        }
      }
    });
    
    return areas;
  }

  getAreaGroup(area) {
    if (area < 60) return '60㎡ 미만';
    else if (area < 85) return '60-85㎡';
    else if (area < 102) return '85-102㎡';
    else if (area < 135) return '102-135㎡';
    else return '135㎡ 이상';
  }

  generateSummary(data) {
    const analysis = this.analyzeData(data);
    
    return {
      totalCount: analysis.total,
      ageDistribution: analysis.ageGroups,
      loanRate: analysis.loanStatus.loanRate,
      seizureRate: analysis.seizureStatus.seizureRate,
      ownershipChanges: analysis.ownershipChanges,
      areaDistribution: analysis.areaDistribution
    };
  }
}

module.exports = new DataAnalysisService();
