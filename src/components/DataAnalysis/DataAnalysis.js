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
import HouseholdType from './Charts/HouseholdType';
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
 
  // 동호수에서 동 번호 추출하는 헬퍼 함수
  // "동"이라는 글자가 명시적으로 있어야만 동으로 인식
  const extractDongNumber = (dongho) => {
    if (!dongho) return null;
    
    const str = dongho.toString().trim();
    
    // 패턴 1: "1동" 또는 "1동 101호" 형태 (동이 명시적으로 있음)
    let match = str.match(/(\d+)동/);
    if (match) return match[1];
    
    // 패턴 2: "1 101" 형태 (공백으로 구분, 첫 번째가 동일 수 있음)
    // 하지만 "동"이 없으면 동으로 인식하지 않음
    // 이 패턴은 제외
    
    // 패턴 3: "1205-1호" 같은 형태는 동이 아님 (동이 명시되지 않음)
    // 이런 경우는 null 반환
    
    return null; // "동"이 명시적으로 없으면 동이 아님
  };

  // 동별 탭을 동적으로 생성하는 함수
  const generateDongTabs = (data) => {
    const dongSet = new Set();
    
    data.forEach(row => {
      // 동호수 컬럼에서 동 정보 추출
      const dongNum = extractDongNumber(row.동호수);
      if (dongNum) {
        dongSet.add(`${dongNum}동`);
      }
    });
    
    // 동 정보가 없거나 1개 이하면 전체통계만 표시
    if (dongSet.size === 0 || dongSet.size === 1) {
      return ['전체통계'];
    }
    
    // 동을 번호 순으로 정렬
    const sortedDongs = Array.from(dongSet).sort((a, b) => {
      const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
      const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
      return aNum - bNum;
    });
    
    // 동이 2개 이상일 때만 탭 표시
    return ['전체통계', ...sortedDongs];
  };

  // 동별 필터링 함수
  const filterByDong = (data, selectedDong) => {
    if (selectedDong === '전체통계') {
      return data;
    }
    
    // 선택된 동 번호 추출 (예: "1동" -> "1")
    const selectedDongNum = selectedDong.match(/\d+/)?.[0];
    if (!selectedDongNum) {
      return data;
    }
    
    return data.filter(row => {
      const dongNum = extractDongNumber(row.동호수);
      return dongNum === selectedDongNum;
    });
  };

  const calculateStats = (data) => {
    // 동호수 기준으로 고유 세대만 카운트 (공유자 개별 행이 아닌)
    const uniqueHouseholds = new Set();
    data.forEach(row => {
      const dongho = row['동호수'] || `${row['동'] || ''} ${row['호수'] || ''}`.trim();
      if (dongho) {
        uniqueHouseholds.add(dongho);
      }
    });
    const total = uniqueHouseholds.size;
    
    // 나이대별 분포 (연령대 컬럼 또는 생년월일 분석)
    const ageGroups = {};
    const hasAgeBand = data.some(row => row['연령대']);
    if (hasAgeBand) {
      data.forEach(row => {
        const bandRaw = (row['연령대'] || '').trim();
        if (!bandRaw) return;
        const normalized = bandRaw.replace('이상', '').replace('이하', '');
        ageGroups[normalized] = (ageGroups[normalized] || 0) + 1;
      });
    } else {
      data.forEach(row => {
        const birthRaw = (row['생년월일'] ?? '').toString().trim();
        // 특수 표기 처리: 사업자/법인은 모두 '법인'으로 통일
        if (/사업자/.test(birthRaw)) {
          ageGroups['법인'] = (ageGroups['법인'] || 0) + 1;
          return;
        }
        if (/법인|\d{3}-\d{2}-\d{5}/.test(birthRaw)) {
          ageGroups['법인'] = (ageGroups['법인'] || 0) + 1;
          return;
        }
        // 입력은 주민번호 앞 6자리만 제공된다고 가정 → 여기서만 판별
        const m = birthRaw.match(/(\d{6})/);
        if (!m) {
          if (birthRaw) {
            ageGroups['미분류'] = (ageGroups['미분류'] || 0) + 1;
          }
          return;
        }
        try {
          const birth6 = m[1];
          const birthYear = parseInt(birth6.substring(0, 2), 10);
          const currentYear = new Date().getFullYear();
          // 세기 판별 휴리스틱: YY <= 24 → 2000년대, 그 외 1900년대
          const fullBirthYear = birthYear <= 24 ? 2000 + birthYear : 1900 + birthYear;
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
        } catch (e) {
          ageGroups['미분류'] = (ageGroups['미분류'] || 0) + 1;
        }
      });
    }

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

    // 거주/투자 비율 (거주형태 컬럼 사용)
    const residenceCount = data.filter(row => {
      const residenceType = row['거주형태'];
      return residenceType === '실거주';
    }).length;
    const investmentCount = data.filter(row => {
      const residenceType = row['거주형태'];
      return residenceType === '투자';
    }).length;
    
    // console.log('🔍 DataAnalysis 실거주 비율:', {
    //   total,
    //   residenceCount,
    //   investmentCount,
    //   residenceRate: ((residenceCount / total) * 100).toFixed(1) + '%'
    // });

    // 면적별 분포 (건축물_연면적 컬럼 사용)
    const areaGroups = {};
    data.forEach(row => {
      const area = row['건축물_연면적'];
      if (area) {
        const areaNum = parseFloat(area);
        if (!isNaN(areaNum) && areaNum > 0) {
          const roundedArea = Math.round(areaNum * 100) / 100; // 소수점 2자리
          const areaKey = `${roundedArea}㎡`;
          areaGroups[areaKey] = (areaGroups[areaKey] || 0) + 1;
        }
      }
    });

    // 보유기간별 분포 (보유기간 컬럼 사용)
    const holdingGroups = {};
    data.forEach(row => {
      const holdingPeriod = row['보유기간'];
      if (holdingPeriod) {
        // "4년 11개월" 형태의 문자열에서 년수 추출
        const yearMatch = holdingPeriod.match(/(\d+)년/);
        if (yearMatch) {
          const years = parseInt(yearMatch[1]);
          if (!isNaN(years)) {
            let periodGroup;
            if (years < 3) periodGroup = '3년 미만';
            else if (years >= 3 && years < 7) periodGroup = '3~7년';
            else if (years >= 7 && years < 15) periodGroup = '7~15년';
            else periodGroup = '15년 이상';
            
            holdingGroups[periodGroup] = (holdingGroups[periodGroup] || 0) + 1;
          }
        }
      }
    });

    // 등기이전원인별 분포 (등기목적_분류 컬럼 사용)
    const transferReasons = {};
    data.forEach(row => {
      const reason = row['등기목적_분류'];
      if (reason) {
        transferReasons[reason] = (transferReasons[reason] || 0) + 1;
      }
    });

    // 연도별 소유권 변동 (등기원인_년월일 컬럼 사용)
    const yearlyOwnership = {};
    data.forEach(row => {
      const date = row['등기원인_년월일'];
      if (date) {
        // "2016-07-27" 형태에서 연도 추출
        const yearMatch = date.match(/(\d{4})/);
        if (yearMatch) {
          const year = yearMatch[1];
          yearlyOwnership[year] = (yearlyOwnership[year] || 0) + 1;
        }
      }
    });

    // 투자자 거주지역 분석 (거주형태가 '투자'인 경우만) - 시/도/해외 단위
    const investorResidence = {};
    let investorCount = 0; // 투자자 수 카운트

    const normalizeForeign = (text) => {
      const t = (text || '').toString().toLowerCase();
      if (/usa|u\.?s\.?a\.?|united states/.test(t)) return '미국';
      if (/china/.test(t)) return '중국';
      if (/japan/.test(t)) return '일본';
      if (/australia/.test(t)) return '호주';
      if (/canada/.test(t)) return '캐나다';
      if (/vietnam/.test(t)) return '베트남';
      if (/thailand/.test(t)) return '태국';
      if (/philippine/.test(t)) return '필리핀';
      if (/singapore/.test(t)) return '싱가포르';
      if (/hong\s*kong/.test(t)) return '홍콩';
      if (/taiwan/.test(t)) return '대만';
      if (/united\s*kingdom|u\.?k\.?|england|great\s*britain/.test(t)) return '영국';
      if (/germany/.test(t)) return '독일';
      if (/france/.test(t)) return '프랑스';
      if (/italy/.test(t)) return '이탈리아';
      if (/spain/.test(t)) return '스페인';
      if (/russia/.test(t)) return '러시아';
      if (/brazil/.test(t)) return '브라질';
      if (/mexico/.test(t)) return '멕시코';
      if (/argentina/.test(t)) return '아르헨티나';
      if (/chile/.test(t)) return '칠레';
      if (/colombia/.test(t)) return '콜롬비아';
      if (/peru/.test(t)) return '페루';
      if (/ecuador/.test(t)) return '에콰도르';
      if (/bolivia/.test(t)) return '볼리비아';
      if (/paraguay/.test(t)) return '파라과이';
      if (/uruguay/.test(t)) return '우루과이';
      if (/venezuela/.test(t)) return '베네수엘라';
      if (/guyana/.test(t)) return '가이아나';
      if (/suriname/.test(t)) return '수리남';
      return null;
    };

    data.forEach(row => {
      if (row['거주형태'] === '투자') {
        investorCount++;
        const regionSource = row['소유자_주소'] || row['투자자거주지역'] || '';

        if (regionSource) {
          // 1) 국내 시/도 한글 매칭
          const cityMatch = regionSource.match(/(서울특별시|서울시|부산광역시|부산시|대구광역시|대구시|인천광역시|인천시|광주광역시|광주시|대전광역시|대전시|울산광역시|울산시|세종특별자치시|세종시|경기도|강원도|강원특별자치도|충청북도|충북|충청남도|충남|전라북도|전북|전라남도|전남|경상북도|경북|경상남도|경남|제주특별자치도|제주도|미국|중국|일본|베트남|태국|필리핀|인도네시아|말레이시아|싱가포르|홍콩|대만|캐나다|호주|뉴질랜드|영국|독일|프랑스|이탈리아|스페인|러시아|브라질|멕시코|아르헨티나|칠레|콜롬비아|페루|에콰도르|볼리비아|파라과이|우루과이|베네수엘라|가이아나|수리남|프랑스령 기아나)/);
          let region = cityMatch ? cityMatch[1] : null;

          // 2) 영문 해외 표기 보정
          if (!region) {
            const foreign = normalizeForeign(regionSource);
            if (foreign) region = foreign;
          }

          if (region) {
            investorResidence[region] = (investorResidence[region] || 0) + 1;
          } else {
            investorResidence['기타'] = (investorResidence['기타'] || 0) + 1;
          }
        } else {
          investorResidence['정보없음'] = (investorResidence['정보없음'] || 0) + 1;
        }
      }
    });
    
    

    // 대출금액대별 분포
    const loanAmountGroups = {};
    
    data.forEach(row => {
      // 근저당금액 컬럼 사용
      const loanAmount = row['근저당금액'];
      
      if (loanAmount) {
        const amount = parseFloat(loanAmount);
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
    
    

    // 대출 여부 비율 (근저당금액 컬럼 사용)
    const loanCount = data.filter(row => {
      const loanAmount = row['근저당금액'];
      if (!loanAmount) return false;
      const amount = parseFloat(loanAmount);
      return !isNaN(amount) && amount > 0;
    }).length;
    const noLoanCount = total - loanCount;
    
    // console.log('💰 대출 여부 분석:');
    // console.log('💰 대출 있는 건수:', loanCount);
    // console.log('💰 대출 없는 건수:', noLoanCount);
    // console.log('💰 대출 비율:', ((loanCount / total) * 100).toFixed(1) + '%');

    // 총 근저당액과 평균 근저당액 계산 (근저당금액 컬럼 사용)
    let totalLoanAmount = 0;
    let validLoanCount = 0;
    
    data.forEach(row => {
      const loanAmount = row['근저당금액'];
      if (loanAmount) {
        const amount = parseFloat(loanAmount);
        if (!isNaN(amount) && amount > 0) {
          totalLoanAmount += amount;
          validLoanCount++;
        }
      }
    });
    
    const averageLoanAmount = validLoanCount > 0 ? totalLoanAmount / validLoanCount : 0;
    
    // console.log('💰 총 근저당액:', totalLoanAmount);
    // console.log('💰 평균 근저당액:', averageLoanAmount);

    // 압류/가압류 현황 (압류가압류 컬럼 사용)
    const seizureCount = data.filter(row => {
      const seizure = row['압류가압류'];
      return seizure === 'Y' || seizure === '1' || seizure === 'true' || seizure === '있음';
    }).length;
    const normalCount = total - seizureCount;

    // 연령대별 인사이트 계산
    // console.log('📊 ageInsights 계산 시작 - 데이터 길이:', data.length);
    // console.log('📊 ageInsights 계산 시작 - 첫 번째 행:', data[0]);
    // console.log('🔍 생년월일 값 확인:', data.map(d => d['생년월일']).filter(v => v).slice(0, 5));
    const ageInsights = calculateAgeInsights(data);
    // console.log('📊 연령대별 인사이트:', ageInsights);
    // console.log('📊 ageInsights 키들:', Object.keys(ageInsights));

    // 공유세대/단독세대 분포 계산
    // 공유세대는 동호수 기준으로 고유 세대만 세어야 함 (공유자 개별 행이 아닌)
    const sharedHouseholdSet = new Set();
    const singleHouseholdSet = new Set();
    
    data.forEach(row => {
      const householdType = row['세대유형'];
      const dongho = row['동호수'] || `${row['동'] || ''} ${row['호수'] || ''}`.trim();
      
      if (householdType === '공유세대') {
        // 공유세대는 동호수 기준으로 고유 세대만 카운트
        if (dongho) {
          sharedHouseholdSet.add(dongho);
        }
      } else if (householdType === '단독세대') {
        // 단독세대도 동호수 기준으로 고유 세대만 카운트
        if (dongho) {
          singleHouseholdSet.add(dongho);
        }
      }
    });
    
    const sharedHouseholdCount = sharedHouseholdSet.size;
    const singleHouseholdCount = singleHouseholdSet.size;

    // 사용 가능한 나이대 목록 생성 (탭에서는 '미분류', '법인' 제외)
    const availableAgeGroups = ['전체', ...Object.keys(ageGroups)
      .filter(key => key !== '미분류' && key !== '법인')
      .sort()];

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
      sharedHouseholdCount, // 공유세대 수
      singleHouseholdCount, // 단독세대 수
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
      householdTypeData: [
        { name: '공유세대', value: sharedHouseholdCount, color: '#f59e0b' },
        { name: '단독세대', value: singleHouseholdCount, color: '#8b5cf6' }
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
    let birthRaw = row['생년월일'];
    if (!birthRaw) return false;

    // ✅ 정규식으로 주민번호 앞 6자리 추출
    const match = birthRaw.match(/(\d{6})/);
    if (!match) return false;
    const birthDate = match[1]; // 예: "110111"

    try {
      const birthYear = parseInt(birthDate.substring(0, 2));
      const currentYear = new Date().getFullYear();
      const fullBirthYear = birthYear <= 30 ? 2000 + birthYear : 1900 + birthYear;
      const age = currentYear - fullBirthYear;

      switch (ageGroup) {
        case '10대': return age < 20;
        case '20대': return age >= 20 && age < 30;
        case '30대': return age >= 30 && age < 40;
        case '40대': return age >= 40 && age < 50;
        case '50대': return age >= 50 && age < 60;
        case '60대': return age >= 60 && age < 70;
        case '70대': return age >= 70 && age < 80;
        case '80대': return age >= 80 && age < 90;
        case '90대': return age >= 90;
        default: return false;
      }
    } catch (error) {
      console.error('나이대 필터링 오류:', error, birthRaw);
      return false;
    }
  });

  // console.log(`🧮 나이대 필터링 완료: ${ageGroup}, 원본 ${data.length} → 결과 ${filtered.length}`);
  
    // if (ageGroup === '전체') return data;
    
    // const filtered = data.filter(row => {
    //   const residentNumber = getColumnValue(row, ['주민번호', '주민등록번호', 'resident_number', '주민등록번호']);
    //   if (!residentNumber || residentNumber.length < 7) return false;
      
    //   try {
    //     const birthYear = parseInt(residentNumber.substring(0, 2));
    //     const currentYear = new Date().getFullYear();
    //     let fullBirthYear;
        
    //     if (birthYear <= 30) {
    //       fullBirthYear = 2000 + birthYear;
    //     } else {
    //       fullBirthYear = 1900 + birthYear;
    //     }
        
    //     const age = currentYear - fullBirthYear;
        
    //     switch (ageGroup) {
    //       case '20대이하': return age >= 0 && age < 20;
    //       case '20대': return age >= 20 && age < 30;
    //       case '30대': return age >= 30 && age < 40;
    //       case '40대': return age >= 40 && age < 50;
    //       case '50대': return age >= 50 && age < 60;
    //       case '60대': return age >= 60 && age < 70;
    //       case '70대': return age >= 70 && age < 80;
    //       case '80대': return age >= 80 && age < 90;
    //       case '90대이상': return age >= 90;
    //       default: return true;
    //     }
    //   } catch (error) {
    //     console.error('나이대 필터링 오류:', error, residentNumber);
    //     return false;
    //   }
    // });
    
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
    // console.log('📊 DataAnalysis에서 통계 데이터 전달:', currentStats);
    // console.log('📊 ageGroups:', currentStats.ageGroups);
    // console.log('📊 transferReasons:', currentStats.transferReasons);
    // console.log('📊 areaGroups:', currentStats.areaGroups);
    // console.log('📊 holdingGroups:', currentStats.holdingGroups);
    // console.log('📊 loanStatusData:', currentStats.loanStatusData);
    // console.log('📊 totalLoanAmount:', currentStats.totalLoanAmount);
    // console.log('📊 averageLoanAmount:', currentStats.averageLoanAmount);
    // console.log('📊 activeTab:', activeTab);
    // console.log('📊 onStatsUpdate 함수 존재:', !!onStatsUpdate);
      
      onStatsUpdate({
        [activeTab]: currentStats
      });
    } else {
      // console.log('❌ DataAnalysis에서 통계 데이터 전달 실패');
      // console.log('❌ onStatsUpdate 존재:', !!onStatsUpdate);
      // console.log('❌ currentStats 존재:', !!currentStats);
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
        
        {/* 네번째 줄: 세대 유형 분포 */}
        <HouseholdType 
          data={calculateStats(baseFilteredData).householdTypeData}
          total={calculateStats(baseFilteredData).total}
        />
      </div>

 
    </div>
  );
};

export default DataAnalysis;
