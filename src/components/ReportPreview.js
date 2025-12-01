import React from 'react';

export default function ReportPreview({ reportContent, onClose, onDownload }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-3xl">📄</span>
            AI 분석 보고서
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onDownload('markdown')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <span>📝</span>
              Markdown
            </button>
            <button
              onClick={() => onDownload('html')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <span>🌐</span>
              HTML
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ✕ 닫기
            </button>
          </div>
        </div>

        {/* 보고서 내용 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="prose prose-lg max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
              {reportContent}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
