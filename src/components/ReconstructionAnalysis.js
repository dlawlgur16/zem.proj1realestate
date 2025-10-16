import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import importedData from '../data.js';
import FileUpload from './FileUpload';
import './FileUpload.css';

export default function ReconstructionAnalysis() {
  const [activeTab, setActiveTab] = useState('전체통계');
  const [csvData, setCsvData] = useState([]);
  const [statsData, setStatsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  // CSV 데이터를 차트용 데이터로 변환
  const processData = useCallback((data) => {
    const processedData = {
      '전체통계': processBuildingData(data, null),
      '대교아파트 1동': processBuildingData(data, '1동'),
      '대교아파트 2동': processBuildingData(data, '2동'),
      '대교아파트 3동': processBuildingData(data, '3동'),
      '대교아파트 4동': processBuildingData(data, '4동')
    };
    setStatsData(processedData);
  }, []);

  // 파일 업로드 핸들러
  const handleDataLoad = (data) => {
    console.log('업로드된 데이터 개수:', data.length);
    setCsvData(data);
    processData(data);
    setLoading(false);
    setError('');
    setShowUpload(false);
  };

  // 에러 핸들러
  const handleError = (errorMessage) => {
    setError(errorMessage);
    setLoading(false);
  };

  // CSV 데이터 로드
  useEffect(() => {
    console.log('CSV 데이터 로드 시작...');
    console.log('로드된 데이터 개수:', importedData.length);
    
    setCsvData(importedData);
    processData(importedData);
    setLoading(false);
  }, [processData]);

  // 건물별 데이터 처리
  const processBuildingData = (data, building) => {
    let filteredData = data;
    if (building) {
      filteredData = data.filter(row => row.건물명 && row.건물명.includes(building));
    }

    const total = filteredData.length;
    
    // 나이대 분포 계산
    const ageGroups = {};
    filteredData.forEach(row => {
      if (row.주민번호 && row.주민번호.length >= 7) {
        const birthYear = parseInt(row.주민번호.substring(0, 2));
        const currentYear = new Date().getFullYear();
        let fullBirthYear;
        
        // 2000년 이후 출생자는 00-99, 2000년 이전 출생자는 00-99
        if (birthYear <= 30) {
          fullBirthYear = 2000 + birthYear;
        } else {
          fullBirthYear = 1900 + birthYear;
        }
        
        const age = currentYear - fullBirthYear;
        
        // 나이가 유효한 범위인지 확인
        if (age >= 0 && age <= 100) {
          const ageGroup = Math.floor(age / 10) * 10;
          const ageRange = `${ageGroup}대`;
          ageGroups[ageRange] = (ageGroups[ageRange] || 0) + 1;
        }
      }
    });

    const ageData = Object.entries(ageGroups)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        const ageOrder = ['20대', '30대', '40대', '50대', '60대', '70대'];
        return ageOrder.indexOf(a.range) - ageOrder.indexOf(b.range);
      });

    // 거주/투자 분류 (소재지+건물명이 현주소와 같은지로 판단)
    const residenceCount = filteredData.filter(row => {
      if (!row.소재지 || !row.건물명 || !row.현주소) return false;
      const buildingAddress = `${row.소재지} ${row.건물명}`;
      return row.현주소.includes(buildingAddress) || row.현주소.includes('여의도동 41');
    }).length;
    const investmentCount = total - residenceCount;

    // 성별 분포 (주민번호 성별 자리로 판단: 남자 1,3,5 / 여자 2,4,6)
    const male = filteredData.filter(row => {
      if (!row.주민번호) return false;
      const genderDigit = row.주민번호.includes('-') ? 
        row.주민번호.split('-')[1].charAt(0) : // 2000년대: - 뒤 첫 번째 자리
        row.주민번호.charAt(0); // 1900년대: 첫 번째 자리
      return genderDigit === '1' || genderDigit === '3' || genderDigit === '5';
    }).length;
    const female = total - male;

    // 지역별 분포 (투자자만 - 소재지+건물명이 현주소와 다른 사람들)
    const regionGroups = {};
    const investors = filteredData.filter(row => {
      if (!row.소재지 || !row.건물명 || !row.현주소) return false;
      
      // 소재지에서 건물명 추출 (예: "서울시 영등포구 여의도동 41" -> "여의도동 41")
      const buildingName = row.건물명.split(' ').pop(); // "대교아파트 1동" -> "1동"
      
      // 현주소가 소재지+건물명과 다른 경우 (투자자)
      const isResident = row.현주소.includes('여의도동 41') || 
                        row.현주소.includes('영등포구 여의도동') ||
                        row.현주소.includes(buildingName);
      
      return !isResident;
    });
    
    investors.forEach(row => {
      if (row.현주소) {
        // 서울이 아닌 경우도 포함
        let region = '기타';
        if (row.현주소.includes('서울')) {
          const parts = row.현주소.split(' ');
          region = parts.length > 1 ? parts[1] : '서울 기타';
        } else if (row.현주소.includes('경기')) {
          region = '경기도';
        } else if (row.현주소.includes('인천')) {
          region = '인천';
        }
        regionGroups[region] = (regionGroups[region] || 0) + 1;
      }
    });

    const regionData = Object.entries(regionGroups)
      .sort(([,a], [,b]) => b - a)
      .map(([region, count]) => ({ region, count }));

    // 면적별 분포
    const areaGroups = {};
    filteredData.forEach(row => {
      if (row.전용면적_제곱미터) {
        const area = parseFloat(row.전용면적_제곱미터);
        let areaRange;
        if (area < 100) areaRange = '95.5㎡ (29평)';
        else if (area < 140) areaRange = '133.65㎡ (40평)';
        else areaRange = '151.74㎡ (46평)';
        
        areaGroups[areaRange] = (areaGroups[areaRange] || 0) + 1;
      }
    });

    const areaData = Object.entries(areaGroups).map(([range, count]) => ({
      range,
      count,
      percentage: ((count / total) * 100).toFixed(1),
      color: range.includes('95.5') ? '#10b981' : range.includes('133.65') ? '#ec4899' : '#3b82f6'
    }));

    // 대출금액대별 분포 (억대 단위로 그룹화)
    const loanAmountGroups = {};
    filteredData.forEach(row => {
      if (row.유효근저당총액 && parseFloat(row.유효근저당총액) > 0) {
        const amount = parseFloat(row.유효근저당총액);
        let amountRange;
        if (amount < 100000000) amountRange = '1억 미만';
        else if (amount < 200000000) amountRange = '1억대';
        else if (amount < 300000000) amountRange = '2억대';
        else if (amount < 400000000) amountRange = '3억대';
        else if (amount < 500000000) amountRange = '4억대';
        else if (amount < 600000000) amountRange = '5억대';
        else if (amount < 700000000) amountRange = '6억대';
        else if (amount < 800000000) amountRange = '7억대';
        else if (amount < 900000000) amountRange = '8억대';
        else if (amount < 1000000000) amountRange = '9억대';
        else amountRange = '10억 이상';
        
        loanAmountGroups[amountRange] = (loanAmountGroups[amountRange] || 0) + 1;
      }
    });

    const loanAmountData = Object.entries(loanAmountGroups)
      .sort(([a], [b]) => {
        const order = ['1억 미만', '1억대', '2억대', '3억대', '4억대', '5억대', '6억대', '7억대', '8억대', '9억대', '10억 이상'];
        return order.indexOf(a) - order.indexOf(b);
      })
      .map(([range, count]) => ({ range, count }));

    // 대출 여부 비율 (개선된 로직)
    const loanCount = filteredData.filter(row => {
      if (!row.유효근저당총액) return false;
      const amount = parseFloat(row.유효근저당총액);
      return !isNaN(amount) && amount > 0;
    }).length;
    const noLoanCount = total - loanCount;
    
    // 디버깅: 데이터 확인
    console.log('총 인원수:', total);
    console.log('대출 인원수:', loanCount);
    console.log('무대출 인원수:', noLoanCount);
    console.log('총합:', loanCount + noLoanCount);

    const loanStatusData = [
      { name: '대출', value: loanCount, percentage: total ? ((loanCount/total)*100).toFixed(1) : '0', color: '#ef4444' },
      { name: '무대출', value: noLoanCount, percentage: total ? ((noLoanCount/total)*100).toFixed(1) : '0', color: '#10b981' }
    ];

    // 총 근저당액 계산
    const totalLoanAmount = filteredData.reduce((sum, row) => {
      if (row.유효근저당총액 && parseFloat(row.유효근저당총액) > 0) {
        return sum + parseFloat(row.유효근저당총액);
      }
      return sum;
    }, 0);

    // 가구당 평균 근저당액
    const averageLoanAmount = loanCount > 0 ? totalLoanAmount / loanCount : 0;

    // 부동산 평균보유 기간 계산 (1년 단위로 세분화)
    const ownershipPeriods = {};
    filteredData.forEach(row => {
      if (row.소유권취득일) {
        const acquisitionDate = new Date(row.소유권취득일);
        const currentDate = new Date();
        const yearsDiff = (currentDate - acquisitionDate) / (1000 * 60 * 60 * 24 * 365.25);
        
        if (yearsDiff >= 0 && yearsDiff <= 30) { // 0-30년 범위로 제한
          const years = Math.floor(yearsDiff);
          let periodRange;
          if (years < 1) periodRange = '1년 미만';
          else if (years <= 5) periodRange = `${years}년`;
          else if (years <= 10) periodRange = `${years}년`;
          else if (years <= 15) periodRange = `${years}년`;
          else if (years <= 20) periodRange = `${years}년`;
          else periodRange = '20년 이상';
          
          ownershipPeriods[periodRange] = (ownershipPeriods[periodRange] || 0) + 1;
        }
      }
    });

    const ownershipPeriodData = Object.entries(ownershipPeriods)
      .sort(([a], [b]) => {
        if (a === '1년 미만') return -1;
        if (b === '1년 미만') return 1;
        if (a === '20년 이상') return 1;
        if (b === '20년 이상') return -1;
        
        const aYear = parseInt(a.replace('년', ''));
        const bYear = parseInt(b.replace('년', ''));
        return aYear - bYear;
      })
      .map(([period, count]) => ({ period, count }));

    // 등기이전원인별 분포 (매매, 상속, 증여 등)
    const transferReasons = {};
    filteredData.forEach(row => {
      if (row.이전사유) {
        const reason = row.이전사유.trim();
        if (reason) {
          transferReasons[reason] = (transferReasons[reason] || 0) + 1;
        }
      }
    });

    const transferReasonData = Object.entries(transferReasons)
      .sort(([,a], [,b]) => b - a) // 개수 기준 내림차순 정렬
      .map(([reason, count]) => ({ 
        reason, 
        count,
        percentage: total ? ((count/total)*100).toFixed(1) : '0'
      }));

    return {
      total,
      ageData,
      residenceCount,
      investmentCount,
      male,
      female,
      regionData,
      areaData,
      loanAmountData,
      loanStatusData,
      totalLoanAmount,
      averageLoanAmount,
      ownershipPeriodData,
      transferReasonData
    };
  };

  // 연도별 소유권 변동 데이터 처리
  const getOwnershipData = () => {
    const yearGroups = {};
    csvData.forEach(row => {
      if (row.소유권취득일) {
        const year = row.소유권취득일.split('-')[0];
        if (year && year >= '2000') {
          yearGroups[year] = (yearGroups[year] || 0) + 1;
        }
      }
    });

    return Object.entries(yearGroups)
      .sort(([a], [b]) => a - b)
      .map(([year, count]) => ({ year, count }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">데이터를 로딩 중입니다...</p>
        </div>
      </div>
    );
  }

  const stats = statsData[activeTab] || {};
  const tabs = ['전체통계', '대교아파트 1동', '대교아파트 2동', '대교아파트 3동', '대교아파트 4동'];

  // 연도별 소유권 변동 데이터
  const ownershipData = getOwnershipData();

  const residenceData = [
    { name: '거주', value: stats.residenceCount || 0, percentage: stats.total ? ((stats.residenceCount/stats.total)*100).toFixed(1) : '0', color: '#10b981' },
    { name: '투자', value: stats.investmentCount || 0, percentage: stats.total ? ((stats.investmentCount/stats.total)*100).toFixed(1) : '0', color: '#3b82f6' }
  ];

  const genderData = [
    { name: '남', value: stats.male || 0, color: '#3b82f6' },
    { name: '여', value: stats.female || 0, color: '#ec4899' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">대교아파트 조합원 분석</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              📁 CSV 업로드
            </button>
          </div>
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* 파일 업로드 영역 */}
        {showUpload && (
          <div className="mt-4">
            <FileUpload 
              onDataLoad={handleDataLoad}
              onError={handleError}
            />
          </div>
        )}
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white border-b px-8">
        <div className="flex space-x-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 나이대 분포 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">나이대 분포</h2>
            <div className="text-center text-sm text-gray-600 mb-4">총 {stats.total}명</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.ageData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 text-center mt-2">연령</div>
          </div>

          {/* 거주/투자 비율 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">거주/투자 비율</h2>
            <div className="text-center text-sm text-gray-600 mb-4">총 {stats.total}명</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={residenceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}\n${percentage}%`}
                >
                  {residenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                <span className="text-xs">거주</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-xs">투자</span>
              </div>
            </div>
          </div>

          {/* 투자자 거주지역 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">투자자 거주지역</h2>
            <div className="text-center text-sm text-gray-600 mb-4">총 {stats.investmentCount}명 (투자자 현주소 기준)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.regionData || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="region" type="category" width={85} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 text-center mt-2">지역별</div>
          </div>

          {/* 연도별 소유권 변동 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">연도별 소유권 변동</h2>
            <div className="text-center text-sm text-gray-600 mb-4">총 {stats.total}건</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ownershipData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 9 }} 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 text-center mt-2">연도</div>
          </div>

          {/* 성별 분포 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">성별 분포</h2>
            <div className="text-center text-sm text-gray-600 mb-4">총 {stats.total}명</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}\n${value}명\n(${(value/stats.total*100).toFixed(1)}%)`}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 면적별 분포 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">면적별 분포</h2>
            <div className="text-center text-sm text-gray-600 mb-4">총 {stats.total}세대</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.areaData || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="count"
                  label={({ range, count, percentage }) => `${range.split('㎡')[0]}\n${count}세대\n(${percentage}%)`}
                >
                  {(stats.areaData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 부동산 평균보유 기간 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">부동산 평균보유 기간</h2>
            <div className="text-center text-sm text-gray-600 mb-4">소유권취득일 기준</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.ownershipPeriodData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 text-center mt-2">보유 기간</div>
          </div>

          {/* 등기이전원인별 분포 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">등기이전원인별 분포</h2>
            <div className="text-center text-sm text-gray-600 mb-4">총 {stats.total}건</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.transferReasonData || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="count"
                  label={({ reason, count, percentage }) => `${reason}\n${count}건\n(${percentage}%)`}
                >
                  {(stats.transferReasonData || []).map((entry, index) => {
                    const colors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 대출금액대별 분포 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">대출금액대별 분포</h2>
            <div className="text-center text-sm text-gray-600 mb-4">대출자 기준</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.loanAmountData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-gray-500 text-center mt-2">대출금액</div>
          </div>

          {/* 대출 여부 비율 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">대출 여부 비율</h2>
            <div className="text-center text-sm text-gray-600 mb-4">총 {stats.total}명</div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.loanStatusData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}\n${percentage}%`}
                >
                  {(stats.loanStatusData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-xs">대출</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                <span className="text-xs">무대출</span>
              </div>
            </div>
          </div>
        </div>

        {/* 추가 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">총 세대수</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-400 mt-1">세대</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">거주</div>
            <div className="text-3xl font-bold text-emerald-600">{stats.residenceCount}</div>
            <div className="text-xs text-gray-400 mt-1">{residenceData[0].percentage}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">투자</div>
            <div className="text-3xl font-bold text-blue-600">{stats.investmentCount}</div>
            <div className="text-xs text-gray-400 mt-1">{residenceData[1].percentage}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">총 근저당액</div>
            <div className="text-2xl font-bold text-red-600">{stats.totalLoanAmount ? (stats.totalLoanAmount / 100000000).toFixed(1) : '0'}</div>
            <div className="text-xs text-gray-400 mt-1">억원</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">가구당 평균</div>
            <div className="text-2xl font-bold text-orange-600">{stats.averageLoanAmount ? (stats.averageLoanAmount / 100000000).toFixed(1) : '0'}</div>
            <div className="text-xs text-gray-400 mt-1">억원</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">선택 탭</div>
            <div className="text-xl font-bold text-purple-600">{activeTab}</div>
            <div className="text-xs text-gray-400 mt-1">현재 보기</div>
          </div>
        </div>
      </div>
    </div>
  );
}
