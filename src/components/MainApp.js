import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import CsvLoader from './CsvLoader/CsvLoader';
import DataAnalysis from './DataAnalysis/DataAnalysis';
import ReportGenerator from './ReportGenerator';
import { getSession, clearSession } from '../utils/auth';
import './MainApp.css';

const MainApp = () => {
  const [csvData, setCsvData] = useState(null);
  const [activeTab, setActiveTab] = useState('전체통계');
  const [currentStep, setCurrentStep] = useState('upload'); // upload, analysis, report
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 인증 상태 확인
  useEffect(() => {
    const currentSession = getSession();
    setSession(currentSession);
    setIsLoading(false);
  }, []);

  // 로딩 중일 때는 로딩 화면 표시
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 디버깅 로그 (필요시에만)
  // console.log('MainApp statsData:', statsData);

  const handleDataLoad = (data) => {
    setCsvData(data);
    setError(null);
    setCurrentStep('analysis');
    setStatsData(null); // 새로운 데이터 로드 시 통계 초기화
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

  const handleLogout = () => {
    clearSession();
    window.location.href = '/login';
  };

  return (
    <div className="main-app">
      <div className="main-app__header">
        <div className="main-app__header-top">
          <h1 className="main-app__title">재건축 데이터 분석 시스템</h1>
          <div className="main-app__user-info">
            <span className="main-app__user-name">{session.username} ({session.role})</span>
            <button 
              onClick={handleLogout}
              className="main-app__logout-btn"
            >
              로그아웃
            </button>
          </div>
        </div>
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
            onStatsUpdate={(newStats) => {
              console.log('📊 MainApp에서 통계 데이터 받음:', newStats);
              console.log('📊 newStats keys:', Object.keys(newStats));
              console.log('📊 activeTab:', activeTab);
              if (newStats[activeTab]) {
                console.log('📊 activeTab 데이터:', newStats[activeTab]);
                console.log('📊 ageGroups:', newStats[activeTab].ageGroups);
                console.log('📊 transferReasons:', newStats[activeTab].transferReasons);
                console.log('📊 areaGroups:', newStats[activeTab].areaGroups);
                console.log('📊 holdingGroups:', newStats[activeTab].holdingGroups);
                console.log('📊 totalLoanAmount:', newStats[activeTab].totalLoanAmount);
                console.log('📊 averageLoanAmount:', newStats[activeTab].averageLoanAmount);
              } else {
                console.log('❌ MainApp에서 activeTab 데이터 없음');
                console.log('❌ newStats:', newStats);
                console.log('❌ activeTab:', activeTab);
              }
              setStatsData(prevStats => {
                const updatedStats = {
                  ...prevStats,
                  ...newStats
                };
                console.log('📊 MainApp statsData 업데이트:', updatedStats);
                return updatedStats;
              });
            }}
          />
        )}

        {currentStep === 'report' && csvData && (
          <ReportGenerator
            csvData={csvData}
            activeTab={activeTab}
            statsData={statsData}
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
