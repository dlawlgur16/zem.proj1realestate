import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './ChartCard.css';

const COLORS = ['#f59e0b', '#8b5cf6'];

const HouseholdType = ({ data, total }) => {
  const householdData = (data || []).map((item, index) => ({
    name: item.name,
    value: item.value,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="chart-card">
      <h3 className="chart-card__title">세대 유형 분포</h3>
      <p className="chart-card__subtitle">총 {total}세대</p>

      <div className="chart-card__content">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={householdData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent, value }) => `${name}\n${value}세대 (${(percent * 100).toFixed(1)}%)`}
              innerRadius={40}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {householdData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ zIndex: 9999 }}
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.85)',
                color: '#ffffff',
                border: '1px solid #333',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#ffffff' }}
              labelStyle={{ color: '#ffffff' }}
              formatter={(value, name) => [`${value}`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="chart-card__legend">
          {householdData.map((item, index) => (
            <div key={index} className="chart-card__legend-item">
              <div 
                className="chart-card__legend-color" 
                style={{ backgroundColor: item.color }}
              />
              <span className="chart-card__legend-label">{item.name}</span>
              <span className="chart-card__legend-value">{item.value}세대</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(HouseholdType);

