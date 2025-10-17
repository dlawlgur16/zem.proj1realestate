import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ChartCard.css';

const HoldingPeriod = ({ data, total, selectedAgeGroup, setSelectedAgeGroup }) => {
  const holdingData = Object.entries(data || {})
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => {
      // 1년 미만을 가장 앞으로, 30년 이상을 가장 뒤로
      if (a.period === '1년 미만') return -1;
      if (b.period === '1년 미만') return 1;
      if (a.period === '30년 이상') return 1;
      if (b.period === '30년 이상') return -1;
      
      const aYear = parseInt(a.period.replace('년', ''));
      const bYear = parseInt(b.period.replace('년', ''));
      return aYear - bYear;
    });

  return (
    <div className="chart-card">
      <h3 className="chart-card__title">보유기간별 분포</h3>
      <p className="chart-card__subtitle">총 {total}세대</p>
      
      <div className="chart-card__tabs">
        {['전체', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대'].map((ageGroup) => (
          <button
            key={ageGroup}
            onClick={() => setSelectedAgeGroup(ageGroup)}
            className={`chart-card__tab ${
              selectedAgeGroup === ageGroup ? 'chart-card__tab--active' : ''
            }`}
          >
            {ageGroup}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={holdingData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
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
          <Bar dataKey="count" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HoldingPeriod;
