import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ChartCard.css';

const LoanAmount = ({ data, total, selectedAgeGroup, setSelectedAgeGroup, availableAgeGroups }) => {
  const loanData = Object.entries(data || {})
    .map(([range, count]) => ({ range, count }))
    .sort((a, b) => {
      const order = ['1억 미만', '1억대', '2억대', '3억대', '4억대', '5억대', '6억대', '7억대', '8억대', '9억대', '10억 이상'];
      return order.indexOf(a.range) - order.indexOf(b.range);
    });

  return (
    <div className="chart-card">
      <h3 className="chart-card__title">대출금액대별 분포</h3>
      <p className="chart-card__subtitle">총 {total}명 (대출자 기준)</p>
      
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
    </div>
  );
};

export default LoanAmount;
