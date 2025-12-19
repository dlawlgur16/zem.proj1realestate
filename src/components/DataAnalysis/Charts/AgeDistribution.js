import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ChartCard.css';

const AgeDistribution = ({ data, total }) => {
  const ageData = Object.entries(data || {})
    .map(([range, count]) => ({ 
      range, 
      count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => {
      // '사업자'는 '법인'으로 통일
      const order = ['미성년', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대', '90대 이상', '미분류', '법인'];
      return order.indexOf(a.range) - order.indexOf(b.range);
    });

  return (
    <div className="chart-card">
      <h3 className="chart-card__title">연령대</h3>
      <p className="chart-card__subtitle">총 {total}명</p>

      <ResponsiveContainer width="100%" height={300}>
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
