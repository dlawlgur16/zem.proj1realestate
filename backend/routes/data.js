const express = require('express');
const router = express.Router();
const dataAnalysisService = require('../services/dataAnalysis');

// 데이터 분석 엔드포인트
router.post('/analyze', async (req, res) => {
  try {
    const { data, activeTab } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ 
        error: '유효한 데이터가 필요합니다.' 
      });
    }

    const analysisResult = await dataAnalysisService.analyzeData(data, activeTab);
    
    res.json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    console.error('데이터 분석 오류:', error);
    res.status(500).json({ 
      error: '데이터 분석 중 오류가 발생했습니다.',
      message: error.message 
    });
  }
});

// 통계 요약 엔드포인트
router.get('/summary', async (req, res) => {
  try {
    const { data } = req.query;
    
    if (!data) {
      return res.status(400).json({ 
        error: '데이터가 필요합니다.' 
      });
    }

    const parsedData = JSON.parse(data);
    const summary = await dataAnalysisService.generateSummary(parsedData);
    
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('통계 요약 오류:', error);
    res.status(500).json({ 
      error: '통계 요약 생성 중 오류가 발생했습니다.',
      message: error.message 
    });
  }
});

module.exports = router;
