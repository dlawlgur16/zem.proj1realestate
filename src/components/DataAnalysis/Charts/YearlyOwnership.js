import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ChartCard.css';

const YearlyOwnership = ({ data, total, selectedAgeGroup, setSelectedAgeGroup, availableAgeGroups }) => {
  const yearlyData = Object.entries(data || {})
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));

  return (
    <div className="chart-card">
      <h3 className="chart-card__title">연도별 소유권 변동</h3>
      <p className="chart-card__subtitle">총 {total}건</p>
      
      <div className="chart-card__tabs">
        {(availableAgeGroups || []).map((ageGroup) => (
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

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={yearlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
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

export default YearlyOwnership;
