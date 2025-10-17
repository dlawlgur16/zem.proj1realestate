import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ChartCard.css';

const AgeDistribution = ({ data, total, selectedAgeGroup, setSelectedAgeGroup }) => {
  const ageData = Object.entries(data || {})
    .map(([range, count]) => ({ range, count }))
    .filter(item => {
      if (selectedAgeGroup === '전체') return true;
      return item.range === selectedAgeGroup;
    })
    .sort((a, b) => {
      const order = ['10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대'];
      return order.indexOf(a.range) - order.indexOf(b.range);
    });

  return (
    <div className="chart-card">
      <h3 className="chart-card__title">나이대 분포</h3>
      <p className="chart-card__subtitle">총 {total}명</p>
      
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
        <BarChart data={ageData}>
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
    </div>
  );
};

export default React.memo(AgeDistribution);
