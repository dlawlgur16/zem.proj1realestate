/**
 * 프로젝트 인덱스 페이지
 * 정적 프로젝트와 사용자 프로젝트를 모두 표시하는 메인 페이지
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staticProjects } from '../data/staticProjects';
import { loadProjectData } from '../utils/dataLoader';
import ProjectCard from '../components/ProjectCard';
import './ProjectIndex.css';

const ProjectIndex = () => {
  const navigate = useNavigate();
  const [allProjects, setAllProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    try {
      // 정적 프로젝트들만 표시
      setAllProjects(staticProjects);
      
      console.log('📁 프로젝트 목록 로드 완료:', {
        정적: staticProjects.length
      });
    } catch (error) {
      console.error('❌ 프로젝트 목록 로드 실패:', error);
    }
  };

  const handleProjectSelect = async (project) => {
    setIsLoading(true);
    
    try {
      console.log('🎯 프로젝트 선택:', project.name);
      
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
      console.error('❌ 프로젝트 데이터 로드 실패:', error);
      alert('프로젝트 데이터를 로드할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleLogout = () => {
    // 로그아웃 처리 (auth.js의 clearSession 사용)
    localStorage.removeItem('session');
    navigate('/');
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
          <p>분석할 재건축 아파트 프로젝트를 선택하세요.</p>
        </div>

        {/* 프로젝트 그리드 */}
        <div className="select-container">
          {allProjects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={handleProjectSelect}
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
