const express = require('express');
const router = express.Router();
const aiReportService = require('../services/aiReport');

// AI 리포트 생성 엔드포인트
router.post('/generate-report', async (req, res) => {
  try {
    const { data, activeTab } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ 
        error: '유효한 데이터가 필요합니다.' 
      });
    }

    const report = await aiReportService.generateReport(data, activeTab);
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('리포트 생성 오류:', error);
    res.status(500).json({ 
      error: '리포트 생성 중 오류가 발생했습니다.',
      message: error.message 
    });
  }
});

// 리포트 템플릿 조회
router.get('/templates', async (req, res) => {
  try {
    const templates = await aiReportService.getTemplates();
    
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('템플릿 조회 오류:', error);
    res.status(500).json({ 
      error: '템플릿 조회 중 오류가 발생했습니다.',
      message: error.message 
    });
  }
});

module.exports = router;
