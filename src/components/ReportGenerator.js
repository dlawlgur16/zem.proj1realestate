// ============================================
// src/components/ReportGenerator.js (최종 버전)
// ============================================

import React, { useState } from 'react';
import { 
  generateHybridReport, 
  downloadAsMarkdown, 
  downloadAsHTML 
} from '../utils/geminiReportGenerator';
import ReportPreview from './ReportPreview';

//디버깅
console.log("🧩 process.env keys:", Object.keys(process.env));
console.log("🔑 GEMINI:", process.env.REACT_APP_GEMINI_API_KEY);
// .env 파일에서 API 키 불러오기
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;


export default function ReportGenerator({ statsData, activeTab, csvData }) {
  const [showReport, setShowReport] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 디버깅 로그
  console.log('📊 ReportGenerator props:', { statsData, activeTab, csvData });
  console.log('📊 statsData keys:', statsData ? Object.keys(statsData) : '없음');
  if (statsData && statsData[activeTab]) {
    console.log('📊 activeTab 데이터:', statsData[activeTab]);
    console.log('📊 ageGroups:', statsData[activeTab].ageGroups);
    console.log('📊 transferReasons:', statsData[activeTab].transferReasons);
    console.log('📊 areaGroups:', statsData[activeTab].areaGroups);
    console.log('📊 holdingGroups:', statsData[activeTab].holdingGroups);
    console.log('📊 totalLoanAmount:', statsData[activeTab].totalLoanAmount);
    console.log('📊 averageLoanAmount:', statsData[activeTab].averageLoanAmount);
    console.log('📊 ageInsights:', statsData[activeTab].ageInsights);
    
    // ageInsights 상세 디버깅
    if (statsData[activeTab].ageInsights) {
      console.log('📊 ReportGenerator ageInsights 상세 분석:');
      Object.entries(statsData[activeTab].ageInsights).forEach(([age, insight]) => {
        console.log(`📊 ${age}:`, {
          loanRate: insight.loanRate,
          avgLoan: insight.avgLoan,
          residenceRate: insight.residenceRate,
          seizureRate: insight.seizureRate
        });
      });
    } else {
      console.log('❌ ReportGenerator에서 ageInsights 데이터가 없습니다!');
    }
  } else {
    console.log('❌ ReportGenerator에서 activeTab 데이터 없음');
    console.log('❌ statsData:', statsData);
    console.log('❌ activeTab:', activeTab);
  }

  // 보고서 생성
  const handleGenerateReport = async () => {
    console.log('=== 보고서 생성 시작 ===');
    console.log('statsData:', statsData);
    console.log('activeTab:', activeTab);
    console.log('csvData 길이:', csvData ? csvData.length : '없음');
    
    // 통계 데이터 체크
    if (!statsData || !statsData[activeTab]) {
      alert('⚠️ 통계 데이터가 없습니다.\n먼저 데이터 분석을 완료해주세요.');
      console.error('통계 데이터 없음:', statsData);
      return;
    }
    
    // API 키 체크
    if (!GEMINI_API_KEY) {
      alert('⚠️ API 키가 설정되지 않았습니다.\n.env 파일에 REACT_APP_GEMINI_API_KEY를 설정해주세요.');
      console.error('환경변수 REACT_APP_GEMINI_API_KEY가 설정되지 않았습니다.');
      return;
    }
    
    // 실제 Gemini API 사용
    console.log('✅ 유효한 API 키로 Gemini API 사용');

    console.log('API 키 확인:', GEMINI_API_KEY ? '설정됨' : '설정되지 않음');
    console.log('통계 데이터:', statsData);

    setIsGenerating(true);
    
    try {
      // AI 인사이트 포함하여 보고서 생성
      console.log('📊 generateHybridReport 호출 전 데이터 확인:');
      console.log('📊 statsData[activeTab]:', statsData[activeTab]);
      console.log('📊 ageGroups:', statsData[activeTab]?.ageGroups);
      console.log('📊 ageGroups 비어있나?', !statsData[activeTab]?.ageGroups || Object.keys(statsData[activeTab]?.ageGroups || {}).length === 0);
      
      const report = await generateHybridReport(
        statsData[activeTab], 
        GEMINI_API_KEY,
        csvData
      );
      
      console.log('📄 생성된 보고서:', report);
      console.log('📄 보고서 길이:', report ? report.length : 0);
      setReportContent(report);
      setShowReport(true);
      console.log('📄 showReport 상태 변경:', true);
    } catch (error) {
      console.error('보고서 생성 실패:', error);
      
      // 에러 메시지 개선
      let errorMessage = '보고서 생성 중 오류가 발생했습니다.';
      
      if (error.message.includes('API key') || error.message.includes('API_KEY_INVALID')) {
        errorMessage = '❌ API 키가 유효하지 않습니다.\n.env 파일의 API 키를 확인해주세요.';
      } else if (error.message.includes('quota') || error.message.includes('RATE_LIMIT')) {
        errorMessage = '❌ 일일 사용량(1,500회)을 초과했습니다.\n내일 다시 시도해주세요.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = '❌ 네트워크 오류가 발생했습니다.\n인터넷 연결을 확인해주세요.';
      } else if (error.message.includes('HTML 응답') || error.message.includes('JSON')) {
        errorMessage = '❌ API 키가 잘못되었거나 API 서비스에 문제가 있습니다.\n.env 파일의 API 키를 확인해주세요.';
      } else {
        errorMessage = `❌ ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // 보고서 다운로드
  const handleDownloadReport = (format) => {
    const filename = `${activeTab}_재건축분석보고서`;
    
    if (format === 'markdown') {
      downloadAsMarkdown(reportContent, filename);
    } else if (format === 'html') {
      downloadAsHTML(reportContent, filename);
    }
  };

  return (
    <>
      {/* 보고서 생성 섹션 */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <span className="text-4xl">🤖</span>
              AI 분석 보고서
            </h2>
            <p className="text-emerald-100 text-lg">
              Google Gemini가 데이터를 분석하여 전문가 수준의 인사이트를 자동으로 생성합니다
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <span>⚡</span>
                <span>약 3-5초 소요</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <span>📊</span>
                <span>상세 통계 포함</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <span>💡</span>
                <span>맞춤형 제언</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className={`ml-8 px-8 py-4 rounded-xl font-bold text-lg transition-all transform ${
              isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-white text-emerald-600 hover:bg-emerald-50 hover:scale-105 shadow-2xl'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>AI 분석 중...</span>
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <span>보고서 생성하기</span>
              </span>
            )}
          </button>
        </div>

        {/* 현재 선택된 분석 대상 */}
        <div className="mt-6 pt-6 border-t border-emerald-400/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <div className="text-emerald-100 text-xs mb-1">분석 대상</div>
                <div className="text-white text-xl font-bold">{activeTab}</div>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <div className="text-emerald-100 text-xs mb-1">총 세대수</div>
                <div className="text-white text-xl font-bold">{statsData[activeTab]?.total || 0}세대</div>
              </div>
              <div className="bg-white/20 px-4 py-2 rounded-lg">
                <div className="text-emerald-100 text-xs mb-1">총 대출금액</div>
                <div className="text-white text-xl font-bold">
                  {statsData[activeTab]?.totalLoanAmount 
                    ? `${(statsData[activeTab].totalLoanAmount / 100000000).toFixed(1)}억원`
                    : '0억원'
                  }
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-emerald-100 text-sm mb-1">보고서에 포함되는 내용</div>
              <div className="flex gap-2 text-xs">
                <span className="bg-white/20 px-2 py-1 rounded">📊 통계</span>
                <span className="bg-white/20 px-2 py-1 rounded">🤖 AI 분석</span>
                <span className="bg-white/20 px-2 py-1 rounded">💡 제언</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 보고서 미리보기 모달 */}
      {showReport && (
        <ReportPreview
          reportContent={reportContent}
          onClose={() => setShowReport(false)}
          onDownload={handleDownloadReport}
        />
      )}
    </>
  );
}