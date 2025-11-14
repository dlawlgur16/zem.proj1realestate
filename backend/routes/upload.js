/**
 * CSV 파일 업로드 라우트
 * 프론트엔드에서 CSV 파일을 업로드하고 DB에 저장
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const { query } = require('../config/database');
const { preprocessData } = require('../services/preprocessor');

const router = express.Router();

// 임시 파일 저장 설정 (메모리 사용)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
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
 * 주소에서 시/도 추출
 */
function extractCity(address) {
  if (!address) return null;
  const match = address.match(/(서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|경기도|강원도|충청북도|충청남도|전라북도|전라남도|경상북도|경상남도|제주특별자치도)/);
  return match ? match[1] : null;
}

/**
 * 주소에서 구/군 추출
 */
function extractDistrict(address) {
  if (!address) return null;
  const match = address.match(/(\S+구|\S+군|\S+시)/);
  return match ? match[1] : null;
}

/**
 * 동호수에서 동 추출
 */
function extractDong(row) {
  const dongho = row['동호수'] || row['건물명'] || '';
  const match = dongho.match(/(\d+)동/);
  if (match) return `${match[1]}동`;
  // "1 101" 형식 처리
  const spaceMatch = dongho.match(/^(\d+)\s/);
  if (spaceMatch) return `${spaceMatch[1]}동`;
  return null;
}

/**
 * 동호수에서 호 추출
 * "101-1호", "101-2호" 형식도 처리
 */
function extractHo(row) {
  const dongho = row['동호수'] || row['건물명'] || '';
  
  // "101-1호" 형식 처리 (예: "101-1호", "1205-1호")
  const dashMatch = dongho.match(/(\d+-\d+)호/);
  if (dashMatch) return `${dashMatch[1]}호`;
  
  // 일반 "101호" 형식 처리
  const match = dongho.match(/(\d+)호/);
  if (match) return `${match[1]}호`;
  
  // "1 101" 형식 처리
  const spaceMatch = dongho.match(/\s(\d+)$/);
  if (spaceMatch) return `${spaceMatch[1]}호`;
  
  // "101-1" 형식 (호 없이) 처리
  const dashNoHo = dongho.match(/(\d+-\d+)$/);
  if (dashNoHo) return `${dashNoHo[1]}호`;
  
  return null;
}

/**
 * CSV 데이터를 DB 형식으로 변환
 */
function convertToDBFormat(csvData, buildingName) {
  const firstRow = csvData[0] || {};
  const address = firstRow['아파트_소재지'] || firstRow['도로명주소'] || '';
  
  return {
    building: {
      name: buildingName,
      address: address,
      city: extractCity(address),
      district: extractDistrict(address)
    },
    units: csvData.map(row => ({
      dong: extractDong(row),
      ho: extractHo(row),
      area_m2: parseFloat(row['건축물_연면적'] || row['전용면적_제곱미터'] || 0),
      소유자명: row['소유자명'] || null,
      생년월일: row['생년월일'] || null,
      소유자_주소: row['소유자_주소'] || null,
      아파트_소재지: row['아파트_소재지'] || row['도로명주소'] || null,
      건물명: row['건물명'] || null,
      거주형태: row['거주형태'] || null,
      등기목적_분류: row['등기목적_분류'] || null,
      근저당금액: row['근저당금액'] ? parseFloat(row['근저당금액']) : null,
      보유기간: row['보유기간'] || null,
      압류가압류: row['압류가압류'] || null,
      등기원인_년월일: row['등기원인_년월일'] || null,
      전용면적_제곱미터: row['전용면적_제곱미터'] ? parseFloat(row['전용면적_제곱미터']) : null,
      유효근저당총액: row['유효근저당총액'] ? parseFloat(row['유효근저당총액']) : null,
      압류가압류유무: row['압류가압류유무'] || null,
      주민번호: row['주민번호'] || null,
      연령대: row['연령대'] || null,
      공유자수: row['공유자수'] || row['총인원수'] || 1,
      세대유형: row['세대유형'] || (row['공유자수'] > 1 ? '공유세대' : '단독세대')
    }))
  };
}

/**
 * 파일명에서 건물명 추출 (인코딩 문제 해결)
 */
