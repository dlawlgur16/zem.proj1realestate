import React, { useState, useMemo, useEffect } from 'react';
import AgeDistribution from './Charts/AgeDistribution';
import LoanStatus from './Charts/LoanStatus';
import SeizureStatus from './Charts/SeizureStatus';
import AreaDistribution from './Charts/AreaDistribution';
import ResidenceInvestment from './Charts/ResidenceInvestment';
import HoldingPeriod from './Charts/HoldingPeriod';
import TransferReason from './Charts/TransferReason';
import LoanAmount from './Charts/LoanAmount';
import InvestorResidence from './Charts/InvestorResidence';
import YearlyOwnership from './Charts/YearlyOwnership';
import { calculateAgeInsights } from '../../utils/ageInsights';
import './DataAnalysis.css';
import './Charts/ChartCard.css';

const DataAnalysis = ({ csvData, activeTab, setActiveTab, onStatsUpdate }) => {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('전체');
  const [selectedAgeGroupLoan, setSelectedAgeGroupLoan] = useState('전체');
  const [selectedAgeGroupLoanAmount, setSelectedAgeGroupLoanAmount] = useState('전체');
  const [selectedAgeGroupSeizure, setSelectedAgeGroupSeizure] = useState('전체');
  const [selectedAgeGroupHolding, setSelectedAgeGroupHolding] = useState('전체');
  const [selectedAgeGroupTransfer, setSelectedAgeGroupTransfer] = useState('전체');
  const [selectedAgeGroupResidence, setSelectedAgeGroupResidence] = useState('전체');
  const [selectedAgeGroupArea, setSelectedAgeGroupArea] = useState('전체');
  const [selectedAgeGroupYearly, setSelectedAgeGroupYearly] = useState('전체');
 
  // 동별 탭을 동적으로 생성하는 함수
  const generateDongTabs = (data) => {
    const dongSet = new Set();
    
    data.forEach(row => {
      // 건물명에서 동 정보 추출 (예: "대교아파트 1동 101호" -> "대교아파트 1동")
      const buildingName = row.건물명 || '';
      if (buildingName) {
        const dongMatch = buildingName.match(/(대교아파트\s*\d+동)/);
        if (dongMatch) {
          dongSet.add(dongMatch[1]);
        }
      }
    });
    
    // 동을 번호 순으로 정렬
    const sortedDongs = Array.from(dongSet).sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
      const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
      return aNum - bNum;
    });
    
    return ['전체통계', ...sortedDongs];
  };

  // 동별 필터링 함수
  const filterByDong = (data, selectedDong) => {
    if (selectedDong === '전체통계') {
      return data;
    }
    
    return data.filter(row => {
      const buildingName = row.건물명 || '';
      if (buildingName) {
        // 건물명에서 동 정보 추출하여 선택된 동과 비교
        const dongMatch = buildingName.match(/(대교아파트\s*\d+동)/);
        return dongMatch && dongMatch[1] === selectedDong;
      }
      return false;
    });
  };

  const calculateStats = (data) => {
    const total = data.length;
    
    // 나이대별 분포 (주민번호 분석)
    const ageGroups = {};
    data.forEach(row => {
      const residentNumber = getColumnValue(row, ['주민번호', '주민등록번호', 'resident_number', '주민등록번호']);
      if (residentNumber && residentNumber.length >= 7) {
        try {
          const birthYear = parseInt(residentNumber.substring(0, 2));
          // const birthMonth = parseInt(residentNumber.substring(2, 4));
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
               // console.log(`주민번호: ${residentNumber}, 출생년도: ${fullBirthYear}, 나이: ${age}, 나이대: ${ageGroup}`);
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
               // console.log(`주민번호: ${residentNumber}, 성별코드: ${genderCode}, 성별: ${gender}`);
        } catch (error) {
          console.error('성별 분석 오류:', error, residentNumber);
        }
      }
    });
    
    // 성별 분석 결과 디버깅
    // console.log('성별 분석 결과:', genderGroups);
    // console.log('총 데이터 수:', data.length);
    // console.log('주민번호가 있는 데이터 수:', data.filter(row => {
    //   const residentNumber = getColumnValue(row, ['주민번호', '주민등록번호', 'resident_number', '주민등록번호']);
    //   return residentNumber && residentNumber.length >= 7;
    // }).length);

    // 거주/투자 비율 (다양한 표기 허용)
    const isResidence = (value) => {
      const v = String(value ?? '').trim().toLowerCase();
      if (!v) return false;
      // 부분 일치 우선 처리 ("실거주 추정" 등)
      if (v.includes('실거주')) return true;
      if (v.includes('거주')) return true; // "거주", "거주자" 등
      // 정확 일치 토큰
      return ['y','yes','true','1','t','o','ㅇ','예','네','투자아님'].some(tok => v === tok);
    };
    
    // 실거주여부 값들 확인을 위한 디버깅
    const residenceValues = [...new Set(data.map(row => row['실거주여부'] || row['거주여부'] || '').filter(Boolean))];
    console.log('🔍 DataAnalysis 실제 실거주여부 값들:', residenceValues);
    
    const residenceCount = data.filter(row => {
      const residence = row['실거주여부'] || row['거주여부'] || '';
      return isResidence(residence);
    }).length;
    const investmentCount = total - residenceCount;
    
    console.log('🔍 DataAnalysis 실거주 비율:', {
      total,
      residenceCount,
      investmentCount,
      residenceRate: ((residenceCount / total) * 100).toFixed(1) + '%'
    });

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

    // 보유기간별 분포 (4개 구간)
    const holdingGroups = {};
    data.forEach(row => {
      if (row.보유기간_년) {
        const years = parseInt(row.보유기간_년);
        if (!isNaN(years)) {
          let periodGroup;
          if (years < 3) periodGroup = '3년 미만';
          else if (years >= 3 && years < 7) periodGroup = '3~7년';
          else if (years >= 7 && years < 15) periodGroup = '7~15년';
          else periodGroup = '15년 이상';
          
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

    // 투자자 거주지역 분석 (실거주자 제외) - 시/도 단위
    const investorResidence = {};
    let investorCount = 0; // 투자자 수 카운트
    
    data.forEach(row => {
      // 실거주자인지 확인
      const residence = row.실거주여부 || row.거주여부 || '';
      const isResidence = (value) => {
        const v = String(value ?? '').trim().toLowerCase();
        if (!v) return false;
        return [
          '실거주','거주','y','yes','true','1','t','o','ㅇ','예','네','투자아님','거주자','실거주자'
        ].some(tok => v.includes(tok));
      };
      
      // 실거주자가 아닌 경우만 투자자로 간주
      if (!isResidence(residence) && row.현주소) {
        investorCount++; // 투자자 수 증가
        const address = row.현주소.trim();
        if (address) {
          // 시/도 단위로 지역 분류
          let region = '';
          
          // 서울시
          if (address.includes('서울시') || address.includes('서울특별시')) {
            region = '서울시';
          }
          // 경기도
          else if (address.includes('경기도')) {
            region = '경기도';
          }
          // 인천시
          else if (address.includes('인천시') || address.includes('인천광역시')) {
            region = '인천시';
          }
          // 부산시
          else if (address.includes('부산시') || address.includes('부산광역시')) {
            region = '부산시';
          }
          // 대구시
          else if (address.includes('대구시') || address.includes('대구광역시')) {
            region = '대구시';
          }
          // 광주시
          else if (address.includes('광주시') || address.includes('광주광역시')) {
            region = '광주시';
          }
          // 대전시
          else if (address.includes('대전시') || address.includes('대전광역시')) {
            region = '대전시';
          }
          // 울산시
          else if (address.includes('울산시') || address.includes('울산광역시')) {
            region = '울산시';
          }
          // 세종시
          else if (address.includes('세종시') || address.includes('세종특별자치시')) {
            region = '세종시';
          }
          // 강원도
          else if (address.includes('강원도')) {
            region = '강원도';
          }
          // 충청북도
          else if (address.includes('충청북도') || address.includes('충북')) {
            region = '충청북도';
          }
          // 충청남도
          else if (address.includes('충청남도') || address.includes('충남')) {
            region = '충청남도';
          }
          // 전라북도
          else if (address.includes('전라북도') || address.includes('전북')) {
            region = '전라북도';
          }
          // 전라남도
          else if (address.includes('전라남도') || address.includes('전남')) {
            region = '전라남도';
          }
          // 경상북도
          else if (address.includes('경상북도') || address.includes('경북')) {
            region = '경상북도';
          }
          // 경상남도
          else if (address.includes('경상남도') || address.includes('경남')) {
            region = '경상남도';
          }
          // 제주도
          else if (address.includes('제주도') || address.includes('제주특별자치도')) {
            region = '제주도';
          }
          // 해외 지역
          else if (address.includes('미국') || address.includes('USA') || address.includes('United States')) {
            region = '미국';
          }
          else if (address.includes('호주') || address.includes('Australia')) {
            region = '호주';
          }
          else if (address.includes('일본') || address.includes('Japan')) {
            region = '일본';
          }
          else if (address.includes('중국') || address.includes('China')) {
            region = '중국';
          }
          else if (address.includes('캐나다') || address.includes('Canada')) {
            region = '캐나다';
          }
          else if (address.includes('영국') || address.includes('UK') || address.includes('United Kingdom')) {
            region = '영국';
          }
          else if (address.includes('독일') || address.includes('Germany')) {
            region = '독일';
          }
          else if (address.includes('프랑스') || address.includes('France')) {
            region = '프랑스';
          }
          else if (address.includes('이탈리아') || address.includes('Italy')) {
            region = '이탈리아';
          }
          else if (address.includes('스페인') || address.includes('Spain')) {
            region = '스페인';
          }
          else if (address.includes('네덜란드') || address.includes('Netherlands')) {
            region = '네덜란드';
          }
          else if (address.includes('스위스') || address.includes('Switzerland')) {
            region = '스위스';
          }
          else if (address.includes('스웨덴') || address.includes('Sweden')) {
            region = '스웨덴';
          }
          else if (address.includes('노르웨이') || address.includes('Norway')) {
            region = '노르웨이';
          }
          else if (address.includes('덴마크') || address.includes('Denmark')) {
            region = '덴마크';
          }
          else if (address.includes('핀란드') || address.includes('Finland')) {
            region = '핀란드';
          }
          else if (address.includes('해외') || address.includes('외국')) {
            region = '기타 해외';
          }
          // 기타 국내 지역
          else {
            region = '기타 국내';
          }
          
          if (region) {
            investorResidence[region] = (investorResidence[region] || 0) + 1;
          }
        }
      }
    });

    // 대출금액대별 분포
    const loanAmountGroups = {};
    let loanDataCount = 0;
    
    // CSV 컬럼명 확인
    console.log('💰 CSV 컬럼명 확인:', Object.keys(data[0] || {}));
    
    data.forEach(row => {
      // 여러 가능한 컬럼명 확인
      const loanAmount = row.유효근저당총액 || row['유효근저당총액'] || row.근저당총액 || row['근저당총액'] || row.대출금액 || row['대출금액'];
      
      if (loanAmount) {
        const amount = parseFloat(loanAmount);
        if (!isNaN(amount) && amount > 0) {
          loanDataCount++;
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
    
    console.log('💰 근저당 데이터 분석:');
    console.log('💰 총 데이터 수:', data.length);
    console.log('💰 근저당 데이터가 있는 행 수:', loanDataCount);
    console.log('💰 근저당 금액대별 분포:', loanAmountGroups);

    // 대출 여부 비율
    const loanCount = data.filter(row => {
      const loanAmount = row.유효근저당총액 || row['유효근저당총액'] || row.근저당총액 || row['근저당총액'] || row.대출금액 || row['대출금액'];
      if (!loanAmount) return false;
      const amount = parseFloat(loanAmount);
      return !isNaN(amount) && amount > 0;
    }).length;
    const noLoanCount = total - loanCount;
    
    console.log('💰 대출 여부 분석:');
    console.log('💰 대출 있는 건수:', loanCount);
    console.log('💰 대출 없는 건수:', noLoanCount);
    console.log('💰 대출 비율:', ((loanCount / total) * 100).toFixed(1) + '%');

    // 총 근저당액과 평균 근저당액 계산
    let totalLoanAmount = 0;
    let validLoanCount = 0;
    
    data.forEach(row => {
      const loanAmount = row.유효근저당총액 || row['유효근저당총액'] || row.근저당총액 || row['근저당총액'] || row.대출금액 || row['대출금액'];
      if (loanAmount) {
        const amount = parseFloat(loanAmount);
        if (!isNaN(amount) && amount > 0) {
          totalLoanAmount += amount;
          validLoanCount++;
        }
      }
    });
    
    const averageLoanAmount = validLoanCount > 0 ? totalLoanAmount / validLoanCount : 0;
    
    console.log('💰 총 근저당액:', totalLoanAmount);
    console.log('💰 평균 근저당액:', averageLoanAmount);

    // 압류/가압류 현황
    const seizureCount = data.filter(row => {
      const seizure = row['압류가압류유무'] || 'N';
      return seizure === 'Y' || seizure === '1' || seizure === 'true';
    }).length;
    const normalCount = total - seizureCount;

    // 연령대별 인사이트 계산
    console.log('📊 ageInsights 계산 시작 - 데이터 길이:', data.length);
    console.log('📊 ageInsights 계산 시작 - 첫 번째 행:', data[0]);
    const ageInsights = calculateAgeInsights(data);
    console.log('📊 연령대별 인사이트:', ageInsights);
    console.log('📊 ageInsights 키들:', Object.keys(ageInsights));

    // 사용 가능한 나이대 목록 생성
    const availableAgeGroups = ['전체', ...Object.keys(ageGroups).sort()];

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
      investorResidence,
      investorCount, // 투자자 수 추가
      loanAmountGroups,
      loanCount,
      noLoanCount,
      seizureCount,
      normalCount,
      totalLoanAmount,
      averageLoanAmount,
      ageInsights, // 연령대별 인사이트 추가
      availableAgeGroups, // 사용 가능한 나이대 목록 추가
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

  // 기본 필터링 (동별)
  const baseFilteredData = useMemo(() => {
    if (!csvData || csvData.length === 0) return [];
    
    return filterByDong(csvData, activeTab);
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
          case '20대이하': return age >= 0 && age < 20;
          case '20대': return age >= 20 && age < 30;
          case '30대': return age >= 30 && age < 40;
          case '40대': return age >= 40 && age < 50;
          case '50대': return age >= 50 && age < 60;
          case '60대': return age >= 60 && age < 70;
          case '70대': return age >= 70 && age < 80;
          case '80대': return age >= 80 && age < 90;
          case '90대이상': return age >= 90;
          default: return true;
        }
      } catch (error) {
        console.error('나이대 필터링 오류:', error, residentNumber);
        return false;
      }
    });
    
    // console.log(`나이대 필터링: ${ageGroup}, 원본: ${data.length}, 필터링 후: ${filtered.length}`);
    return filtered;
  };

  // 통계 데이터 계산
  const currentStats = useMemo(() => {
    return calculateStats(baseFilteredData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseFilteredData]); // calculateStats는 함수이므로 의도적으로 제외

  // 통계 데이터가 업데이트될 때마다 부모 컴포넌트에 전달
  useEffect(() => {
    if (onStatsUpdate && currentStats) {
      console.log('📊 DataAnalysis에서 통계 데이터 전달:', currentStats);
      console.log('📊 ageGroups:', currentStats.ageGroups);
      console.log('📊 transferReasons:', currentStats.transferReasons);
      console.log('📊 areaGroups:', currentStats.areaGroups);
      console.log('📊 holdingGroups:', currentStats.holdingGroups);
      console.log('📊 loanStatusData:', currentStats.loanStatusData);
      console.log('📊 totalLoanAmount:', currentStats.totalLoanAmount);
      console.log('📊 averageLoanAmount:', currentStats.averageLoanAmount);
      console.log('📊 activeTab:', activeTab);
      console.log('📊 onStatsUpdate 함수 존재:', !!onStatsUpdate);
      
      onStatsUpdate({
        [activeTab]: currentStats
      });
    } else {
      console.log('❌ DataAnalysis에서 통계 데이터 전달 실패');
      console.log('❌ onStatsUpdate 존재:', !!onStatsUpdate);
      console.log('❌ currentStats 존재:', !!currentStats);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStats, activeTab]); // onStatsUpdate는 의도적으로 제외

 

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
          {generateDongTabs(csvData).map((tab) => (
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
        {/* 첫번째 줄: 나이, 거주/투자, 면적 */}
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
          availableAgeGroups={calculateStats(baseFilteredData).availableAgeGroups}
        />
        
        <InvestorResidence 
          data={calculateStats(baseFilteredData).investorResidence}
          total={calculateStats(baseFilteredData).investorCount}
        />
        
        {/* 두번째 줄: 등기이전원인, 보유기간, 연도별 소유권 변동 */}
        <TransferReason 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupTransfer)).transferReasons} 
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupTransfer)).total}
          selectedAgeGroup={selectedAgeGroupTransfer}
          setSelectedAgeGroup={setSelectedAgeGroupTransfer}
          availableAgeGroups={calculateStats(baseFilteredData).availableAgeGroups}
        />
        
        <HoldingPeriod 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupHolding)).holdingGroups} 
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupHolding)).total}
          selectedAgeGroup={selectedAgeGroupHolding}
          setSelectedAgeGroup={setSelectedAgeGroupHolding}
          availableAgeGroups={calculateStats(baseFilteredData).availableAgeGroups}
        />
        
        <YearlyOwnership 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupYearly)).yearlyOwnership} 
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupYearly)).total}
          selectedAgeGroup={selectedAgeGroupYearly}
          setSelectedAgeGroup={setSelectedAgeGroupYearly}
          availableAgeGroups={calculateStats(baseFilteredData).availableAgeGroups}
        />
        
        {/* 세번째 줄: 대출 여부 비율, 대출금액대별, 압류/가압류 현황 */}
        <LoanStatus 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupLoan)).loanStatusData}
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupLoan)).total}
          selectedAgeGroup={selectedAgeGroupLoan}
          setSelectedAgeGroup={setSelectedAgeGroupLoan}
          availableAgeGroups={calculateStats(baseFilteredData).availableAgeGroups}
        />
        
        <LoanAmount 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupLoanAmount)).loanAmountGroups} 
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupLoanAmount)).loanCount}
          selectedAgeGroup={selectedAgeGroupLoanAmount}
          setSelectedAgeGroup={setSelectedAgeGroupLoanAmount}
          availableAgeGroups={calculateStats(baseFilteredData).availableAgeGroups}
        />
        
        <SeizureStatus 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupSeizure)).seizureStatusData}
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupSeizure)).total}
          selectedAgeGroup={selectedAgeGroupSeizure}
          setSelectedAgeGroup={setSelectedAgeGroupSeizure}
          availableAgeGroups={calculateStats(baseFilteredData).availableAgeGroups}
        />
        
        <AreaDistribution 
          data={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupArea)).areaGroups} 
          total={calculateStats(filterByAge(baseFilteredData, selectedAgeGroupArea)).total}
          selectedAgeGroup={selectedAgeGroupArea}
          setSelectedAgeGroup={setSelectedAgeGroupArea}
          availableAgeGroups={calculateStats(baseFilteredData).availableAgeGroups}
        />
      </div>

 
    </div>
  );
};

export default DataAnalysis;
