/**
 * 프로젝트 카드 컴포넌트
 * 개별 프로젝트를 표시하는 카드
 */

import React from 'react';
import './ProjectCard.css';

const ProjectCard = ({ project, onSelect, onDelete }) => {
  const handleClick = () => {
    onSelect(project);
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    if (window.confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까?`)) {
      onDelete(project.id);
    }
  };

  return (
    <div className="project-card" onClick={handleClick}>
      <div className="project-card-image">
        <img 
          src={project.image} 
          alt={project.name}
          onError={(e) => {
            console.error('이미지 로드 실패:', project.image);
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNmI3MjgwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngCDsl7Dsl6w8L3RleHQ+PC9zdmc+';
          }}
        />
        <div className="project-card-type">
          {project.type === 'static' ? '기본' : '사용자'}
        </div>
      </div>
      
      <div className="project-card-content">
        <div className="project-card-header">
          <h3 className="project-card-title">{project.name}</h3>
          {project.type === 'user' && (
            <button 
              className="project-card-delete"
              onClick={handleDelete}
              title="프로젝트 삭제"
            >
              ×
            </button>
          )}
        </div>
        
        <p className="project-card-address">{project.address}</p>
        {project.description && (
          <p className="project-card-description">{project.description}</p>
        )}
        
        <div className="project-card-footer">
          <span className="project-card-arrow">→</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
