/**
 * 프로젝트 데이터 로더 유틸리티
 * 정적 파일과 사용자 데이터를 로드하는 함수들
 */

import Papa from 'papaparse';

/**
 * 정적 프로젝트 데이터 로드 (서버에서 CSV 파일 로드)
 */
const resolveAssetUrl = (pathOrUrl) => {
  if (!pathOrUrl) return pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = process.env.PUBLIC_URL || '';
  const suffix = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${suffix}`;
};

export const loadStaticProjectData = async (dataFile) => {
  try {
    const response = await fetch(resolveAssetUrl(dataFile));

    if (!response.ok) {
      throw new Error(`파일을 찾을 수 없습니다: ${dataFile}`);
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    throw error;
  }
};

/**
 * 전처리된 프로젝트 데이터 로드 (정적 파일에서 CSV 로드)
 */
export const loadProcessedProjectData = async (dataFile) => {
  try {
    const response = await fetch(resolveAssetUrl(dataFile));
    if (!response.ok) {
      throw new Error(`전처리된 데이터를 가져올 수 없습니다: ${dataFile}`);
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    throw error;
  }
};

/**
 * 사용자 프로젝트 데이터 로드 (LocalStorage에서 로드)
 */
export const loadUserProjectData = (project) => {
  if (!project.data) {
    throw new Error('프로젝트 데이터가 없습니다.');
  }
  return project.data;
};

/**
 * 사용자 프로젝트 목록 로드 (LocalStorage에서)
 */
export const loadUserProjects = () => {
  try {
    const userProjects = JSON.parse(localStorage.getItem('userProjects') || '[]');
    return userProjects;
  } catch (error) {
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
    return true;
  } catch (error) {
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
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * DB에서 프로젝트 데이터 로드
 */
export const loadProjectDataFromDB = async (project) => {
  const { loadBuildingDataFromDB } = require('./api');

  const buildingId = project.buildingId || project.id?.replace('db-', '');
  if (!buildingId) {
    throw new Error('건물 ID가 없습니다.');
  }

  const data = await loadBuildingDataFromDB(buildingId);
  return data;
};

/**
 * 프로젝트 데이터 로드 (타입에 따라 자동 선택)
 */
export const loadProjectData = async (project) => {
  if (project.type === 'db') {
    return await loadProjectDataFromDB(project);
  }

  if (project.type === 'static') {
    return await loadStaticProjectData(project.dataFile);
  } else if (project.type === 'user') {
    return loadUserProjectData(project);
  } else if (project.type === 'processed') {
    return await loadProcessedProjectData(project.dataFile);
  } else {
    throw new Error('알 수 없는 프로젝트 타입입니다.');
  }
};
