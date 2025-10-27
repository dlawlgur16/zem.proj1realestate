/**
 * 전처리된 데이터 API 라우트
 */

const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');

const router = express.Router();

// 전처리된 데이터 디렉토리
const processedDataDir = path.join(__dirname, '../processed-data');

/**
 * 전처리된 데이터 목록 조회
 */
router.get('/', async (req, res) => {
  try {
    const files = await fs.readdir(processedDataDir);
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    
    const dataList = await Promise.all(
      csvFiles.map(async (file) => {
        const filePath = path.join(processedDataDir, file);
        const stats = await fs.stat(filePath);
        
        return {
          id: file.replace('.csv', ''),
          name: file.replace('_전처리_', ' - ').replace('.csv', ''),
          fileName: file,
          processedAt: stats.mtime.toISOString(),
          totalRecords: 0 // CSV에서는 미리 계산하기 어려움
        };
      })
    );
    
    // 최신순으로 정렬
    dataList.sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));
    
    res.json({
      success: true,
      data: dataList
    });
    
  } catch (error) {
    console.error('전처리된 데이터 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '전처리된 데이터 목록을 가져올 수 없습니다.'
    });
  }
});

/**
 * 특정 전처리된 데이터 조회
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(processedDataDir, `${id}.csv`);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        error: '전처리된 데이터를 찾을 수 없습니다.'
      });
    }
    
    // CSV 파일 읽기 (csv-parser 사용)
    const data = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    res.json({
      success: true,
      data: data,
      metadata: {
        totalRecords: data.length,
        columns: data.length > 0 ? Object.keys(data[0]) : []
      }
    });
    
  } catch (error) {
    console.error('전처리된 데이터 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '전처리된 데이터를 가져올 수 없습니다.'
    });
  }
});

/**
 * 전처리된 데이터 통계 조회
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(processedDataDir, `${id}.csv`);
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({
        success: false,
        error: '전처리된 데이터를 찾을 수 없습니다.'
      });
    }
    
    // CSV 파일 읽기 (csv-parser 사용)
    const processedData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          processedData.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    // 기본 통계 계산
    const stats = {
      totalRecords: processedData.length,
      ageGroups: {},
      genderGroups: {},
      residenceTypes: {},
      ownershipTypes: {},
      mortgageStatus: {},
      seizureStatus: {},
      transferReasons: {}
    };
    
    processedData.forEach(row => {
      // 나이대별 분포 (생년월일 기반)
      if (row.생년월일) {
        const birthYear = parseInt(row.생년월일.substring(0, 4));
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;
        
        let ageGroup;
        if (age < 20) ageGroup = '10대';
        else if (age < 30) ageGroup = '20대';
        else if (age < 40) ageGroup = '30대';
        else if (age < 50) ageGroup = '40대';
        else if (age < 60) ageGroup = '50대';
        else if (age < 70) ageGroup = '60대';
        else if (age < 80) ageGroup = '70대';
        else if (age < 90) ageGroup = '80대';
        else ageGroup = '90대';
        
        stats.ageGroups[ageGroup] = (stats.ageGroups[ageGroup] || 0) + 1;
      }
      
      // 거주형태별 분포
      const residenceType = row.거주형태 || '정보없음';
      stats.residenceTypes[residenceType] = (stats.residenceTypes[residenceType] || 0) + 1;
      
      // 소유형태별 분포
      const ownershipType = row.소유형태 || '정보없음';
      stats.ownershipTypes[ownershipType] = (stats.ownershipTypes[ownershipType] || 0) + 1;
      
      // 근저당 설정 여부
      const mortgageStatus = row.근저당설정여부 || 'N';
      stats.mortgageStatus[mortgageStatus] = (stats.mortgageStatus[mortgageStatus] || 0) + 1;
      
      // 압류/가압류 여부
      const seizureStatus = row.압류가압류 === '없음' ? 'N' : 'Y';
      stats.seizureStatus[seizureStatus] = (stats.seizureStatus[seizureStatus] || 0) + 1;
      

    });
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('전처리된 데이터 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: '전처리된 데이터 통계를 가져올 수 없습니다.'
    });
  }
});

module.exports = router;
