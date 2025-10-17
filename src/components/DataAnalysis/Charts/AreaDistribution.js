import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './ChartCard.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const AreaDistribution = ({ data, total, selectedAgeGroup, setSelectedAgeGroup }) => {
  const areaData = Object.entries(data || {})
    .map(([range, count], index) => ({ 
      name: range, 
      value: count, 
      color: COLORS[index % COLORS.length] 
    }))
    .sort((a, b) => {
      // 면적값을 숫자로 추출하여 정렬
      const aArea = parseFloat(a.name.replace('㎡', ''));
      const bArea = parseFloat(b.name.replace('㎡', ''));
      return aArea - bArea;
    });

  return (
    <div className="chart-card">
      <h3 className="chart-card__title">면적별 분포</h3>
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

      <div className="chart-card__content">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={areaData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent, value }) => `${name}\n${value}세대 (${(percent * 100).toFixed(1)}%)`}
              innerRadius={40}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {areaData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
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
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="chart-card__legend">
          {areaData.map((item, index) => (
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

export default React.memo(AreaDistribution);
