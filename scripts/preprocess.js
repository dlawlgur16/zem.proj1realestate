#!/usr/bin/env node

/**
 * 로컬 전처리 스크립트
 * input-data 폴더의 Excel 파일들을 processed-data로 전처리
 */

const fs = require('fs-extra');
const path = require('path');

// 백엔드 폴더의 node_modules에서 xlsx 모듈 로드
const xlsxPath = path.join(__dirname, '../backend/node_modules/xlsx');
const XLSX = require(xlsxPath);

// 경로 설정
const inputDir = path.join(__dirname, '../backend/input-data');
const outputDir = path.join(__dirname, '../public/processed-data');

console.log('🚀 로컬 전처리 스크립트 시작');
console.log('📁 입력 폴더:', inputDir);
console.log('📁 출력 폴더:', outputDir);

// 디렉토리 확인 및 생성
async function ensureDirectories() {
  await fs.ensureDir(inputDir);
  await fs.ensureDir(outputDir);
  console.log('✅ 디렉토리 확인 완료');
}

// Excel 파일 로드
function loadRegistryData(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = '구분소유자명부';
  const worksheet = workbook.Sheets[sheetName];
  
  if (!worksheet) {
    throw new Error(`'${sheetName}' 시트를 찾을 수 없습니다.`);
  }
  
  // 4행부터 시작 (헤더가 3행에 있으므로)
  const data = XLSX.utils.sheet_to_json(worksheet, {
    range: 3, // 3행부터 시작 (0-indexed)
    defval: null
  });
  
  // 빈 행 제거
  return data.filter(row => {
    return Object.values(row).some(val => val !== null && val !== undefined && val !== '');
  });
}

// 전처리 파이프라인
function preprocessData(data) {
  console.log('🔄 전처리 시작:', data.length, '행');
  
  // 1. 생년월일 추출
  data = extractBirthDate(data);
  
  // 2. 동호수 추출
  data = extractUnitInfo(data);
  
  // 3. 소유자 주소 추출
  data = extractOwnerAddress(data);
  
  // 4. 아파트 소재지 추출
  data = extractPropertyLocation(data);
  
  // 5. 건축물 연면적 추출
  data = extractBuildingArea(data);
  
  // 6. 등기원인 및 날짜 추출
  data = extractRegistrationPurpose(data);
  
  // 7. 근저당 정보 추출
  data = extractMortgageInfo(data);
  
  // 8. 보유기간 추출
  data = extractHoldingPeriod(data);
  
  // 9. 압류/가압류 정보 추출
  data = extractSeizureInfo(data);
  
  // 10. 소유형태 분류
  data = classifyOwnership(data);
  data = countOwnershipTypes(data);
  
  // 11. 거주형태 분류
  data = classifyResidenceType(data);
  
  // 12. 세대별 그룹화
  data = groupByHousehold(data);
  
  // 최종 데이터셋 생성
  const finalData = createFinalDataset(data);
  
  console.log('✅ 전처리 완료:', finalData.length, '행');
  return finalData;
}

// 전처리 함수들 (기존 autoPreprocessor.js에서 복사)
function extractBirthDate(data) {
  return data.map(row => {
    const columns = Object.values(row);
    
    let birthDate = null;
    
    // 인덱스 24 확인 (Y열 - 생년월일 위치)
    if (columns[24] !== null && columns[24] !== undefined && columns[24] !== '') {
      const value = String(columns[24]).trim();
      if (/^\d{6}$/.test(value)) {
        birthDate = value;
      } else if (/^\d{6}-\d{7}$/.test(value)) {
        birthDate = value.substring(0, 6);
      }
    }
    
    return {
      ...row,
      생년월일: birthDate
    };
  });
}

function extractUnitInfo(data) {
  return data.map(row => {
    const columns = Object.values(row);
    // 인덱스 8: 동, 인덱스 11: 호수
    const dong = columns[8] || '';
    const ho = columns[11] || '';
    const dongHosu = `${String(dong).trim()} ${String(ho).trim()}`.trim();
    
    return {
      ...row,
      동: dong,
      호수: ho,
      동호수: dongHosu
    };
  });
}

function extractOwnerAddress(data) {
  return data.map(row => {
    const columns = Object.values(row);
    // 인덱스 25: 소유자 주소
    return {
      ...row,
      소유자_주소: columns[25] || null
    };
  });
}

function extractPropertyLocation(data) {
  return data.map(row => {
    const columns = Object.values(row);
    return {
      ...row,
      아파트_소재지: columns[5] || null,
      도로명주소: columns[6] || null
    };
  });
}

