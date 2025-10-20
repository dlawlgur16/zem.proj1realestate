/**
 * 새 프로젝트 추가 모달 컴포넌트
 * 사용자가 새 프로젝트를 추가할 수 있는 모달
 */

import React, { useState } from 'react';
import Papa from 'papaparse';
import './AddProjectModal.css';

const AddProjectModal = ({ isOpen, onClose, onAddProject }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: ''
  });
  const [csvFile, setCsvFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setError('');
    } else {
      setError('CSV 파일만 업로드 가능합니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('프로젝트명을 입력해주세요.');
      return;
    }
    
    if (!csvFile) {
      setError('CSV 파일을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // CSV 파일을 텍스트로 읽기
      const csvText = await csvFile.text();
      
      // PapaParse로 파싱
      const parsedData = Papa.parse(csvText, { 
        header: true,
        skipEmptyLines: true
      });

      if (parsedData.errors.length > 0) {
        throw new Error('CSV 파일 형식이 올바르지 않습니다.');
      }

      // 새 프로젝트 객체 생성
      const newProject = {
        id: `user_${Date.now()}`,
        name: formData.name.trim(),
        address: formData.address.trim(),
        description: formData.description.trim(),
        type: 'user',
        data: parsedData.data,
        image: 'https://via.placeholder.com/400x200/6b7280/ffffff?text=새+프로젝트', // 기본 이미지
        createdAt: new Date().toISOString()
      };

      // 부모 컴포넌트에 전달
      onAddProject(newProject);
      
      // 폼 초기화
      setFormData({ name: '', address: '', description: '' });
      setCsvFile(null);
      onClose();
      
    } catch (error) {
      console.error('프로젝트 추가 실패:', error);
      setError(error.message || '프로젝트 추가 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', address: '', description: '' });
    setCsvFile(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>새 프로젝트 추가</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="project-name">프로젝트명 *</label>
            <input
              type="text"
              id="project-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="예: 반포 미도1차아파트"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="project-address">주소</label>
            <input
              type="text"
              id="project-address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="예: 서울특별시 서초구 반포동 60-4"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="project-description">설명</label>
            <input
              type="text"
              id="project-description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="예: 반포동 재개발 아파트 조합원 분석"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="csv-file">CSV 파일 *</label>
            <input
              type="file"
              id="csv-file"
              accept=".csv"
              onChange={handleFileChange}
              required
            />
            <p className="file-help">CSV 파일을 선택해주세요. (주민번호, 전용면적 등 컬럼 포함)</p>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="modal-actions">
            <button type="button" onClick={handleClose} className="btn-cancel">
              취소
            </button>
            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading ? '추가 중...' : '프로젝트 추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal;
