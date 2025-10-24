import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './ChartCard.css';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

const TransferReason = ({ data, total, selectedAgeGroup, setSelectedAgeGroup, availableAgeGroups }) => {
  const reasonData = Object.entries(data || {})
    .map(([reason, count], index) => ({ 
      name: reason, 
      value: count, 
      color: COLORS[index % COLORS.length] 
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="chart-card">
      <h3 className="chart-card__title">등기이전원인별 분포</h3>
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

      <div className="chart-card__content">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={reasonData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent, value }) => `${name}\n${value}건 (${(percent * 100).toFixed(1)}%)`}
              innerRadius={40}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {reasonData.map((entry, index) => (
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
          {reasonData.map((item, index) => (
            <div key={index} className="chart-card__legend-item">
              <div 
                className="chart-card__legend-color" 
                style={{ backgroundColor: item.color }}
              />
              <span className="chart-card__legend-label">{item.name}</span>
              <span className="chart-card__legend-value">{item.value}건</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransferReason;
