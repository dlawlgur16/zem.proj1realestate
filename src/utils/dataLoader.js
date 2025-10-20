/**
 * 프로젝트 데이터 로더 유틸리티
 * 정적 파일과 사용자 데이터를 로드하는 함수들
 */

import Papa from 'papaparse';

/**
 * 정적 프로젝트 데이터 로드 (서버에서 CSV 파일 로드)
 */
export const loadStaticProjectData = async (dataFile) => {
  try {
    console.log('📁 정적 프로젝트 데이터 로드:', dataFile);
    const response = await fetch(dataFile);
    
    if (!response.ok) {
      throw new Error(`파일을 찾을 수 없습니다: ${dataFile}`);
    }
    
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log('✅ 정적 데이터 로드 완료:', results.data.length, '행');
          resolve(results.data);
        },
        error: (error) => {
          console.error('❌ 정적 데이터 로드 실패:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('❌ 정적 프로젝트 데이터 로드 실패:', error);
    throw error;
  }
};

/**
 * 사용자 프로젝트 데이터 로드 (LocalStorage에서 로드)
 */
export const loadUserProjectData = (project) => {
  try {
    console.log('👤 사용자 프로젝트 데이터 로드:', project.name);
    
    if (!project.data) {
      throw new Error('프로젝트 데이터가 없습니다.');
    }
    
    console.log('✅ 사용자 데이터 로드 완료:', project.data.length, '행');
    return project.data;
  } catch (error) {
    console.error('❌ 사용자 프로젝트 데이터 로드 실패:', error);
    throw error;
  }
};

/**
 * 사용자 프로젝트 목록 로드 (LocalStorage에서)
 */
export const loadUserProjects = () => {
  try {
    const userProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
    console.log('👤 사용자 프로젝트 목록 로드:', userProjects.length, '개');
    return userProjects;
  } catch (error) {
    console.error('❌ 사용자 프로젝트 목록 로드 실패:', error);
    return [];
  }
};

/**
 * 사용자 프로젝트 저장 (LocalStorage에)
 */
export const saveUserProject = (project) => {
  try {
    const userProjects = loadUserProjects();
    const updatedProjects = [...userProjects, project];
    localStorage.setItem('userProjects', JSON.stringify(updatedProjects));
    console.log('💾 사용자 프로젝트 저장 완료:', project.name);
    return true;
  } catch (error) {
    console.error('❌ 사용자 프로젝트 저장 실패:', error);
    return false;
  }
};

/**
 * 사용자 프로젝트 삭제
 */
export const deleteUserProject = (projectId) => {
  try {
    const userProjects = loadUserProjects();
    const updatedProjects = userProjects.filter(project => project.id !== projectId);
    localStorage.setItem('userProjects', JSON.stringify(updatedProjects));
    console.log('🗑️ 사용자 프로젝트 삭제 완료:', projectId);
    return true;
  } catch (error) {
    console.error('❌ 사용자 프로젝트 삭제 실패:', error);
    return false;
  }
};

/**
 * 프로젝트 데이터 로드 (타입에 따라 자동 선택)
 */
export const loadProjectData = async (project) => {
  if (project.type === 'static') {
    return await loadStaticProjectData(project.dataFile);
  } else if (project.type === 'user') {
    return loadUserProjectData(project);
  } else {
    throw new Error('알 수 없는 프로젝트 타입입니다.');
  }
};

