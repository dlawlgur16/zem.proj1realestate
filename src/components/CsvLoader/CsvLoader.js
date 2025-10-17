import React, { useState, useCallback } from 'react';
import FileUpload from '../FileUpload';
import './CsvLoader.css';

const CsvLoader = ({ onDataLoad, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDataLoad = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    
    try {
      // 데이터 검증
      const validatedData = validateData(data);
      
      // 부모 컴포넌트로 데이터 전달
      onDataLoad(validatedData);
    } catch (err) {
      const errorMessage = err.message || '데이터 로드 중 오류가 발생했습니다.';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onDataLoad, onError]);

  const validateData = (data) => {
    if (!data || data.length === 0) {
      throw new Error('데이터가 비어있습니다.');
    }

    // 필수 컬럼 검증
    const requiredColumns = ['건물명', '주민번호', '유효근저당총액'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      throw new Error(`필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}`);
    }

    return data;
  };

  return (
    <div className="csv-loader">
      <div className="csv-loader__header">
        <h2 className="csv-loader__title">데이터 업로드</h2>
        <p className="csv-loader__description">
          재건축 분석을 위한 CSV 파일을 업로드하세요.
        </p>
      </div>

      <FileUpload
        onDataLoad={handleDataLoad}
        onError={setError}
      />

      {error && (
        <div className="csv-loader__error">
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="csv-loader__loading">
          <div className="spinner"></div>
          <p>데이터를 처리하고 있습니다...</p>
        </div>
      )}
    </div>
  );
};

export default CsvLoader;
