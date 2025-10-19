import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './ChartCard.css';

const ResidenceInvestment = ({ data, total, selectedAgeGroup, setSelectedAgeGroup }) => {
  return (
    <div className="chart-card">
      <h3 className="chart-card__title">거주/투자 비율</h3>
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
        <ResponsiveContainer width="60%" height={300}>
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={data || []}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              labelLine={true}
              label={({ name, percent, value }) => `${name}\n${value}세대 (${(percent * 100).toFixed(1)}%)`}
              dataKey="value"
            >
              {(data || []).map((entry, index) => (
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
        
        <div className="chart-card__legend chart-card__legend--left">
          {(data || []).map((entry, index) => (
            <div key={index} className="chart-card__legend-item">
              <div 
                className="chart-card__legend-color" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="chart-card__legend-label">{entry.name}</span>
              <span className="chart-card__legend-value">{entry.value}세대</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ResidenceInvestment);