function extractBuildingArea(data) {
  return data.map(row => {
    const columns = Object.values(row);
    return {
      ...row,
      건축물_연면적: columns[19] || null
    };
  });
}

function extractRegistrationPurpose(data) {
  return data.map(row => {
    const columns = Object.values(row);
    const 등기원인 = columns[31] || '';
    const 등기목적 = columns[27] || '';
    const combined = `${등기목적} ${등기원인}`;
    
    let 등기목적_분류 = '기타';
    if (combined.includes('매매')) {
      등기목적_분류 = '매매';
    } else if (combined.includes('증여')) {
      등기목적_분류 = '증여';
    } else if (combined.includes('상속')) {
      등기목적_분류 = '상속';
    } else if (combined.includes('경락') || combined.includes('경매')) {
      등기목적_분류 = '경매';
    }
    
    // 등기원인 날짜 추출
    let 등기원인_년월일 = null;
    if (등기원인) {
      // 패턴 1: YYYY년 MM월 DD일
      const pattern1 = 등기원인.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
      if (pattern1) {
        const year = pattern1[1];
        const month = pattern1[2].padStart(2, '0');
        const day = pattern1[3].padStart(2, '0');
        등기원인_년월일 = `${year}-${month}-${day}`;
      } else {
        // 패턴 2: YYYY.MM.DD
        const pattern2 = 등기원인.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
        if (pattern2) {
          const year = pattern2[1];
          const month = pattern2[2].padStart(2, '0');
          const day = pattern2[3].padStart(2, '0');
          등기원인_년월일 = `${year}-${month}-${day}`;
        } else {
          // 패턴 3: YYYY-MM-DD
          const pattern3 = 등기원인.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
          if (pattern3) {
            const year = pattern3[1];
            const month = pattern3[2].padStart(2, '0');
            const day = pattern3[3].padStart(2, '0');
            등기원인_년월일 = `${year}-${month}-${day}`;
          } else {
            // 패턴 4: YYYYMMDD
            const pattern4 = 등기원인.match(/(\d{8})/);
            if (pattern4) {
              const dateStr = pattern4[1];
              등기원인_년월일 = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
            }
          }
        }
      }
    }
    
    return {
      ...row,
      등기원인_년월일,
      등기목적_분류
    };
  });
}

function extractMortgageInfo(data) {
  return data.map(row => {
    const columns = Object.values(row);
    const 권리종류 = String(columns[37] || '');
    const 권리내용 = String(columns[38] || '');
    
    const 근저당설정여부 = (권리종류.includes('근저당') || 권리내용.includes('근저당')) ? 'Y' : 'N';
    
    let 근저당금액 = null;
    if (근저당설정여부 === 'Y' && 권리내용) {
      const amounts = 권리내용.match(/^\s*(\d{8,})\s*$/gm);
      if (amounts) {
        근저당금액 = amounts.reduce((sum, amount) => sum + parseFloat(amount.trim()), 0);
      } else {
        const amountsWithUnit = 권리내용.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:원|만원|억)/g);
        if (amountsWithUnit) {
          근저당금액 = amountsWithUnit.reduce((sum, amount) => {
            const num = parseFloat(amount.replace(/[,원만억]/g, ''));
            return sum + num;
          }, 0);
          근저당금액 = 근저당금액 > 0 ? 근저당금액 : null;
        }
      }
    }
    
    return {
      ...row,
      권리종류,
      권리내용,
      근저당설정여부,
      근저당금액
    };
  });
}

function extractHoldingPeriod(data) {
  return data.map(row => {
    const columns = Object.values(row);
    return {
      ...row,
      보유기간: columns[45] || null
    };
  });
}

function extractSeizureInfo(data) {
  return data.map(row => {
    const 권리종류 = String(row.권리종류 || '');
    const 권리내용 = String(row.권리내용 || '');
    const combined = `${권리종류} ${권리내용}`;
    
    const seizureTypes = [];
    if (combined.includes('압류')) seizureTypes.push('압류');
    if (combined.includes('가압류')) seizureTypes.push('가압류');
    
    return {
      ...row,
      압류가압류: seizureTypes.length > 0 ? seizureTypes.join(', ') : '없음'
    };
  });
}

function classifyOwnership(data) {
  return data.map(row => {
    const columns = Object.values(row);
    const 소유구분 = String(columns[22] || '');
    const 공유여부 = String(columns[1] || '');
    
    const 소유형태 = (소유구분.includes('공유') || 공유여부 === '-') ? '공유자' : '단독소유자';
    
    return {
      ...row,
      소유구분,
      공유여부,
      소유형태
    };
  });
}

