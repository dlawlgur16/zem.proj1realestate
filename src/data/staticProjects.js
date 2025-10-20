/**
 * 정적 프로젝트 데이터 설정
 * 개발자가 미리 설정한 기본 프로젝트들
 */

export const staticProjects = [
  {
    id: 'banpo',
    name: '반포 미도1차아파트',
    address: '서울특별시 서초구 반포동 60-4',
    type: 'static',
    dataFile: '/data/banpo-data.csv',
    image: process.env.PUBLIC_URL + '/image/img_chart-02.jpg',
    description: '반포동 재개발 아파트 조합원 분석'
  },
  {
    id: 'seobinggo',
    name: '서빙고 신동아아파트',
    address: '서울특별시 용산구 이촌로 347',
    type: 'static',
    dataFile: '/data/seobinggo-data.csv',
    image: process.env.PUBLIC_URL + '/image/img_chart-03.jpg',
    description: '서빙고동 재개발 아파트 조합원 분석'
  },
  {
    id: 'hannamheights',
    name: '한남 하이츠',
    address: '서울특별시 성동구 독서당로 156',
    type: 'static',
    dataFile: '/data/hannamheights-data.csv',
    image: process.env.PUBLIC_URL + '/image/img_chart-04.jpg',
    description: '한남동 재개발 아파트 조합원 분석'
  },
  {
    id: 'mokdong12',
    name: '목동신시가지아파트 12단지',
    address: '서울특별시 양천구 목동동로 50',
    type: 'static',
    dataFile: '/data/mokdong12-data.csv',
    image: process.env.PUBLIC_URL + '/image/img_chart-05.jpg',
    description: '목동 재개발 아파트 조합원 분석'
  },
  {
    id: 'cheonghwa',
    name: '이태원동 청화아파트',
    address: '서울특별시 용산구 장문로 27',
    type: 'static',
    dataFile: '/data/cheonghwa-data.csv',
    image: process.env.PUBLIC_URL + '/image/img_chart-02.jpg',
    description: '이태원동 재개발 아파트 조합원 분석'
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