function extractBuildingName(filename) {
  // 파일명 디코딩 시도
  let decodedName = filename;
  try {
    // UTF-8로 디코딩 시도
    if (Buffer.isEncoding('utf-8')) {
      decodedName = Buffer.from(filename, 'latin1').toString('utf-8');
    }
  } catch (e) {
    // 디코딩 실패 시 원본 사용
    decodedName = filename;
  }
  
  // 확장자 제거
  let buildingName = decodedName
    .replace(/_전처리_.*\.(csv|xlsx|xls)$/i, '')
    .replace(/\.(csv|xlsx|xls)$/i, '')
    .trim();
  
  return buildingName || decodedName.replace(/\.(csv|xlsx|xls)$/i, '').trim();
}

/**
 * XLSX 파일을 파싱하여 배열로 변환
 */
function parseXLSX(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // 헤더 없이 파싱 (첫 번째 행도 데이터로 포함)
  // range 옵션으로 전체 범위 지정
  const data = XLSX.utils.sheet_to_json(worksheet, { 
    defval: '',
    header: 1, // 배열 형태로 파싱 (헤더 없음)
    raw: false // 문자열로 변환
  });
  
  // 배열 형태를 객체 형태로 변환 (인덱스 기반)
  // 첫 번째 행이 헤더인 경우를 처리하기 위해, 헤더가 있는지 확인
  if (data.length === 0) {
    return [];
  }
  
  // 첫 번째 행이 헤더인지 확인 (숫자만 있으면 데이터, 텍스트가 많으면 헤더)
  const firstRow = data[0];
  const isHeader = firstRow.some(cell => {
    const str = String(cell || '').trim();
    return str.length > 0 && !/^\d+$/.test(str) && str.length > 2;
  });
  
  if (isHeader) {
    // 헤더가 있으면 두 번째 행부터 데이터로 사용
    const headers = firstRow.map((h, i) => h || `Column${i + 1}`);
    return data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });
  } else {
    // 헤더가 없으면 첫 번째 행부터 데이터로 사용, 인덱스 기반 객체 생성
    return data.map((row, rowIndex) => {
      const obj = {};
      row.forEach((cell, colIndex) => {
        // A=0, B=1, C=2, ... 형태로 키 생성
        const colLetter = String.fromCharCode(65 + colIndex);
        obj[colLetter] = cell || '';
        // 인덱스도 키로 추가
        obj[`_col${colIndex}`] = cell || '';
      });
      return obj;
    });
  }
}

/**
 * DB에 데이터 저장
 */
