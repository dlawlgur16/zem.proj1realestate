/**
 * CSV/XLSX 파일 업로드 라우트
 */

const express = require('express');
const multer = require('multer');
const Papa = require('papaparse');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { preprocessData } = require('../services/preprocessor');
const { extractBuildingName, parseXLSX, convertToDBFormat } = require('../services/fileProcessor');
const { saveToDatabase } = require('../services/buildingService');

const router = express.Router();

// 파일 업로드 설정
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const isCSV = file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv');
    const isXLSX = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   file.mimetype === 'application/vnd.ms-excel' ||
                   file.originalname.toLowerCase().endsWith('.xlsx') ||
                   file.originalname.toLowerCase().endsWith('.xls');
    
    if (isCSV || isXLSX) {
      cb(null, true);
    } else {
      cb(new Error('CSV 또는 XLSX 파일만 업로드 가능합니다.'), false);
    }
  }
});

/**
 * POST /api/upload/csv
 * CSV/XLSX 파일 업로드 및 DB 저장
 */
router.post('/csv', authMiddleware, adminOnly, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    const originalName = req.file.originalname;
    const buildingName = extractBuildingName(originalName);
    
    if (!buildingName) {
      return res.status(400).json({ error: '파일명에서 건물명을 추출할 수 없습니다.' });
    }

    const isXLSX = originalName.toLowerCase().endsWith('.xlsx') || 
                   originalName.toLowerCase().endsWith('.xls');
    
    console.log(`📄 파일 업로드: ${buildingName}`);
    console.log(`   파일명: ${originalName}`);
    console.log(`   형식: ${isXLSX ? 'XLSX' : 'CSV'}`);
    console.log(`   크기: ${req.file.size} bytes`);

    let rawData = [];
    let dbData;

    if (isXLSX) {
      // XLSX 처리
      rawData = parseXLSX(req.file.buffer);
      console.log(`   원시 데이터 행 수: ${rawData.length}개`);
      
      // 전처리
      console.log('🔄 XLSX 파일 전처리 시작...');
      const processedData = preprocessData(rawData);
      console.log(`   전처리 완료: ${processedData.length}개 행`);
      
      if (processedData.length === 0) {
        return res.status(400).json({ 
          error: '전처리 후 데이터가 없습니다.', 
          message: '파일 형식이나 데이터 구조를 확인해주세요.' 
        });
      }
      
      dbData = convertToDBFormat(processedData, buildingName);
    } else {
      // CSV 처리
      const csvText = req.file.buffer.toString('utf-8');
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true
      });

      if (parseResult.errors.length > 0) {
        console.warn('⚠️ CSV 파싱 경고:', parseResult.errors);
      }

      rawData = parseResult.data;
      console.log(`   데이터 행 수: ${rawData.length}개`);
      dbData = convertToDBFormat(rawData, buildingName);
    }

    if (!dbData || dbData.units.length === 0) {
      return res.status(400).json({ 
        error: 'DB 형식 변환 후 데이터가 없습니다.', 
        message: '데이터 구조를 확인해주세요.' 
      });
    }

    console.log(`   DB 형식 변환 완료: ${dbData.units.length}개 세대`);

    // DB 저장
    const result = await saveToDatabase(dbData);

    res.json({
      success: true,
      message: '파일이 성공적으로 업로드되고 DB에 저장되었습니다.',
      building: {
        id: result.buildingId,
        name: result.buildingName
      },
      units: {
        total: result.actualHouseholdCount,
        inserted: result.inserted,
        records: result.totalRecords
      }
    });

  } catch (error) {
    console.error('❌ 파일 업로드 실패:', error);
    res.status(500).json({
      error: '파일 업로드 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

module.exports = router;
