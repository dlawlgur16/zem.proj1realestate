import React, { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReconstructionAnalysis() {
  const [activeTab, setActiveTab] = useState('전체통계');

  // 실제 CSV 데이터 기반 통계 (하드코딩)
  const statsData = {
    '전체통계': {
      total: 576,
      ageData: [
        { range: '20대', count: 327 },
        { range: '30대', count: 47 },
        { range: '40대', count: 59 },
        { range: '50대', count: 46 },
        { range: '60대', count: 60 },
        { range: '70대', count: 37 }
      ],
      residenceCount: 429,
      investmentCount: 147,
      male: 302,
      female: 273,
      regionData: [
        { region: '서울 기타', count: 86 },
        { region: '서울 강북구', count: 10 },
        { region: '서울 강동구', count: 8 },
        { region: '서울 서초구', count: 8 },
        { region: '서울 강서구', count: 8 }
      ],
      areaData: [
        { range: '95.5㎡ (29평)', count: 288, percentage: 50.0, color: '#10b981' },
        { range: '151.74㎡ (46평)', count: 144, percentage: 25.0, color: '#3b82f6' },
        { range: '133.65㎡ (40평)', count: 144, percentage: 25.0, color: '#ec4899' }
      ]
    },
    '대교아파트 1동': {
      total: 144,
      ageData: [
        { range: '20대', count: 84 },
        { range: '30대', count: 12 },
        { range: '40대', count: 12 },
        { range: '50대', count: 8 },
        { range: '60대', count: 15 },
        { range: '70대', count: 13 }
      ],
      residenceCount: 110,
      investmentCount: 34,
      male: 76,
      female: 68,
      regionData: [
        { region: '서울 기타', count: 20 },
        { region: '서울 강북구', count: 3 },
        { region: '서울 서초구', count: 2 },
        { region: '서울 강동구', count: 2 },
        { region: '서울 강남구', count: 2 }
      ],
      areaData: [
        { range: '95.5㎡ (29평)', count: 72, percentage: 50.0, color: '#10b981' },
        { range: '151.74㎡ (46평)', count: 36, percentage: 25.0, color: '#3b82f6' },
        { range: '133.65㎡ (40평)', count: 36, percentage: 25.0, color: '#ec4899' }
      ]
    },
    '대교아파트 2동': {
      total: 144,
      ageData: [
        { range: '20대', count: 82 },
        { range: '30대', count: 11 },
        { range: '40대', count: 15 },
        { range: '50대', count: 12 },
        { range: '60대', count: 14 },
        { range: '70대', count: 10 }
      ],
      residenceCount: 108,
      investmentCount: 36,
      male: 75,
      female: 69,
      regionData: [
        { region: '서울 기타', count: 22 },
        { region: '서울 강북구', count: 3 },
        { region: '서울 강동구', count: 2 },
        { region: '서울 서초구', count: 2 },
        { region: '서울 은평구', count: 2 }
      ],
      areaData: [
        { range: '95.5㎡ (29평)', count: 72, percentage: 50.0, color: '#10b981' },
        { range: '151.74㎡ (46평)', count: 36, percentage: 25.0, color: '#3b82f6' },
        { range: '133.65㎡ (40평)', count: 36, percentage: 25.0, color: '#ec4899' }
      ]
    },
    '대교아파트 3동': {
      total: 144,
      ageData: [
        { range: '20대', count: 80 },
        { range: '30대', count: 12 },
        { range: '40대', count: 16 },
        { range: '50대', count: 13 },
        { range: '60대', count: 15 },
        { range: '70대', count: 8 }
      ],
      residenceCount: 106,
      investmentCount: 38,
      male: 77,
      female: 67,
      regionData: [
        { region: '서울 기타', count: 23 },
        { region: '서울 강북구', count: 2 },
        { region: '서울 서초구', count: 2 },
        { region: '서울 강서구', count: 2 },
        { region: '서울 용산구', count: 2 }
      ],
      areaData: [
        { range: '95.5㎡ (29평)', count: 72, percentage: 50.0, color: '#10b981' },
        { range: '151.74㎡ (46평)', count: 36, percentage: 25.0, color: '#3b82f6' },
        { range: '133.65㎡ (40평)', count: 36, percentage: 25.0, color: '#ec4899' }
      ]
    },
    '대교아파트 4동': {
      total: 144,
      ageData: [
        { range: '20대', count: 81 },
        { range: '30대', count: 12 },
        { range: '40대', count: 16 },
        { range: '50대', count: 13 },
        { range: '60대', count: 16 },
        { range: '70대', count: 6 }
      ],
      residenceCount: 105,
      investmentCount: 39,
      male: 74,
      female: 69,
      regionData: [
        { region: '서울 기타', count: 21 },
        { region: '서울 강북구', count: 2 },
        { region: '서울 강동구', count: 2 },
        { region: '서울 강서구', count: 2 },
        { region: '서울 마포구', count: 2 }
      ],
      areaData: [
        { range: '95.5㎡ (29평)', count: 72, percentage: 50.0, color: '#10b981' },
        { range: '151.74㎡ (46평)', count: 36, percentage: 25.0, color: '#3b82f6' },
        { range: '133.65㎡ (40평)', count: 36, percentage: 25.0, color: '#ec4899' }
      ]
    }
  };

  const stats = statsData[activeTab];
  const tabs = ['전체통계', '대교아파트 1동', '대교아파트 2동', '대교아파트 3동', '대교아파트 4동'];

  // 연도별 소유권 변동 (전체 공통)
  const ownershipData = [
    { year: '2003', count: 1 },
    { year: '2005', count: 10 },
    { year: '2006', count: 26 },
    { year: '2007', count: 27 },
    { year: '2008', count: 30 },
    { year: '2009', count: 32 },
    { year: '2010', count: 29 },
    { year: '2011', count: 29 },
    { year: '2012', count: 29 },
    { year: '2013', count: 29 },
    { year: '2014', count: 29 },
    { year: '2015', count: 36 },
    { year: '2016', count: 26 },
    { year: '2017', count: 34 },
    { year: '2018', count: 26 },
    { year: '2019', count: 30 },
    { year: '2020', count: 30 },
    { year: '2021', count: 32 },
    { year: '2022', count: 29 },
    { year: '2023', count: 36 },
    { year: '2024', count: 26 }
  ];

  const residenceData = [
    { name: '거주', value: stats.residenceCount, percentage: ((stats.residenceCount/stats.total)*100).toFixed(1), color: '#10b981' },
    { name: '투자', value: stats.investmentCount, percentage: ((stats.investmentCount/stats.total)*100).toFixed(1), color: '#3b82f6' }
  ];

  const genderData = [
    { name: '남', value: stats.male, color: '#3b82f6' },
    { name: '여', value: stats.female, color: '#ec4899' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">대교아파트 조합원 분석 | PDF ⬇</h1>
        </div>
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
              <BarChart data={stats.ageData}>
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
            <div className="text-center text-sm text-gray-600 mb-4">총 {stats.investmentCount}명</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.regionData} layout="vertical">
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
              <BarChart data={ownershipData}>
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
                  data={stats.areaData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="count"
                  label={({ range, count, percentage }) => `${range.split('㎡')[0]}\n${count}세대\n(${percentage}%)`}
                >
                  {stats.areaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 추가 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
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
            <div className="text-sm text-gray-500 mb-2">선택 탭</div>
            <div className="text-xl font-bold text-purple-600">{activeTab}</div>
            <div className="text-xs text-gray-400 mt-1">현재 보기</div>
          </div>
        </div>
      </div>
    </div>
  );
}

