// try this version
import React, { useState } from 'react';
import Papa from 'papaparse';

export default function FileUpload({ onDataLoad, onError }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = (file) => {
    console.log('📂 [1] handleFile 호출됨');
    console.log('받은 파일:', file);
    if (!file) return;
    
    // CSV 파일인지 확인
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onError('CSV 파일만 업로드 가능합니다.');
      return;
    }
    console.log('✅ [1-3] CSV 파일 확인 완료:', file.name);

    setIsLoading(true);
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        console.log('📊 [3] Papa.parse 완료');
        console.log('rows 개수:', results.data.length);
        console.log('파싱된 데이터 샘플:', results.data.slice(0, 3));
        console.log('업로드된 데이터 개수:', results.data.length);
        
        if (results.data.length === 0) {
          onError('CSV 파일에 데이터가 없습니다.');
          setIsLoading(false);
          return;
        }

        // 데이터 로드 성공
        onDataLoad(results.data);
        console.log('✅ [FileUpload] onDataLoad 존재 여부:', typeof onDataLoad);
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
  console.log('🟢 FileUpload 렌더링됨');
  console.log('isLoading:', isLoading, 'isDragOver:', isDragOver);
  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${isDragOver ? 'drag-over' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={() => console.log('🟡 file-upload-area 클릭됨')}
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

  <label
            className="upload-button"
            onClick={() => console.log('✅ label 클릭됨')}
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              position: 'relative', // ✅ 반드시 추가
              overflow: 'hidden'
            }}
          >
            파일 선택
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                console.log('📂 input onChange 실행됨, 파일:', e.target.files[0]);
                handleFileSelect(e);
              }}
              style={{
                opacity: 0,
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer'
              }}
            />
          </label>
        </div>
          // <div className="upload-content">
          //   <div className="upload-icon">📁</div>
          //   <h3>CSV 파일 업로드</h3>
          //   <p>파일을 드래그하거나 클릭하여 업로드하세요</p>
          //   <input
          //     type="file"
          //     accept=".csv"
          //     onChange={handleFileSelect}
          //     style={{ display: 'none' }}
          //     id="file-input"
          //   />
          //   <label
          //     className="upload-button"
          //     onClick={() => console.log('✅ 파일 선택 버튼 클릭됨')}
          //   >
          //   </label>
          // </div>
        )}
      </div>
    </div>
  );
}