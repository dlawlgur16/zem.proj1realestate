/**
 * 프로젝트 인덱스 페이지
 * 정적 프로젝트와 사용자 프로젝트를 모두 표시하는 메인 페이지
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staticProjects } from '../data/staticProjects';
import { loadProjectData } from '../utils/dataLoader';
import { loadBuildingsAsProjects, uploadCSV } from '../utils/api';
import { isAdmin, clearSession } from '../utils/auth';
import ProjectCard from '../components/ProjectCard';
import './ProjectIndex.css';

const ProjectIndex = () => {
  const navigate = useNavigate();
  const [allProjects, setAllProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      // 정적 프로젝트들 로드
      let projects = [...staticProjects];

      // DB에서 건물 목록 가져오기
      try {
        const dbProjects = await loadBuildingsAsProjects();
        if (dbProjects && dbProjects.length > 0) {
          projects = [...projects, ...dbProjects];
        }
      } catch (error) {
        // DB 프로젝트 로드 실패 (서버가 실행 중이 아닐 수 있음)
      }

      setAllProjects(projects);
    } catch (error) {
      // 프로젝트 목록 로드 실패
    }
  };

  const handleProjectSelect = async (project) => {
    setIsLoading(true);
    
    try {
      
      // 프로젝트 데이터 로드
      const projectData = await loadProjectData(project);
      
      // 분석 페이지로 이동 (프로젝트 정보와 데이터를 함께 전달)
      navigate('/app/analysis', { 
        state: { 
          project, 
          projectData 
        } 
      });
      
    } catch (error) {
      alert('프로젝트 데이터를 로드할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleLogout = () => {
    clearSession();
    navigate('/');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // CSV 또는 XLSX 파일만 허용
    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const isXLSX = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

    if (!isCSV && !isXLSX) {
      alert('CSV 또는 XLSX 파일만 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadCSV(file);
      alert(`파일이 성공적으로 업로드되었습니다!\n\n건물명: ${result.building.name}\n세대 수: ${result.units.inserted}개`);

      // 프로젝트 목록 새로고침
      await loadProjects();

      // 파일 input 초기화
      event.target.value = '';
    } catch (error) {
      setUploadError(error.message);
      alert(`업로드 실패: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProjectDelete = async (projectId) => {
    try {
      if (projectId.startsWith('db-')) {
        const { buildingsAPI } = await import('../utils/api');
        await buildingsAPI.delete(projectId);
      } else {
        const { deleteUserProject } = await import('../utils/dataLoader');
        deleteUserProject(projectId);
      }

      await loadProjects();
      alert('프로젝트가 삭제되었습니다.');
    } catch (error) {
      alert(`삭제 실패: ${error.message}`);
    }
  };

  return (
    <div className="project-index">
      {/* 상단 바 */}
      <div className="top-bar">
        <div className="top-bar-first">
          <div className="logo">
            <img 
              className="logo-img" 
              src={process.env.PUBLIC_URL + "/image/logo.png"} 
              alt="H-ANALYTICS"
              onError={(e) => {
                console.error('로고 이미지 로드 실패:', '/image/logo.png');
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiM2NjdlZWEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SC1BTkFMWVRJQ1M8L3RleHQ+PC9zdmc+';
              }}
            />
          </div>
          <div className="vertical-dash"></div>
          <h1>The chart</h1>
        </div>
        <div className="top-bar-second">
          <h1>재건축 아파트 조합원 분석</h1>
          <div className="vertical-dash"></div>
          <button className="logout-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="center-content">
        <div className="content-header">
          <h2>프로젝트 선택</h2>
          <p>분석할 재건축 아파트 프로젝트를 선택하거나 새 파일(CSV/XLSX)을 업로드하세요.</p>
        </div>

        {/* CSV 파일 업로드 섹션 (관리자만) */}
        {isAdmin() && (
          <div className="upload-section">
            <div className="upload-card">
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 15L12 12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>새 파일 업로드</h3>
              <p>재건축 아파트 데이터 CSV 또는 XLSX 파일을 업로드하여 분석하세요.</p>
              <label className="upload-button">
                {isUploading ? '업로드 중...' : '파일 선택 (CSV/XLSX)'}
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  style={{ display: 'none' }}
                />
              </label>
              {uploadError && (
                <div className="upload-error">
                  {uploadError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 프로젝트 그리드 */}
        <div className="select-container">
          {allProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={handleProjectSelect}
              onDelete={handleProjectDelete}
            />
          ))}
        </div>
      </div>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>프로젝트 데이터를 로드하는 중...</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectIndex;