function countOwnershipTypes(data) {
  const grouped = {};
  data.forEach(row => {
    const 동호수 = row.동호수;
    if (!grouped[동호수]) {
      grouped[동호수] = [];
    }
    grouped[동호수].push(row);
  });
  
  const ownershipSummary = {};
  Object.keys(grouped).forEach(동호수 => {
    const group = grouped[동호수];
    ownershipSummary[동호수] = {
      총인원수: group.length,
      공유자수: group.filter(r => r.소유형태 === '공유자').length,
      단독소유자수: group.filter(r => r.소유형태 === '단독소유자').length
    };
  });
  
  return data.map(row => {
    const stats = ownershipSummary[row.동호수];
    const 세대유형 = stats.공유자수 > 1 ? '공유세대' : '단독세대';
    
    return {
      ...row,
      ...stats,
      세대유형
    };
  });
}

function classifyResidenceType(data) {
  return data.map(row => {
    const ownerAddr = String(row.소유자_주소 || '');
    const propertyAddr = String(row.아파트_소재지 || '');
    const dongHosu = String(row.동호수 || '');
    
    if (!ownerAddr || !propertyAddr || ownerAddr === '' || propertyAddr === '') {
      return { ...row, 거주형태: '정보없음' };
    }
    
    // 1. 동호수가 소유자 주소에 포함되어 있으면 실거주
    if (dongHosu && ownerAddr.includes(dongHosu)) {
      return { ...row, 거주형태: '실거주' };
    }
    
    // 2. 주소 정규화 및 매칭 점수 계산
    const matchScore = calculateAddressMatchScore(ownerAddr, propertyAddr);
    
    if (matchScore >= 0.8) {
      return { ...row, 거주형태: '실거주' };
    } else {
      return { ...row, 거주형태: '투자' };
    }
  });
}

function calculateAddressMatchScore(ownerAddr, propertyAddr) {
  // 1. 기본 정규화
  const normalize = (addr) => {
    return addr
      .replace(/\s+/g, ' ')  // 여러 공백을 하나로
      .replace(/[()]/g, '')  // 괄호 제거
      .replace(/외\s*\d+필지/g, '')  // "외 1필지" 제거
      .replace(/제\d+층/g, '')  // "제1층" 제거
      .replace(/제\d+동/g, '')  // "제1동" 제거
      .replace(/\d+동/g, '')  // "1동" 제거
      .replace(/\d+호/g, '')  // "101호" 제거
      .trim();
  };

  const normalizedOwner = normalize(ownerAddr);
  const normalizedProperty = normalize(propertyAddr);

  // 2. 구/동 추출
  const extractDistrict = (addr) => {
    const match = addr.match(/(서울특별시|경기도|인천광역시|부산광역시|대구광역시|광주광역시|대전광역시|울산광역시|세종특별자치시)\s+([가-힣]+구|시)\s*([가-힣]+동|읍|면)?/);
    if (match) {
      return {
        city: match[1],
        district: match[2],
        dong: match[3] || ''
      };
    }
    return null;
  };

  const ownerDistrict = extractDistrict(normalizedOwner);
  const propertyDistrict = extractDistrict(normalizedProperty);

  if (!ownerDistrict || !propertyDistrict) {
    return 0;
  }

  // 3. 점수 계산
  let score = 0;

  // 시/도가 같으면 +0.3
  if (ownerDistrict.city === propertyDistrict.city) {
    score += 0.3;
  }

  // 구가 같으면 +0.4
  if (ownerDistrict.district === propertyDistrict.district) {
    score += 0.4;
  }

  // 동이 같으면 +0.3
  if (ownerDistrict.dong && propertyDistrict.dong && 
      ownerDistrict.dong === propertyDistrict.dong) {
    score += 0.3;
  }

  return Math.min(score, 1.0);
}

function groupByHousehold(data) {
  const dataWithOwnerName = data.map(row => {
    const columns = Object.values(row);
    return {
      ...row,
      소유자명: columns[23] || null
    };
  });
  
  const grouped = {};
  dataWithOwnerName.forEach(row => {
    const 동호수 = row.동호수;
    if (!grouped[동호수]) {
      grouped[동호수] = [];
    }
    grouped[동호수].push(row);
  });
  
  const groupedRows = [];
  Object.keys(grouped).forEach(동호수 => {
    const group = grouped[동호수];
    const representative = { ...group[0] };
    
    const residenceTypes = group.map(r => r.거주형태);
    if (residenceTypes.includes('실거주')) {
      representative.거주형태 = '실거주';
    } else if (residenceTypes.includes('실거주(추정)')) {
      representative.거주형태 = '실거주(추정)';
    } else {
      const counts = {};
      residenceTypes.forEach(type => {
        counts[type] = (counts[type] || 0) + 1;
      });
      const mode = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '투자');
      representative.거주형태 = mode;
    }
    
    groupedRows.push(representative);
  });
  
  return groupedRows;
}

