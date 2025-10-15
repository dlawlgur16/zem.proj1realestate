import React, { useState } from 'react';
import Papa from 'papaparse';

export default function FileUpload({ onDataLoad, onError }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    
    // CSV 파일인지 확인
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onError('CSV 파일만 업로드 가능합니다.');
      return;
    }

    setIsLoading(true);
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        console.log('업로드된 데이터 개수:', results.data.length);
        
        if (results.data.length === 0) {
          onError('CSV 파일에 데이터가 없습니다.');
          setIsLoading(false);
          return;
        }

        // 데이터 로드 성공
        onDataLoad(results.data);
        setIsLoading(false);
      },
      error: (error) => {
        console.error('CSV 파싱 오류:', error);
        onError('CSV 파일을 읽는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    handleFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${isDragOver ? 'drag-over' : ''} ${isLoading ? 'loading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isLoading ? (
          <div className="upload-loading">
            <div className="spinner"></div>
            <p>CSV 파일을 처리 중입니다...</p>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            <h3>CSV 파일 업로드</h3>
            <p>파일을 드래그하거나 클릭하여 업로드하세요</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" className="upload-button">
              파일 선택
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
