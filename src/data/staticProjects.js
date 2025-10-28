/**
 * 정적 프로젝트 데이터 설정
 * 개발자가 미리 설정한 기본 프로젝트들
 */

export const staticProjects = [
  {
    id: 'processed-data',
    name: '전처리된 데이터',
    address: '자동 전처리 시스템',
    type: 'processed',
    dataFile: 'http://localhost:5000/api/processed',
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