async function saveToDatabase(dbData, res) {
  try {
    // 건물 생성 또는 찾기
    let building = await query(
      'SELECT * FROM buildings WHERE name = $1',
      [dbData.building.name]
    );

    let buildingId;
    if (building.rows.length > 0) {
      buildingId = building.rows[0].id;
      console.log(`   ✅ 기존 건물 사용 (ID: ${buildingId})`);
    } else {
      const result = await query(
        `INSERT INTO buildings (name, address, city, district) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [
          dbData.building.name,
          dbData.building.address,
          dbData.building.city,
          dbData.building.district
        ]
      );
      buildingId = result.rows[0].id;
      console.log(`   ✅ 새 건물 생성 (ID: ${buildingId})`);
    }

    // 기존 units 삭제 (중복 방지)
    const deletedCount = await query('DELETE FROM units WHERE building_id = $1', [buildingId]);
    console.log(`   🗑️ 기존 세대 데이터 삭제 완료 (삭제된 행: ${deletedCount.rowCount}개)`);
    console.log(`   📊 저장할 세대 데이터: ${dbData.units.length}개`);

    // Units 일괄 삽입
    let inserted = 0;
    let failed = 0;
    for (const unit of dbData.units) {
      try {
        await query(
          `INSERT INTO units (
            building_id, dong, ho, area_m2,
            소유자명, 생년월일, 소유자_주소, 아파트_소재지, 건물명,
            거주형태, 등기목적_분류, 근저당금액, 보유기간, 압류가압류,
            등기원인_년월일, 전용면적_제곱미터, 유효근저당총액, 압류가압류유무,
            주민번호, 연령대, 공유자수, 세대유형
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
          )`,
          [
            buildingId,
            unit.dong,
            unit.ho,
            unit.area_m2,
            unit.소유자명,
            unit.생년월일,
            unit.소유자_주소,
            unit.아파트_소재지,
            unit.건물명,
            unit.거주형태,
            unit.등기목적_분류,
            unit.근저당금액,
            unit.보유기간,
            unit.압류가압류,
            unit.등기원인_년월일,
            unit.전용면적_제곱미터,
            unit.유효근저당총액,
            unit.압류가압류유무,
            unit.주민번호,
            unit.연령대,
            unit.공유자수 || 1,
            unit.세대유형 || (unit.공유자수 > 1 ? '공유세대' : '단독세대')
          ]
        );
        inserted++;
      } catch (unitError) {
        failed++;
        console.error(`   ❌ 세대 데이터 삽입 실패 (${failed}번째 실패):`, unitError.message);
        console.error(`      에러 코드:`, unitError.code);
        console.error(`      에러 상세:`, unitError.detail);
        if (failed <= 5) {
          // 처음 5개 실패만 상세 로그
          console.error(`      데이터 샘플:`, JSON.stringify({
            dong: unit.dong,
            ho: unit.ho,
            소유자명: unit.소유자명,
            공유자수: unit.공유자수,
            세대유형: unit.세대유형
          }));
        }
      }
    }

    console.log(`   ✅ ${inserted}개 세대 데이터 저장 완료`);
    if (failed > 0) {
      console.error(`   ⚠️ ${failed}개 세대 데이터 저장 실패`);
    }
    
    if (inserted === 0 && dbData.units.length > 0) {
      console.error(`   ⚠️ 경고: ${dbData.units.length}개 데이터 중 0개만 저장됨!`);
      console.error(`   ⚠️ 첫 번째 데이터 샘플:`, JSON.stringify(dbData.units[0]).substring(0, 300));
    }

    res.json({
      success: true,
      message: '파일이 성공적으로 업로드되고 DB에 저장되었습니다.',
      building: {
        id: buildingId,
        name: dbData.building.name
      },
      units: {
        total: dbData.units.length,
        inserted: inserted
      }
    });
  } catch (error) {
    throw error;
  }
}

router.post('/csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    // 건물명 추출 (파일명에서, 인코딩 문제 해결)
    const originalName = req.file.originalname;
    const buildingName = extractBuildingName(originalName);
    
    if (!buildingName) {
      return res.status(400).json({ error: '파일명에서 건물명을 추출할 수 없습니다.' });
    }

    const isXLSX = originalName.toLowerCase().endsWith('.xlsx') || 
                  originalName.toLowerCase().endsWith('.xls');
    
    console.log(`📄 파일 업로드: ${buildingName}`);
    console.log(`   파일명: ${originalName}`);
    console.log(`   형식: ${isXLSX ? 'XLSX (전처리 필요)' : 'CSV (전처리 완료)'}`);
    console.log(`   크기: ${req.file.size} bytes`);

    let rawData = [];
    
    if (isXLSX) {
      // XLSX 파일 파싱
      try {
        rawData = parseXLSX(req.file.buffer);
        console.log(`   원시 데이터 행 수: ${rawData.length}개`);
        
        // XLSX 파일은 전처리 필요
        console.log('🔄 XLSX 파일 전처리 시작...');
        const processedData = preprocessData(rawData);
        console.log(`   전처리 완료: ${processedData.length}개 행`);
        
        if (processedData.length === 0) {
          console.error('   ⚠️ 경고: 전처리 후 데이터가 0개입니다!');
          console.error('   ⚠️ 원시 데이터 샘플:', JSON.stringify(rawData.slice(0, 2)).substring(0, 500));
          return res.status(400).json({ 
            error: '전처리 후 데이터가 없습니다.', 
            message: '파일 형식이나 데이터 구조를 확인해주세요.' 
          });
        }
        
        // 전처리된 데이터를 DB 형식으로 변환
        const dbData = convertToDBFormat(processedData, buildingName);
        console.log(`   DB 형식 변환 완료: ${dbData.units.length}개 세대`);
        
        if (dbData.units.length === 0) {
          console.error('   ⚠️ 경고: DB 형식 변환 후 데이터가 0개입니다!');
          return res.status(400).json({ 
            error: 'DB 형식 변환 후 데이터가 없습니다.', 
            message: '데이터 구조를 확인해주세요.' 
          });
        }
        
        // DB 저장
        await saveToDatabase(dbData, res);
        return;
      } catch (xlsxError) {
        console.error('❌ XLSX 처리 실패:', xlsxError);
        return res.status(400).json({ 
          error: 'XLSX 파일을 처리할 수 없습니다.', 
          message: xlsxError.message 
        });
      }
    } else {
      // CSV 파일 파싱 (이미 전처리된 것으로 가정)
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
      
      // CSV는 이미 전처리된 것으로 가정하고 바로 DB 형식으로 변환
      const dbData = convertToDBFormat(rawData, buildingName);
      
      // DB 저장
      await saveToDatabase(dbData, res);
      return;
    }

  } catch (error) {
    console.error('❌ 파일 업로드 실패:', error);
    res.status(500).json({
      error: '파일 업로드 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

module.exports = router;

