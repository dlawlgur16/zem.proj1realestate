/**
 * 파일 처리 서비스
 * CSV/XLSX 파싱 및 DB 형식 변환
 */

const XLSX = require('xlsx');
const { extractCity, extractDistrict, extractDong, extractHo } = require('./addressParser');

/**
 * 파일명에서 건물명 추출 (인코딩 문제 해결)
 */
function extractBuildingName(filename) {
  let decodedName = filename;
  try {
    if (Buffer.isEncoding('utf-8')) {
      decodedName = Buffer.from(filename, 'latin1').toString('utf-8');
    }
  } catch (e) {
    decodedName = filename;
  }
  
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
  
  const data = XLSX.utils.sheet_to_json(worksheet, { 
    defval: '',
    header: 1,
    raw: false
  });
  
  if (data.length === 0) {
    return [];
  }
  
  // 첫 번째 행이 헤더인지 확인
  const firstRow = data[0];
  const isHeader = firstRow.some(cell => {
    const str = String(cell || '').trim();
    return str.length > 0 && !/^\d+$/.test(str) && str.length > 2;
  });
  
  if (isHeader) {
    const headers = firstRow.map((h, i) => h || `Column${i + 1}`);
    return data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });
  } else {
    return data.map((row, rowIndex) => {
      const obj = {};
      row.forEach((cell, colIndex) => {
        const colLetter = String.fromCharCode(65 + colIndex);
        obj[colLetter] = cell || '';
        obj[`_col${colIndex}`] = cell || '';
      });
      return obj;
    });
  }
}

/**
 * CSV/XLSX 데이터를 DB 형식으로 변환
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
 * 실제 세대 그룹 수 계산 (동호수 기준 고유 세대 수)
 */
function countUniqueHouseholds(units) {
  const uniqueHouseholds = new Set();
  
  units.forEach(unit => {
    const dong = (unit.dong || '').toString().trim().replace(/동$/, '');
    const ho = (unit.ho || '').toString().trim().replace(/호$/, '');
    
    let householdKey = '';
    if (dong && ho) {
      householdKey = `${dong}-${ho}`;
    } else if (unit.동호수) {
      const dongho = unit.동호수.toString().trim();
      const hoMatch = dongho.match(/(\d+-\d+호|\d+호)/);
      if (hoMatch) {
        householdKey = hoMatch[1].replace(/호$/, '');
      } else {
        householdKey = dongho;
      }
    }
    
    if (householdKey) {
      uniqueHouseholds.add(householdKey);
    }
  });
  
  return uniqueHouseholds.size || units.length;
}

module.exports = {
  extractBuildingName,
  parseXLSX,
  convertToDBFormat,
  countUniqueHouseholds
};
