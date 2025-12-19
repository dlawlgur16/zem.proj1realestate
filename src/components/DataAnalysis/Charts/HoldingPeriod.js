import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ChartCard.css';

const HoldingPeriod = ({ data, total, selectedAgeGroup, setSelectedAgeGroup, availableAgeGroups }) => {
  // 보유기간을 4개 구간으로 재분류
  const reclassifiedData = {};
  
  Object.entries(data || {}).forEach(([period, count]) => {
    const years = parseFloat(period.replace('년', '').replace(' 미만', '').replace(' 이상', ''));
    
    if (years < 3) {
      reclassifiedData['3년 미만'] = (reclassifiedData['3년 미만'] || 0) + count;
    } else if (years >= 3 && years < 7) {
      reclassifiedData['3~7년'] = (reclassifiedData['3~7년'] || 0) + count;
    } else if (years >= 7 && years < 15) {
      reclassifiedData['7~15년'] = (reclassifiedData['7~15년'] || 0) + count;
    } else {
      reclassifiedData['15년 이상'] = (reclassifiedData['15년 이상'] || 0) + count;
    }
  });

  const holdingData = Object.entries(reclassifiedData)
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => {
      const order = ['3년 미만', '3~7년', '7~15년', '15년 이상'];
      return order.indexOf(a.period) - order.indexOf(b.period);
    });

  return (
    <div className="chart-card">
      <h3 className="chart-card__title">보유기간별 분포</h3>
      <p className="chart-card__subtitle">총 {total}세대</p>
      
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
