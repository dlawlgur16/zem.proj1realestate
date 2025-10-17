import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import importedData from '../data.js';
import FileUpload from './FileUpload';


export default function ReconstructionAnalysis({ data, files, activeFile, setActiveFile, onDataLoad }) {
    console.log('📊 [ReconstructionAnalysis] 렌더링 시작');
    console.log('활성 파일명:', activeFile);
    console.log('데이터 길이:', data?.length || 0);
    console.log('데이터 샘플:', data?.slice?.(0, 2));

    //const currentData = data || [];
    const csvData = data || [];
   //const [csvData, setCsvData] = useState([]);
    const [statsData, setStatsData] = useState({});
    const [activeTab, setActiveTab] = useState('전체통계');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showUpload, setShowUpload] = useState(false);
    const [availableFiles, setAvailableFiles] = useState([]);
    const [currentFileName, setCurrentFileName] = useState('');
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [selectedAgeGroup, setSelectedAgeGroup] = useState('전체');
    const [selectedAgeGroupOwnership, setSelectedAgeGroupOwnership] = useState('전체');
    const [selectedAgeGroupReason, setSelectedAgeGroupReason] = useState('전체');
    const [selectedAgeGroupArea, setSelectedAgeGroupArea] = useState('전체');
    const [selectedAgeGroupLoan, setSelectedAgeGroupLoan] = useState('전체');


    // 연령대별 데이터 필터링 함수
    const filterDataByAge = useCallback((data, ageGroup) => {
        if (ageGroup === '전체') return data;
    
        return data.filter(row => {
            const jumin = row['주민번호'] || '';
            if (jumin.length < 7) return false;
      
            const birthYear = parseInt(jumin.substring(0, 2));
            const currentYear = new Date().getFullYear();
            const age = currentYear - (birthYear > 50 ? 1900 + birthYear : 2000 + birthYear);
      
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
        });
    }, []);

    const getAgeGroupResidenceData = useCallback((data, ageGroup) => {
        const filteredData = filterDataByAge(data, ageGroup);
        const total = filteredData.length;
        
        if (total === 0) {
          return {
            total: 0,
            residence: 0,
            investment: 0,
            residenceRate: 0,
            investmentRate: 0
          };
        }

        const residence = filteredData.filter(row => 
            row['실거주여부'] === '실거주 추정' || 
            row['실거주여부'] === '실거주'
          ).length;
          
          const investment = total - residence;
          
          return {
            total,
            residence,
            investment,
            residenceRate: total > 0 ? (residence / total * 100).toFixed(1) : 0,
            investmentRate: total > 0 ? (investment / total * 100).toFixed(1) : 0
          };
    }, [filterDataByAge]);

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
                // 시/도별로 분류
                let region = '기타';
                if (row.현주소.includes('서울')) {
                    region = '서울특별시';
                } else if (row.현주소.includes('경기')) {
                    region = '경기도';
                } else if (row.현주소.includes('인천')) {
                    region = '인천광역시';
                } else if (row.현주소.includes('부산')) {
                    region = '부산광역시';
                } else if (row.현주소.includes('대구')) {
                    region = '대구광역시';
                } else if (row.현주소.includes('광주')) {
                    region = '광주광역시';
                } else if (row.현주소.includes('대전')) {
                    region = '대전광역시';
                } else if (row.현주소.includes('울산')) {
                    region = '울산광역시';
                } else if (row.현주소.includes('세종')) {
                    region = '세종특별자치시';
                } else if (row.현주소.includes('강원')) {
                    region = '강원도';
                } else if (row.현주소.includes('충북') || row.현주소.includes('충청북도')) {
                    region = '충청북도';
                } else if (row.현주소.includes('충남') || row.현주소.includes('충청남도')) {
                    region = '충청남도';
                } else if (row.현주소.includes('전북') || row.현주소.includes('전라북도')) {
                    region = '전라북도';
                } else if (row.현주소.includes('전남') || row.현주소.includes('전라남도')) {
                    region = '전라남도';
                } else if (row.현주소.includes('경북') || row.현주소.includes('경상북도')) {
                    region = '경상북도';
                } else if (row.현주소.includes('경남') || row.현주소.includes('경상남도')) {
                    region = '경상남도';
                } else if (row.현주소.includes('제주')) {
                    region = '제주특별자치도';
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

        // 거주/투자 비율 계산
        const residenceRate = total > 0 ? (residenceCount / total * 100).toFixed(1) : 0;
        const investmentRate = total > 0 ? (investmentCount / total * 100).toFixed(1) : 0;

        return {
            total,
            ageData,
            residenceCount,
            investmentCount,
            residenceRate,
            investmentRate,
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


      // 파일 업로드 핸들러
    const handleDataLoad = (data) => {
        console.log('업로드된 데이터 개수:', data.length);
        //setCsvData(data);
    
        // 동별 탭 생성 (1동, 2동, 3동, 4동)
        const processedData = {
            '전체통계': processBuildingData(data, null),
            '대교아파트 1동': processBuildingData(data, '1동'),
            '대교아파트 2동': processBuildingData(data, '2동'),
            '대교아파트 3동': processBuildingData(data, '3동'),
            '대교아파트 4동': processBuildingData(data, '4동')
        };
        setStatsData(processedData);
        setActiveTab('전체통계');
        setLoading(false);
        setError('');
        setShowUpload(false);
    
        // 업로드된 파일을 사용 가능한 파일 목록에 추가
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const newFileName = `uploaded-${timestamp}.csv`;
        //setAvailableFiles(prev => [...prev, newFileName]);
        //setCurrentFileName(newFileName);
    };

    // 에러 핸들러
    const handleError = (errorMessage) => {
        setError(errorMessage);
        setLoading(false);
    };

    // 🔹 초기 데이터 세팅
    useEffect(() => {
        console.log('초기 데이터 로딩 시작...');
        if (data && data.length > 0) {
            console.log('데이터 감지됨:', data.length);
            //setCsvData(data);
  
            const processed = {
                '전체통계': processBuildingData(data, null),
                '대교아파트 1동': processBuildingData(data, '1동'),
                '대교아파트 2동': processBuildingData(data, '2동'),
                '대교아파트 3동': processBuildingData(data, '3동'),
                '대교아파트 4동': processBuildingData(data, '4동'),
            };
            setStatsData(processed);
            setActiveTab('전체통계');
            setLoading(false);
        } else {
            console.warn('⚠️ 전달된 데이터가 비어 있습니다. importedData 사용');
            //setCsvData(importedData);
            const processed = {
                '전체통계': processBuildingData(importedData, null),
                '대교아파트 1동': processBuildingData(importedData, '1동'),
                '대교아파트 2동': processBuildingData(importedData, '2동'),
                '대교아파트 3동': processBuildingData(importedData, '3동'),
                '대교아파트 4동': processBuildingData(importedData, '4동'),
            };
        setStatsData(processed);
        setActiveTab('전체통계');
        setLoading(false);
        }
    }, [data]);
  

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

        {/* ✅ 헤더 영역 */}
        <div className="bg-white border-b px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">대교아파트 조합원 분석</h1>
  
            <div className="flex items-center gap-4">
              {/* 파일 선택 드롭다운 */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">데이터 파일:</label>
                <select
                  value={activeFile}
                  onChange={(e) => setActiveFile(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {files.map((f) => (
                    <option key={f.name} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
  
              {/* 업로드 버튼 */}
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
        {/* ✅ 업로드 UI 표시 */}
            {showUpload && (
                <div className="mt-4">
                <FileUpload onDataLoad={onDataLoad} onError={handleError} />
            </div>
            )}
        </div>
        {/* <div className="min-h-screen bg-gray-50">
        
        <div className="bg-white border-b px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              대교아파트 조합원 분석
            </h1>
    
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                데이터 파일:
              </label>
              <span className="px-3 py-1 text-sm font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                {fileName || '기본데이터'}
              </span>
            </div>
          </div>
        </div> 
        */}
    
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
                             <Tooltip 
                               contentStyle={{
                                 backgroundColor: '#000000',
                                 color: '#ffffff',
                                 border: 'none',
                                 borderRadius: '8px',
                                 fontSize: '12px'
                               }}
                             />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2">연령</div>
              </div>
    
              {/* 거주/투자 비율 - 연령대별 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 text-center">거주/투자 비율</h2>
                
                {/* 연령대별 탭 */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {['전체', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대'].map((ageGroup) => {
                    return (
                      <button
                        key={ageGroup}
                        onClick={() => setSelectedAgeGroup(ageGroup)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedAgeGroup === ageGroup
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {ageGroup}
                      </button>
                    );
                  })}
                </div>
                
                {/* 선택된 연령대의 데이터 표시 */}
                {(() => {
                  // 현재 탭에 해당하는 데이터만 사용
                  const currentData = activeTab === '전체통계' ? csvData : 
                    csvData.filter(row => {
                      const building = row.건물명 || '';
                      if (activeTab === '대교아파트 1동') return building.includes('1동');
                      if (activeTab === '대교아파트 2동') return building.includes('2동');
                      if (activeTab === '대교아파트 3동') return building.includes('3동');
                      if (activeTab === '대교아파트 4동') return building.includes('4동');
                      return false;
                    });
                  const ageData = getAgeGroupResidenceData(currentData, selectedAgeGroup);
                  const ageResidenceData = [
                    { 
                      name: '거주', 
                      value: ageData.residence, 
                      color: '#10b981',
                      percentage: ageData.residenceRate
                    },
                    { 
                      name: '투자', 
                      value: ageData.investment, 
                      color: '#3b82f6',
                      percentage: ageData.investmentRate
                    }
                  ];
                  
                  return (
                    <>
                      <div className="text-center text-sm text-gray-600 mb-4">
                        총 {ageData.total}명 ({selectedAgeGroup})
                      </div>
                <div className="flex items-center justify-center gap-8">
                    <ResponsiveContainer width="60%" height={300}>
                  <PieChart>
                    <Pie
                              data={ageResidenceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                              {ageResidenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                             <Tooltip 
                               contentStyle={{
                                 backgroundColor: '#000000',
                                 color: '#ffffff',
                                 border: 'none',
                                 borderRadius: '8px',
                                 fontSize: '12px'
                               }}
                             />
                  </PieChart>
                </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {ageResidenceData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-sm font-medium">{entry.name}</span>
                        <span className="text-sm text-gray-600">{entry.value}명</span>
                        <span className="text-sm text-gray-500">({entry.percentage}%)</span>
                  </div>
                    ))}
                  </div>
                </div>
                    </>
                  );
                })()}
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
                             <Tooltip 
                               contentStyle={{
                                 backgroundColor: '#000000',
                                 color: '#ffffff',
                                 border: 'none',
                                 borderRadius: '8px',
                                 fontSize: '12px'
                               }}
                             />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2">지역별</div>
              </div>
    
              {/* 연도별 소유권 변동 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">연도별 소유권 변동</h2>
                
                {/* 연령대별 탭 */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {['전체', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대'].map((ageGroup) => {
                    return (
                      <button
                        key={ageGroup}
                        onClick={() => setSelectedAgeGroupOwnership(ageGroup)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedAgeGroupOwnership === ageGroup
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {ageGroup}
                      </button>
                    );
                  })}
                </div>
    
                {/* 선택된 연령대의 데이터 표시 */}
                {(() => {
                  // 현재 탭에 해당하는 데이터만 사용
                  const currentData = activeTab === '전체통계' ? csvData : 
                    csvData.filter(row => {
                      const building = row.건물명 || '';
                      if (activeTab === '대교아파트 1동') return building.includes('1동');
                      if (activeTab === '대교아파트 2동') return building.includes('2동');
                      if (activeTab === '대교아파트 3동') return building.includes('3동');
                      if (activeTab === '대교아파트 4동') return building.includes('4동');
                      return false;
                    });
                  
                  // 연령대별 필터링 적용
                  const filteredData = selectedAgeGroupOwnership === '전체' ? currentData : 
                    currentData.filter(row => {
                      if (!row.주민번호 || row.주민번호.length < 7) return false;
                      const birthYear = parseInt(row.주민번호.substring(0, 2));
                      const currentYear = new Date().getFullYear();
                      let fullBirthYear;
                      
                      if (birthYear <= 30) {
                        fullBirthYear = 2000 + birthYear;
                      } else {
                        fullBirthYear = 1900 + birthYear;
                      }
                      
                      const age = currentYear - fullBirthYear;
                      const ageGroup = selectedAgeGroupOwnership;
                      
                      if (ageGroup === '20대') return age >= 20 && age < 30;
                      if (ageGroup === '30대') return age >= 30 && age < 40;
                      if (ageGroup === '40대') return age >= 40 && age < 50;
                      if (ageGroup === '50대') return age >= 50 && age < 60;
                      if (ageGroup === '60대') return age >= 60 && age < 70;
                      if (ageGroup === '70대') return age >= 70 && age < 80;
                      if (ageGroup === '80대') return age >= 80 && age < 90;
                      if (ageGroup === '90대') return age >= 90;
                      
                      return true;
                    });
                  
                  // 소유권 변동 데이터 처리 (소유권취득일 기준) - 2003년부터 2025년까지 1년 단위
                  const ownershipChanges = {};
                  filteredData.forEach(row => {
                    const acquisitionDate = row['소유권취득일'];
                    if (acquisitionDate && acquisitionDate !== '') {
                      const year = parseInt(acquisitionDate.split('-')[0]);
                      if (year >= 2003 && year <= 2025) {
                        ownershipChanges[year] = (ownershipChanges[year] || 0) + 1;
                      }
                    }
                  });
                  
                  // 2003년부터 2025년까지 모든 연도 초기화
                  const allYears = [];
                  for (let year = 2003; year <= 2025; year++) {
                    allYears.push({ year: year.toString(), count: ownershipChanges[year] || 0 });
                  }
                  
                  const ownershipData = allYears;
                  
                  console.log('소유권 변동 데이터:', { currentData: currentData.length, filteredData: filteredData.length, ownershipData });
                  
                  return (
                    <>
                      <div className="text-center text-sm text-gray-600 mb-4">
                        총 {filteredData.length}건 ({selectedAgeGroupOwnership})
                      </div>
                <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={ownershipData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="year" 
                            tick={{ fontSize: 8 }} 
                      angle={-45}
                      textAnchor="end"
                      height={70}
                            interval={0}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                             <Tooltip 
                               contentStyle={{
                                 backgroundColor: '#000000',
                                 color: '#ffffff',
                                 border: 'none',
                                 borderRadius: '8px',
                                 fontSize: '12px'
                               }}
                             />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
                      <div className="text-xs text-gray-500 text-center mt-2">기간</div>
                    </>
                  );
                })()}
              </div>
    
              {/* 성별 분포 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">성별 분포</h2>
                <div className="text-center text-sm text-gray-600 mb-4">총 {stats.total}명</div>
                <div className="flex items-center justify-center gap-8">
                    <ResponsiveContainer width="60%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                        innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                             <Tooltip 
                               contentStyle={{
                                 backgroundColor: '#000000',
                                 color: '#ffffff',
                                 border: 'none',
                                 borderRadius: '8px',
                                 fontSize: '12px'
                               }}
                             />
                  </PieChart>
                </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {genderData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-sm font-medium">{entry.name}</span>
                        <span className="text-sm text-gray-600">{entry.value}명</span>
                        <span className="text-sm text-gray-500">({((entry.value / stats.total) * 100).toFixed(1)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
    
              {/* 면적별 분포 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">면적별 분포</h2>
                
                {/* 연령대별 탭 */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {['전체', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대'].map((ageGroup) => {
                    return (
                      <button
                        key={ageGroup}
                        onClick={() => setSelectedAgeGroupArea(ageGroup)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedAgeGroupArea === ageGroup
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {ageGroup}
                      </button>
                    );
                  })}
                </div>
    
                {/* 선택된 연령대의 데이터 표시 */}
                {(() => {
                  // 현재 탭에 해당하는 데이터만 사용
                  const currentData = activeTab === '전체통계' ? csvData : 
                    csvData.filter(row => {
                      const building = row.건물명 || '';
                      if (activeTab === '대교아파트 1동') return building.includes('1동');
                      if (activeTab === '대교아파트 2동') return building.includes('2동');
                      if (activeTab === '대교아파트 3동') return building.includes('3동');
                      if (activeTab === '대교아파트 4동') return building.includes('4동');
                      return false;
                    });
                  
                  // 연령대별 필터링 적용
                  const filteredData = selectedAgeGroupArea === '전체' ? currentData : 
                    currentData.filter(row => {
                      if (!row.주민번호 || row.주민번호.length < 7) return false;
                      const birthYear = parseInt(row.주민번호.substring(0, 2));
                      const currentYear = new Date().getFullYear();
                      let fullBirthYear;
                      
                      if (birthYear <= 30) {
                        fullBirthYear = 2000 + birthYear;
                      } else {
                        fullBirthYear = 1900 + birthYear;
                      }
                      
                      const age = currentYear - fullBirthYear;
                      const ageGroup = selectedAgeGroupArea;
                      
                      if (ageGroup === '20대') return age >= 20 && age < 30;
                      if (ageGroup === '30대') return age >= 30 && age < 40;
                      if (ageGroup === '40대') return age >= 40 && age < 50;
                      if (ageGroup === '50대') return age >= 50 && age < 60;
                      if (ageGroup === '60대') return age >= 60 && age < 70;
                      if (ageGroup === '70대') return age >= 70 && age < 80;
                      if (ageGroup === '80대') return age >= 80 && age < 90;
                      if (ageGroup === '90대') return age >= 90;
                      
                      return true;
                    });
                  
                  // 면적별 데이터 처리
                  const areas = {};
                  filteredData.forEach(row => {
                    const area = parseFloat(row['전용면적_제곱미터']) || 0;
                    if (area > 0) {
                      const areaKey = `${area}㎡`;
                      areas[areaKey] = (areas[areaKey] || 0) + 1;
                    }
                  });
                  
                  const areaData = Object.entries(areas)
                    .map(([area, count]) => {
                      const total = filteredData.length;
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                      return { area, count, percentage };
                    })
                    .sort((a, b) => b.count - a.count);
                  
                  console.log('면적별 데이터:', { currentData: currentData.length, filteredData: filteredData.length, areaData });
                  
                  return (
                    <>
                      <div className="text-center text-sm text-gray-600 mb-4">
                        총 {filteredData.length}세대 ({selectedAgeGroupArea})
                      </div>
                      <div className="flex items-center justify-center gap-8">
                        <ResponsiveContainer width="60%" height={300}>
                  <PieChart>
                    <Pie
                              data={areaData}
                      cx="50%"
                      cy="50%"
                              innerRadius={50}
                      outerRadius={90}
                      dataKey="count"
                            >
                              {areaData.map((entry, index) => {
                                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];
                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                              })}
                    </Pie>
                             <Tooltip 
                               contentStyle={{
                                 backgroundColor: '#000000',
                                 color: '#ffffff',
                                 border: 'none',
                                 borderRadius: '8px',
                                 fontSize: '12px'
                               }}
                             />
                  </PieChart>
                </ResponsiveContainer>
                        
                        <div className="flex-1 space-y-2">
                          {areaData.map((entry, index) => {
                            const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];
                            return (
                              <div key={index} className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded" 
                                  style={{ backgroundColor: colors[index % colors.length] }}
                                ></div>
                                <span className="text-sm text-gray-800 whitespace-nowrap">
                                  {entry.area} · {entry.count}세대 ({entry.percentage}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
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
                             <Tooltip 
                               contentStyle={{
                                 backgroundColor: '#000000',
                                 color: '#ffffff',
                                 border: 'none',
                                 borderRadius: '8px',
                                 fontSize: '12px'
                               }}
                             />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2">보유 기간</div>
              </div>
    
              {/* 등기이전원인별 분포 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">등기이전원인별 분포</h2>
                
                {/* 연령대별 탭 */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {['전체', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대'].map((ageGroup) => {
                    return (
                      <button
                        key={ageGroup}
                        onClick={() => setSelectedAgeGroupReason(ageGroup)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedAgeGroupReason === ageGroup
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {ageGroup}
                      </button>
                    );
                  })}
                </div>
    
                {/* 선택된 연령대의 데이터 표시 */}
                {(() => {
                  // 현재 탭에 해당하는 데이터만 사용
                  const currentData = activeTab === '전체통계' ? csvData : 
                    csvData.filter(row => {
                      const building = row.건물명 || '';
                      if (activeTab === '대교아파트 1동') return building.includes('1동');
                      if (activeTab === '대교아파트 2동') return building.includes('2동');
                      if (activeTab === '대교아파트 3동') return building.includes('3동');
                      if (activeTab === '대교아파트 4동') return building.includes('4동');
                      return false;
                    });
                  
                  // 연령대별 필터링 적용
                  const filteredData = selectedAgeGroupReason === '전체' ? currentData : 
                    currentData.filter(row => {
                      if (!row.주민번호 || row.주민번호.length < 7) return false;
                      const birthYear = parseInt(row.주민번호.substring(0, 2));
                      const currentYear = new Date().getFullYear();
                      let fullBirthYear;
                      
                      if (birthYear <= 30) {
                        fullBirthYear = 2000 + birthYear;
                      } else {
                        fullBirthYear = 1900 + birthYear;
                      }
                      
                      const age = currentYear - fullBirthYear;
                      const ageGroup = selectedAgeGroupReason;
                      
                      if (ageGroup === '20대') return age >= 20 && age < 30;
                      if (ageGroup === '30대') return age >= 30 && age < 40;
                      if (ageGroup === '40대') return age >= 40 && age < 50;
                      if (ageGroup === '50대') return age >= 50 && age < 60;
                      if (ageGroup === '60대') return age >= 60 && age < 70;
                      if (ageGroup === '70대') return age >= 70 && age < 80;
                      if (ageGroup === '80대') return age >= 80 && age < 90;
                      if (ageGroup === '90대') return age >= 90;
                      
                      return true;
                    });
                  
                  // 등기이전원인 데이터 처리
                  const transferReasons = {};
                  filteredData.forEach(row => {
                    if (row.이전사유) {
                      const reason = row.이전사유.trim();
                      if (reason) {
                        transferReasons[reason] = (transferReasons[reason] || 0) + 1;
                      }
                    }
                  });
                  
                  const reasonData = Object.entries(transferReasons)
                    .map(([reason, count]) => {
                      const total = filteredData.length;
                      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                      return { reason, count, percentage };
                    })
                    .sort((a, b) => b.count - a.count);
                  
                  console.log('등기이전원인 데이터:', { currentData: currentData.length, filteredData: filteredData.length, reasonData });
                  
                  return (
                    <>
                      <div className="text-center text-sm text-gray-600 mb-4">
                        총 {filteredData.length}건 ({selectedAgeGroupReason})
                      </div>
                      <div className="flex items-center justify-center gap-8">
                        <ResponsiveContainer width="60%" height={300}>
                  <PieChart>
                    <Pie
                              data={reasonData}
                      cx="50%"
                      cy="50%"
                              innerRadius={50}
                      outerRadius={90}
                      dataKey="count"
                    >
                              {reasonData.map((entry, index) => {
                        const colors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                             <Tooltip 
                               contentStyle={{
                                 backgroundColor: '#000000',
                                 color: '#ffffff',
                                 border: 'none',
                                 borderRadius: '8px',
                                 fontSize: '12px'
                               }}
                             />
                  </PieChart>
                </ResponsiveContainer>
                        <div className="flex-1 space-y-2">
                          {reasonData.map((entry, index) => {
                            const colors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
                            return (
                              <div key={index} className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: colors[index % colors.length] }}></div>
                                <span className="text-sm font-medium">{entry.reason}</span>
                                <span className="text-sm text-gray-600">{entry.count}건</span>
                                <span className="text-sm text-gray-500">({entry.percentage}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
    
              {/* 대출금액대별 분포 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">대출금액대별 분포</h2>
                
                {/* 연령대별 탭 */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {['전체', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대'].map((ageGroup) => {
                    return (
                      <button
                        key={ageGroup}
                        onClick={() => setSelectedAgeGroupLoan(ageGroup)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedAgeGroupLoan === ageGroup
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {ageGroup}
                      </button>
                    );
                  })}
                </div>
    
                {/* 선택된 연령대의 데이터 표시 */}
                {(() => {
                  // 현재 탭에 해당하는 데이터만 사용
                  const currentData = activeTab === '전체통계' ? csvData : 
                    csvData.filter(row => {
                      const building = row.건물명 || '';
                      if (activeTab === '대교아파트 1동') return building.includes('1동');
                      if (activeTab === '대교아파트 2동') return building.includes('2동');
                      if (activeTab === '대교아파트 3동') return building.includes('3동');
                      if (activeTab === '대교아파트 4동') return building.includes('4동');
                      return false;
                    });
                  
                  // 연령대별 필터링 적용
                  const filteredData = selectedAgeGroupLoan === '전체' ? currentData : 
                    currentData.filter(row => {
                      if (!row.주민번호 || row.주민번호.length < 7) return false;
                      const birthYear = parseInt(row.주민번호.substring(0, 2));
                      const currentYear = new Date().getFullYear();
                      let fullBirthYear;
                      
                      if (birthYear <= 30) {
                        fullBirthYear = 2000 + birthYear;
                      } else {
                        fullBirthYear = 1900 + birthYear;
                      }
                      
                      const age = currentYear - fullBirthYear;
                      const ageGroup = selectedAgeGroupLoan;
                      
                      if (ageGroup === '20대') return age >= 20 && age < 30;
                      if (ageGroup === '30대') return age >= 30 && age < 40;
                      if (ageGroup === '40대') return age >= 40 && age < 50;
                      if (ageGroup === '50대') return age >= 50 && age < 60;
                      if (ageGroup === '60대') return age >= 60 && age < 70;
                      if (ageGroup === '70대') return age >= 70 && age < 80;
                      if (ageGroup === '80대') return age >= 80 && age < 90;
                      if (ageGroup === '90대') return age >= 90;
                      
                      return true;
                    });
                  
                  // 대출금액 데이터 처리
                  const loanRanges = {
                    '1억 미만': 0,
                    '1억대': 0,
                    '2억대': 0,
                    '3억대': 0,
                    '4억대': 0,
                    '5억대': 0,
                    '6억대': 0,
                    '7억대': 0,
                    '8억대': 0,
                    '9억대': 0,
                    '10억 이상': 0
                  };
                  
                  let loanCount = 0; // 실제 대출이 있는 건수
                  filteredData.forEach(row => {
                    const loanAmount = parseFloat(row['근저당액'] || row['유효근저당총액'] || row['근저당총액']) || 0;
                    if (loanAmount > 0) {
                      loanCount++;
                      if (loanAmount < 100000000) {
                        loanRanges['1억 미만']++;
                      } else if (loanAmount < 200000000) {
                        loanRanges['1억대']++;
                      } else if (loanAmount < 300000000) {
                        loanRanges['2억대']++;
                      } else if (loanAmount < 400000000) {
                        loanRanges['3억대']++;
                      } else if (loanAmount < 500000000) {
                        loanRanges['4억대']++;
                      } else if (loanAmount < 600000000) {
                        loanRanges['5억대']++;
                      } else if (loanAmount < 700000000) {
                        loanRanges['6억대']++;
                      } else if (loanAmount < 800000000) {
                        loanRanges['7억대']++;
                      } else if (loanAmount < 900000000) {
                        loanRanges['8억대']++;
                      } else if (loanAmount < 1000000000) {
                        loanRanges['9억대']++;
                      } else {
                        loanRanges['10억 이상']++;
                      }
                    }
                  });
                  
                  const loanData = Object.entries(loanRanges)
                    .map(([range, count]) => ({ range, count }))
                    .sort((a, b) => {
                      const order = ['1억 미만', '1억대', '2억대', '3억대', '4억대', '5억대', '6억대', '7억대', '8억대', '9억대', '10억 이상'];
                      return order.indexOf(a.range) - order.indexOf(b.range);
                    });
                  
                  console.log('대출금액 데이터:', { currentData: currentData.length, filteredData: filteredData.length, loanCount, loanData });
                  
                  return (
                    <>
                      <div className="text-center text-sm text-gray-600 mb-4">
                        총 {loanCount}명 (대출자 기준, {selectedAgeGroupLoan})
                      </div>
                <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={loanData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                             <Tooltip 
                               contentStyle={{
                                 backgroundColor: '#000000',
                                 color: '#ffffff',
                                 border: 'none',
                                 borderRadius: '8px',
                                 fontSize: '12px'
                               }}
                             />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 text-center mt-2">대출금액</div>
                    </>
                  );
                })()}
              </div>
    
              {/* 대출 여부 비율 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">대출 여부 비율</h2>
                <div className="text-center text-sm text-gray-600 mb-4">총 {stats.total}명</div>
                <div className="flex items-center justify-center gap-8">
                    <ResponsiveContainer width="60%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.loanStatusData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(stats.loanStatusData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                             <Tooltip 
                               contentStyle={{
                                 backgroundColor: '#000000',
                                 color: '#ffffff',
                                 border: 'none',
                                 borderRadius: '8px',
                                 fontSize: '12px'
                               }}
                             />
                  </PieChart>
                </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {(stats.loanStatusData || []).map((entry, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-sm font-medium">{entry.name}</span>
                        <span className="text-sm text-gray-600">{entry.value}명</span>
                        <span className="text-sm text-gray-500">({entry.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
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
    
            {/* AI 보고서 생성 섹션 */}
            <div className="mt-8">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                      <span className="text-4xl">🤖</span>
                      AI 분석 보고서
                    </h2>
                    <p className="text-emerald-100 text-lg">
                      Google Gemini가 데이터를 분석하여 전문가 수준의 인사이트를 자동으로 생성합니다
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                        <span>⚡</span>
                        <span>약 3-5초 소요</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                        <span>📊</span>
                        <span>상세 통계 포함</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                        <span>💡</span>
                        <span>맞춤형 제언</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    className={`ml-8 px-8 py-4 rounded-xl font-bold text-lg transition-all transform shadow-2xl ${
                      isGeneratingReport
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-white text-emerald-600 hover:bg-emerald-50 hover:scale-105'
                    }`}
                    //onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                  >
                    {isGeneratingReport ? (
                      <span className="flex items-center gap-3">
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span>AI 분석 중...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <span>보고서 생성하기</span>
                      </span>
                    )}
                  </button>
                </div>
    
                {/* 현재 선택된 분석 대상 */}
                <div className="mt-6 pt-6 border-t border-emerald-400/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 px-4 py-2 rounded-lg">
                        <div className="text-emerald-100 text-xs mb-1">분석 대상</div>
                        <div className="text-white text-xl font-bold">{activeTab}</div>
                      </div>
                      <div className="bg-white/20 px-4 py-2 rounded-lg">
                        <div className="text-emerald-100 text-xs mb-1">총 세대수</div>
                        <div className="text-white text-xl font-bold">{stats.total || 0}세대</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-emerald-100 text-sm mb-1">보고서에 포함되는 내용</div>
                      <div className="flex gap-2 text-xs">
                        <span className="bg-white/20 px-2 py-1 rounded">📊 통계</span>
                        <span className="bg-white/20 px-2 py-1 rounded">🤖 AI 분석</span>
                        <span className="bg-white/20 px-2 py-1 rounded">💡 제언</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
}
    