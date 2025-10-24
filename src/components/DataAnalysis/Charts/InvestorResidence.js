import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ChartCard.css';

const InvestorResidence = ({ data, total }) => {
  const residenceData = Object.entries(data || {})
    .map(([district, count]) => ({ 
      district, 
      count: Number(count) // 명시적으로 숫자로 변환
    }))
    .sort((a, b) => b.count - a.count); // 내림차순 정렬 (모든 데이터 표시)

  console.log('🏠 투자자 거주지역 데이터:', residenceData);
  console.log('🏠 원본 데이터:', data);
  console.log('🏠 총 인원:', total);

  // 데이터가 없을 때 처리
  if (!residenceData || residenceData.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-card__title">투자자 거주지역</h3>
        <p className="chart-card__subtitle">총 {total}명</p>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          거주지역 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <h3 className="chart-card__title">투자자 거주지역</h3>
      <p className="chart-card__subtitle">총 {total}명</p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={residenceData}
          margin={{ top: 20, right: 20, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="district" 
            tick={{ fontSize: 8 }}
            angle={-45}
            textAnchor="end"
            tichMargin={12}
            interval={0}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            domain={[0, 'dataMax']}
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="count" fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(InvestorResidence);
