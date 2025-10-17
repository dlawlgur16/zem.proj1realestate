import React, { useState, useMemo } from 'react';
import AgeDistribution from './Charts/AgeDistribution';
import LoanStatus from './Charts/LoanStatus';
import SeizureStatus from './Charts/SeizureStatus';
import AreaDistribution from './Charts/AreaDistribution';
import ResidenceInvestment from './Charts/ResidenceInvestment';
import GenderDistribution from './Charts/GenderDistribution';
import HoldingPeriod from './Charts/HoldingPeriod';
import TransferReason from './Charts/TransferReason';
import LoanAmount from './Charts/LoanAmount';
import YearlyOwnership from './Charts/YearlyOwnership';
import './DataAnalysis.css';
import './Charts/ChartCard.css';

const DataAnalysis = ({ csvData, activeTab, setActiveTab }) => {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('전체');
  const [selectedAgeGroupLoan, setSelectedAgeGroupLoan] = useState('전체');
  const [selectedAgeGroupLoanAmount, setSelectedAgeGroupLoanAmount] = useState('전체');
  const [selectedAgeGroupSeizure, setSelectedAgeGroupSeizure] = useState('전체');
  const [selectedAgeGroupHolding, setSelectedAgeGroupHolding] = useState('전체');
  const [selectedAgeGroupTransfer, setSelectedAgeGroupTransfer] = useState('전체');
  const [selectedAgeGroupGender, setSelectedAgeGroupGender] = useState('전체');
  const [selectedAgeGroupResidence, setSelectedAgeGroupResidence] = useState('전체');
  const [selectedAgeGroupArea, setSelectedAgeGroupArea] = useState('전체');
  const [selectedAgeGroupYearly, setSelectedAgeGroupYearly] = useState('전체');

  const calculateStats = (data) => {
    const total = data.length;
    
    // 나이대별 분포 (주민번호 분석)
    const ageGroups = {};
    data.forEach(row => {
      const residentNumber = getColumnValue(row, ['주민번호', '주민등록번호', 'resident_number', '주민등록번호']);
      if (residentNumber && residentNumber.length >= 7) {
        try {
          const birthYear = parseInt(residentNumber.substring(0, 2));
          const birthMonth = parseInt(residentNumber.substring(2, 4));
          const currentYear = new Date().getFullYear();
          let fullBirthYear;
          
          // 2000년대 출생자 구분 (더 정확한 로직)
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
          
          // 디버깅을 위한 로그
          console.log(`주민번호: ${residentNumber}, 출생년도: ${fullBirthYear}, 나이: ${age}, 나이대: ${ageGroup}`);
        } catch (error) {
          console.error('주민번호 분석 오류:', error, residentNumber);
        }
      }
    });

    // 성별 분포 (주민번호 분석)
    const genderGroups = {};
    data.forEach(row => {
      const residentNumber = getColumnValue(row, ['주민번호', '주민등록번호', 'resident_number', '주민등록번호']);
      if (residentNumber && residentNumber.length >= 7) {
        try {
          const genderCode = parseInt(residentNumber.substring(7,8));
          const gender = genderCode % 2 === 0 ? '여' : '남';
          genderGroups[gender] = (genderGroups[gender] || 0) + 1;
          
          // 디버깅을 위한 로그
          console.log(`주민번호: ${residentNumber}, 성별코드: ${genderCode}, 성별: ${gender}`);
        } catch (error) {
          console.error('성별 분석 오류:', error, residentNumber);
        }
      }
    });
    
    // 성별 분석 결과 디버깅
    console.log('성별 분석 결과:', genderGroups);
    console.log('총 데이터 수:', data.length);
    console.log('주민번호가 있는 데이터 수:', data.filter(row => {
      const residentNumber = getColumnValue(row, ['주민번호', '주민등록번호', 'resident_number', '주민등록번호']);
      return residentNumber && residentNumber.length >= 7;
    }).length);

    // 거주/투자 비율
    const residenceCount = data.filter(row => {
      const residence = row['실거주여부'] || row['거주여부'] || '';
      return residence === 'Y' || residence === '1' || residence === 'true' || residence.includes('거주');
    }).length;
    const investmentCount = total - residenceCount;

    // 면적별 분포 (소수점 2자리)
    const areaGroups = {};
    data.forEach(row => {
      if (row.전용면적_제곱미터) {
        const area = parseFloat(row.전용면적_제곱미터);
        if (!isNaN(area)) {
          // 면적을 소수점 2자리까지 표시
          const roundedArea = parseFloat(area.toFixed(2));
          const areaKey = `${roundedArea}㎡`;
          
          areaGroups[areaKey] = (areaGroups[areaKey] || 0) + 1;
        }
      }
    });

    // 보유기간별 분포 (1년 단위)
    const holdingGroups = {};
    data.forEach(row => {
      if (row.보유기간_년) {
        const years = parseInt(row.보유기간_년);
        if (!isNaN(years)) {
          let periodGroup;
          if (years < 1) periodGroup = '1년 미만';
          else if (years < 2) periodGroup = '1년';
          else if (years < 3) periodGroup = '2년';
          else if (years < 4) periodGroup = '3년';
          else if (years < 5) periodGroup = '4년';
          else if (years < 6) periodGroup = '5년';
          else if (years < 7) periodGroup = '6년';
          else if (years < 8) periodGroup = '7년';
          else if (years < 9) periodGroup = '8년';
          else if (years < 10) periodGroup = '9년';
          else if (years < 11) periodGroup = '10년';
          else if (years < 12) periodGroup = '11년';
          else if (years < 13) periodGroup = '12년';
          else if (years < 14) periodGroup = '13년';
          else if (years < 15) periodGroup = '14년';
          else if (years < 16) periodGroup = '15년';
          else if (years < 17) periodGroup = '16년';
          else if (years < 18) periodGroup = '17년';
          else if (years < 19) periodGroup = '18년';
          else if (years < 20) periodGroup = '19년';
          else if (years < 21) periodGroup = '20년';
          else if (years < 22) periodGroup = '21년';
          else if (years < 23) periodGroup = '22년';
          else if (years < 24) periodGroup = '23년';
          else if (years < 25) periodGroup = '24년';
          else if (years < 26) periodGroup = '25년';
          else if (years < 27) periodGroup = '26년';
          else if (years < 28) periodGroup = '27년';
          else if (years < 29) periodGroup = '28년';
          else if (years < 30) periodGroup = '29년';
          else periodGroup = '30년 이상';
          
          holdingGroups[periodGroup] = (holdingGroups[periodGroup] || 0) + 1;
        }
      }
    });

    // 등기이전원인별 분포
    const transferReasons = {};
    data.forEach(row => {
      if (row.이전사유) {
        const reason = row.이전사유.trim();
        if (reason) {
          transferReasons[reason] = (transferReasons[reason] || 0) + 1;
        }
      }
    });

    // 연도별 소유권 변동
    const yearlyOwnership = {};
    data.forEach(row => {
      if (row.소유권취득일) {
        const date = new Date(row.소유권취득일);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear().toString();
          yearlyOwnership[year] = (yearlyOwnership[year] || 0) + 1;
        }
      }
    });

    // 대출금액대별 분포
    const loanAmountGroups = {};
    data.forEach(row => {
      if (row.유효근저당총액) {
        const amount = parseFloat(row.유효근저당총액);
        if (!isNaN(amount) && amount > 0) {
          let amountGroup;
          if (amount < 100000000) amountGroup = '1억 미만';
          else if (amount < 200000000) amountGroup = '1억대';
          else if (amount < 300000000) amountGroup = '2억대';
          else if (amount < 400000000) amountGroup = '3억대';
          else if (amount < 500000000) amountGroup = '4억대';
          else if (amount < 600000000) amountGroup = '5억대';
          else if (amount < 700000000) amountGroup = '6억대';
          else if (amount < 800000000) amountGroup = '7억대';
          else if (amount < 900000000) amountGroup = '8억대';
          else if (amount < 1000000000) amountGroup = '9억대';
          else amountGroup = '10억 이상';
          
          loanAmountGroups[amountGroup] = (loanAmountGroups[amountGroup] || 0) + 1;
        }
      }
    });

    // 대출 여부 비율
    const loanCount = data.filter(row => {
      if (!row.유효근저당총액) return false;
      const amount = parseFloat(row.유효근저당총액);
      return !isNaN(amount) && amount > 0;
    }).length;
    const noLoanCount = total - loanCount;

    // 압류/가압류 현황
    const seizureCount = data.filter(row => {
      const seizure = row['압류가압류유무'] || 'N';
      return seizure === 'Y' || seizure === '1' || seizure === 'true';
    }).length;
    const normalCount = total - seizureCount;

    return {
      total,
      ageGroups,
      genderGroups,
      residenceCount,
      investmentCount,
      areaGroups,
      holdingGroups,
      transferReasons,
      yearlyOwnership,
      loanAmountGroups,
      loanCount,
      noLoanCount,
      seizureCount,
      normalCount,
      loanStatusData: [
        { name: '대출', value: loanCount, color: '#ef4444' },
        { name: '무대출', value: noLoanCount, color: '#10b981' }
      ],
      seizureStatusData: [
        { name: '정상', value: normalCount, color: '#10b981' },
        { name: '압류/가압류', value: seizureCount, color: '#ef4444' }
      ],
      residenceInvestmentData: [
        { name: '거주', value: residenceCount, color: '#10b981' },
        { name: '투자', value: investmentCount, color: '#3b82f6' }
      ],
      genderData: [
        { name: '남', value: genderGroups['남'] || 0, color: '#3b82f6' },
        { name: '여', value: genderGroups['여'] || 0, color: '#ec4899' }
      ].filter(item => item.value > 0) // 값이 0인 항목은 제외
    };
  };

  // 기본 필터링 (건물별)
  const baseFilteredData = useMemo(() => {
    if (!csvData || csvData.length === 0) return [];
    
    return activeTab === '전체통계' ? csvData : 
      csvData.filter(row => {
        if (!row.건물명) return false;
        const buildingName = activeTab.replace('대교아파트 ', '');
        return row.건물명.includes(buildingName);
      });
  }, [csvData, activeTab]);

  // CSV 컬럼명 매핑 함수 (전역 사용)
  const getColumnValue = (row, possibleNames) => {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return row[name];
      }
    }
    return null;
  };

  // 나이대별 필터링 함수 (주민번호 기반)
  const filterByAge = (data, ageGroup) => {
    if (ageGroup === '전체') return data;
    
    const filtered = data.filter(row => {
      const residentNumber = getColumnValue(row, ['주민번호', '주민등록번호', 'resident_number', '주민등록번호']);
      if (!residentNumber || residentNumber.length < 7) return false;
      
      try {
        const birthYear = parseInt(residentNumber.substring(0, 2));
        const currentYear = new Date().getFullYear();
        let fullBirthYear;
        
        if (birthYear <= 30) {
          fullBirthYear = 2000 + birthYear;
        } else {
          fullBirthYear = 1900 + birthYear;
        }
        
        const age = currentYear - fullBirthYear;
        
        switch (ageGroup) {
          case '20대': return age >= 20 && age < 30;
          case '30대': return age >= 30 && age < 40;
          case '40대': return age >= 40 && age < 50;
          case '50대': return age >= 50 && age < 60;
          case '60대': return age >= 60 && age < 70;
          case '70대': return age >= 70 && age < 80;
          case '80대': return age >= 80 && age < 90;
          case '90대': return age >= 90;
          default: return true;
        }
      } catch (error) {
        console.error('나이대 필터링 오류:', error, residentNumber);
        return false;
      }
    });
    
    console.log(`나이대 필터링: ${ageGroup}, 원본: ${data.length}, 필터링 후: ${filtered.length}`);
    return filtered;
  };

  // 통계 데이터 계산
  const currentStats = useMemo(() => {
    return calculateStats(baseFilteredData);
  }, [baseFilteredData]);

  if (!csvData || csvData.length === 0) {
    return (
      <div className="data-analysis">
        <div className="data-analysis__empty">
          <p>분석할 데이터가 없습니다. CSV 파일을 업로드해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-analysis">
      <div className="data-analysis__header">
        <h2 className="data-analysis__title">데이터 분석</h2>
        <div className="data-analysis__tabs">
          {['전체통계', '대교아파트 1동', '대교아파트 2동', '대교아파트 3동', '대교아파트 4동'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`data-analysis__tab ${
                activeTab === tab ? 'data-analysis__tab--active' : ''
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="data-analysis__grid">
        <AgeDistribution 
          data={currentStats.ageGroups} 
          total={currentStats.total}
          selectedAgeGroup={selectedAgeGroup}
          setSelectedAgeGroup={setSelectedAgeGroup}
        />
        
        <ResidenceInvestment 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupResidence)).residenceInvestmentData}
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupResidence)).total}
          selectedAgeGroup={selectedAgeGroupResidence}
          setSelectedAgeGroup={setSelectedAgeGroupResidence}
        />
        
        <AreaDistribution 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupArea)).areaGroups} 
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupArea)).total}
          selectedAgeGroup={selectedAgeGroupArea}
          setSelectedAgeGroup={setSelectedAgeGroupArea}
        />
        
        <HoldingPeriod 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupHolding)).holdingGroups} 
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupHolding)).total}
          selectedAgeGroup={selectedAgeGroupHolding}
          setSelectedAgeGroup={setSelectedAgeGroupHolding}
        />
        
        <TransferReason 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupTransfer)).transferReasons} 
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupTransfer)).total}
          selectedAgeGroup={selectedAgeGroupTransfer}
          setSelectedAgeGroup={setSelectedAgeGroupTransfer}
        />
        
        <LoanAmount 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupLoanAmount)).loanAmountGroups} 
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupLoanAmount)).loanCount}
          selectedAgeGroup={selectedAgeGroupLoanAmount}
          setSelectedAgeGroup={setSelectedAgeGroupLoanAmount}
        />
        
        <LoanStatus 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupLoan)).loanStatusData}
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupLoan)).total}
          selectedAgeGroup={selectedAgeGroupLoan}
          setSelectedAgeGroup={setSelectedAgeGroupLoan}
        />
        
        <SeizureStatus 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupSeizure)).seizureStatusData}
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupSeizure)).total}
          selectedAgeGroup={selectedAgeGroupSeizure}
          setSelectedAgeGroup={setSelectedAgeGroupSeizure}
        />
        
        <GenderDistribution 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupGender)).genderData}
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupGender)).total}
          selectedAgeGroup={selectedAgeGroupGender}
          setSelectedAgeGroup={setSelectedAgeGroupGender}
        />
        
        <YearlyOwnership 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupYearly)).yearlyOwnership} 
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupYearly)).total}
          selectedAgeGroup={selectedAgeGroupYearly}
          setSelectedAgeGroup={setSelectedAgeGroupYearly}
        />
      </div>
    </div>
  );
};

export default DataAnalysis;
