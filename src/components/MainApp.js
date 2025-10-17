import React, { useState } from 'react';
import CsvLoader from './CsvLoader/CsvLoader';
import DataAnalysis from './DataAnalysis/DataAnalysis';
import ReportGenerator from './ReportGenerator/ReportGenerator';
import './MainApp.css';

const MainApp = () => {
  const [csvData, setCsvData] = useState(null);
  const [activeTab, setActiveTab] = useState('전체통계');
  const [currentStep, setCurrentStep] = useState('upload'); // upload, analysis, report
  const [error, setError] = useState(null);

  const handleDataLoad = (data) => {
    setCsvData(data);
    setError(null);
    setCurrentStep('analysis');
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleReportGenerated = (report) => {
    setCurrentStep('report');
  };

  const resetApp = () => {
    setCsvData(null);
    setActiveTab('전체통계');
    setCurrentStep('upload');
    setError(null);
  };

  return (
    <div className="main-app">
      <div className="main-app__header">
        <h1 className="main-app__title">재건축 데이터 분석 시스템</h1>
        <div className="main-app__steps">
          <div className={`main-app__step ${currentStep === 'upload' ? 'main-app__step--active' : ''}`}>
            <div className="main-app__step-number">1</div>
            <div className="main-app__step-label">데이터 업로드</div>
          </div>
          <div className={`main-app__step ${currentStep === 'analysis' ? 'main-app__step--active' : ''}`}>
            <div className="main-app__step-number">2</div>
            <div className="main-app__step-label">데이터 분석</div>
          </div>
          <div className={`main-app__step ${currentStep === 'report' ? 'main-app__step--active' : ''}`}>
            <div className="main-app__step-number">3</div>
            <div className="main-app__step-label">리포트 생성</div>
          </div>
        </div>
      </div>

      <div className="main-app__content">
        {currentStep === 'upload' && (
          <CsvLoader
            onDataLoad={handleDataLoad}
            onError={handleError}
          />
        )}

        {currentStep === 'analysis' && csvData && (
          <DataAnalysis
            csvData={csvData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}

        {currentStep === 'report' && csvData && (
          <ReportGenerator
            csvData={csvData}
            activeTab={activeTab}
            onReportGenerated={handleReportGenerated}
          />
        )}

        {error && (
          <div className="main-app__error">
            <p>{error}</p>
            <button onClick={resetApp} className="main-app__reset-button">
              처음부터 다시 시작
            </button>
          </div>
        )}
      </div>

      <div className="main-app__navigation">
        {currentStep === 'analysis' && (
          <button
            onClick={() => setCurrentStep('report')}
            className="main-app__nav-button main-app__nav-button--primary"
          >
            리포트 생성으로 이동
          </button>
        )}
        
        {currentStep === 'report' && (
          <button
            onClick={() => setCurrentStep('analysis')}
            className="main-app__nav-button main-app__nav-button--secondary"
          >
            분석으로 돌아가기
          </button>
        )}

        {csvData && (
          <button
            onClick={resetApp}
            className="main-app__nav-button main-app__nav-button--secondary"
          >
            새 데이터 업로드
          </button>
        )}
      </div>
    </div>
  );
};

export default MainApp;