function createFinalDataset(data) {
  const finalColumns = [
    '소유자명',
    '생년월일',
    '동호수',
    '소유자_주소',
    '아파트_소재지',
    '도로명주소',
    '건축물_연면적',
    '거주형태',
    '등기목적_분류',
    '등기원인_년월일',
    '근저당설정여부',
    '근저당금액',
    '보유기간',
    '압류가압류',
    '소유형태',
    '세대유형',
    '공유자수',
    '단독소유자수'
  ];
  
  return data.map(row => {
    const finalRow = {};
    finalColumns.forEach(col => {
      finalRow[col] = row[col] !== undefined ? row[col] : null;
    });
    return finalRow;
  });
}

function generateOutputFileName(inputPath) {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${baseName}_전처리_${timestamp}.csv`;
}

async function saveAsCSV(data, outputPath) {
  try {
    // 기존 파일이 있으면 삭제
    if (await fs.pathExists(outputPath)) {
      await fs.remove(outputPath);
    }
    
    // CSV 형식으로 변환
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    // UTF-8 BOM 추가 (엑셀에서 한글이 깨지지 않도록)
    const BOM = '\uFEFF';
    await fs.writeFile(outputPath, BOM + csv, 'utf8');
    
    console.log(`💾 CSV 저장 완료: ${outputPath}`);
  } catch (error) {
    console.error('❌ CSV 저장 실패:', error.message);
    throw error;
  }
}

// 메인 실행 함수
async function main() {
  try {
    await ensureDirectories();
    
    // input-data 폴더의 Excel 파일들 찾기
    const files = await fs.readdir(inputDir);
    const excelFiles = files.filter(file => 
      file.endsWith('.xlsx') || file.endsWith('.xls')
    );
    
    console.log(`📊 Excel 파일 ${excelFiles.length}개 발견`);
    
    if (excelFiles.length === 0) {
      console.log('⚠️ 처리할 Excel 파일이 없습니다.');
      return;
    }
    
    // 각 파일 처리
    for (const file of excelFiles) {
      const filePath = path.join(inputDir, file);
      console.log(`🔄 파일 처리 시작: ${file}`);
      
      try {
        // 이미 처리된 파일이 있는지 확인 (파일 수정 시간 비교)
        const baseName = path.basename(file, path.extname(file));
        const inputFileStats = await fs.stat(filePath);
        const existingFiles = await fs.readdir(outputDir);
        
        const processedFiles = existingFiles.filter(existingFile => 
          existingFile.startsWith(baseName + '_전처리_') && existingFile.endsWith('.csv')
        );
        
        // 가장 최근에 처리된 파일 찾기
        let latestProcessedFile = null;
        let latestTime = 0;
        
        for (const processedFile of processedFiles) {
          const processedPath = path.join(outputDir, processedFile);
          const processedStats = await fs.stat(processedPath);
          if (processedStats.mtime.getTime() > latestTime) {
            latestTime = processedStats.mtime.getTime();
            latestProcessedFile = processedFile;
          }
        }
        
        // 입력 파일보다 최근에 처리된 파일이 있으면 건너뛰기
        if (latestProcessedFile && latestTime > inputFileStats.mtime.getTime()) {
          console.log(`⏭️ 이미 처리된 파일입니다: ${file} → ${latestProcessedFile} (건너뛰기)`);
          continue;
        }
        
        // Excel 파일 읽기
        const data = loadRegistryData(filePath);
        
        if (data.length === 0) {
          console.log(`⚠️ 빈 파일입니다: ${file}`);
          continue;
        }

        // 전처리 실행
        const processedData = preprocessData(data);
        
        // CSV로 저장
        const outputFileName = generateOutputFileName(filePath);
        const outputPath = path.join(outputDir, outputFileName);
        
        await saveAsCSV(processedData, outputPath);
        
        console.log(`✅ 처리 완료: ${file} → ${outputFileName}`);
        
      } catch (error) {
        console.error(`❌ 파일 처리 실패: ${file}`, error.message);
      }
    }
    
    console.log('🎉 모든 파일 처리 완료!');
    
  } catch (error) {
    console.error('❌ 전처리 스크립트 실행 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { main };
