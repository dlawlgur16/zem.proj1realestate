/**
 * 정적 프로젝트 데이터 설정
 * 개발자가 미리 설정한 기본 프로젝트들
 */

export const staticProjects = [
  {
    id: 'data-csv',
    name: '여의도 대교아파트',
    address: '서울특별시 영등포구 여의도동',
    type: 'static',
    dataFile: '/data/data.csv',
    image: process.env.PUBLIC_URL + '/image/img_chart-02.jpg',
    description: '여의도 대교아파트 조합원 분석'
  },
  {
    id: 'sample-csv',
    name: '샘플 데이터',
    address: '서울특별시',
    type: 'static',
    dataFile: '/data/sample.csv',
    image: process.env.PUBLIC_URL + '/image/img_chart-03.jpg',
    description: '샘플 데이터 분석'
  },
  {
    id: 'cheongha-apartment',
    name: '청하아파트 578세대',
    address: '서울시 중랑구 면목동 110-1',
    type: 'static',
    dataFile: '/data/청하아파트_578세대_실제데이터100퍼센트반영.csv',
    image: process.env.PUBLIC_URL + '/image/img_chart-02.jpg',
    description: '청하아파트 578세대 재건축 조합원 분석'
  },
  {
    id: 'processed-data',
    name: '전처리된 데이터',
    address: '자동 전처리 시스템',
    type: 'processed',
    dataFile: 'http://localhost:5001/api/processed',
    image: process.env.PUBLIC_URL + '/image/img_chart-02.jpg',
    description: '백엔드에서 자동으로 전처리된 데이터'
  }
];

/**
 * 프로젝트 타입별 필터링
 */
export const getProjectsByType = (type) => {
  return staticProjects.filter(project => project.type === type);
};

/**
 * 프로젝트 ID로 검색
 */
export const getProjectById = (id) => {
  return staticProjects.find(project => project.id === id);
};
