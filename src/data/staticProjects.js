/**
 * 정적 프로젝트 데이터 설정
 * 개발자가 미리 설정한 기본 프로젝트들
 */

export const staticProjects = [
  // 더미 프로젝트 제거 - 이제 processed-projects.json에서 동적으로 로드
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
