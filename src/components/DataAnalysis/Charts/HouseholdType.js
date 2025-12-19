import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import './ChartCard.css';

const HouseholdType = ({ data, total }) => {
  const COLORS = ['#f59e0b', '#8b5cf6'];

  return (
    <div className="chart-card">
      <h3 className="chart-card__title">세대 유형 분포</h3>
      <p className="chart-card__subtitle">총 {total}세대</p>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            itemStyle={{ color: '#ffffff' }}
            labelStyle={{ color: '#ffffff' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="chart-card__stats">
        {data.map((item, index) => (
          <div key={index} className="chart-card__stat-item">
            <div 
              className="chart-card__stat-color" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="chart-card__stat-label">{item.name}:</span>
            <span className="chart-card__stat-value">{item.value}세대</span>
            <span className="chart-card__stat-percentage">
              ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(HouseholdType);

