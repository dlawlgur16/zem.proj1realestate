import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ChartCard.css';

const InvestorResidence = ({ data, total }) => {
  // 지역명 축약 매핑
  const districtMapping = {
    '경기도': '경기',
    '서울특별시': '서울',
    '서울시': '서울',
    '부산광역시': '부산',
    '부산시': '부산',
    '대구광역시': '대구',
    '대구시': '대구',
    '대전광역시': '대전',
    '대전시': '대전',
    '울산광역시': '울산',
    '울산시': '울산',
    '인천광역시': '인천',
    '인천시': '인천',
    '광주광역시': '광주',
    '광주시': '광주',
    '강원도': '강원',
    '강원특별자치도': '강원',
    '충청북도': '충북',
    '충북': '충북',
    '충청남도': '충남',
    '충남': '충남',
    '전라북도': '전북',
    '전북': '전북',
    '전라남도': '전남',
    '전남': '전남',
    '경상북도': '경북',
    '경북': '경북',
    '경상남도': '경남',
    '경남': '경남',
    '제주특별자치도': '제주',
    '제주도': '제주',
    '미국': '미국',
    '중국': '중국',
    '일본': '일본',
    '베트남': '베트남',
    '태국': '태국',
    '필리핀': '필리핀',
    '인도네시아': '인도네시아',
    '말레이시아': '말레이시아',
    '싱가포르': '싱가포르',
    '홍콩': '홍콩',
    '대만': '대만',
    '캐나다': '캐나다',
    '호주': '호주',
    '뉴질랜드': '뉴질랜드',
    '영국': '영국',
    '독일': '독일',
    '프랑스': '프랑스',
    '이탈리아': '이탈리아',
    '스페인': '스페인',
    '러시아': '러시아',
    '브라질': '브라질',
    '멕시코': '멕시코',
    '아르헨티나': '아르헨티나',
    '칠레': '칠레',
    '콜롬비아': '콜롬비아',
    '페루': '페루',
    '에콰도르': '에콰도르',
    '볼리비아': '볼리비아',
    '파라과이': '파라과이',
    '우루과이': '우루과이',
    '베네수엘라': '베네수엘라',
    '가이아나': '가이아나',
    '수리남': '수리남',
    '프랑스령 기아나': '프랑스령 기아나',
    '기타': '기타',
    '정보없음': '정보없음'
  };

  const residenceData = Object.entries(data || {})
    .map(([district, count]) => {
      // 지역명 축약
      const shortDistrict = districtMapping[district] || district;
      return { 
        district: shortDistrict, 
        count: Number(count)
      };
    })
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

      <ResponsiveContainer width="100%" height={320}>
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
