import React, { useState } from 'react';
import './ReportGenerator.css';

const ReportGenerator = ({ csvData, activeTab, onReportGenerated }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      // 백엔드 API 호출
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: csvData,
          activeTab,
        }),
      });

      if (!response.ok) {
        throw new Error('리포트 생성에 실패했습니다.');
      }

      const result = await response.json();
      setReport(result.report);
      onReportGenerated(result.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const element = document.createElement('a');
    const file = new Blob([report], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `재건축_분석_보고서_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="report-generator">
      <div className="report-generator__header">
        <h2 className="report-generator__title">AI 분석 보고서</h2>
        <p className="report-generator__description">
          업로드된 데이터를 기반으로 AI가 자동으로 분석 보고서를 생성합니다.
        </p>
      </div>

      <div className="report-generator__actions">
        <button
          onClick={generateReport}
          disabled={loading || !csvData}
          className="report-generator__button report-generator__button--primary"
        >
          {loading ? '리포트 생성 중...' : '리포트 생성'}
        </button>

        {report && (
          <button
            onClick={downloadReport}
            className="report-generator__button report-generator__button--secondary"
          >
            보고서 다운로드
          </button>
        )}
      </div>

      {error && (
        <div className="report-generator__error">
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="report-generator__loading">
          <div className="spinner"></div>
          <p>AI가 데이터를 분석하고 있습니다...</p>
        </div>
      )}

      {report && (
        <div className="report-generator__preview">
          <h3 className="report-generator__preview-title">생성된 보고서 미리보기</h3>
          <div className="report-generator__content">
            <pre>{report}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;
