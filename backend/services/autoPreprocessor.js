/**
 * 백엔드 자동 전처리 서비스
 * Excel 파일을 감시하여 자동으로 전처리 후 CSV 저장
 */

const fs = require('fs-extra');
const path = require('path');
const XLSX = require('xlsx');
const chokidar = require('chokidar');

class AutoPreprocessor {
  constructor() {
    this.inputDir = path.join(__dirname, '../input-data');
    this.outputDir = path.join(__dirname, '../processed-data');
    this.watcher = null;
    
    // 디렉토리 생성
    this.ensureDirectories();
    
    // 기존 파일들 처리
    this.processExistingFiles();
    
    // 파일 감시 시작
    this.startWatching();
  }

  ensureDirectories() {
    fs.ensureDirSync(this.inputDir);
    fs.ensureDirSync(this.outputDir);
    console.log('📁 디렉토리 확인 완료:', {
      input: this.inputDir,
      output: this.outputDir
    });
  }

  async processExistingFiles() {
    try {
      const files = await fs.readdir(this.inputDir);
      const excelFiles = files.filter(file => 
        file.endsWith('.xlsx') || file.endsWith('.xls')
      );
      
      console.log(`📊 기존 Excel 파일 ${excelFiles.length}개 발견`);
      
      for (const file of excelFiles) {
        await this.processFile(path.join(this.inputDir, file));
      }
    } catch (error) {
      console.error('❌ 기존 파일 처리 중 오류:', error);
    }
  }

  startWatching() {
    console.log('👀 파일 감시 시작:', this.inputDir);
    
    this.watcher = chokidar.watch(this.inputDir, {
      ignored: /(^|[\/\\])\../, // 숨김 파일 무시
      persistent: true,
      ignoreInitial: true // 초기 스캔 시 이벤트 무시
    });

    this.watcher
      .on('add', async (filePath) => {
        if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
          console.log('📁 새 Excel 파일 감지:', filePath);
          await this.processFile(filePath);
        }
      })
      .on('change', async (filePath) => {
        if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
          console.log('📝 Excel 파일 변경 감지:', filePath);
          await this.processFile(filePath);
        }
      })
      .on('error', error => {
        console.error('❌ 파일 감시 오류:', error);
      });
  }

  async processFile(filePath) {
    try {
      console.log('🔄 파일 전처리 시작:', path.basename(filePath));
      
      // Excel 파일 읽기
      const data = this.loadRegistryData(filePath);
      
      if (data.length === 0) {
        console.log('⚠️ 빈 파일입니다:', path.basename(filePath));
        return;
      }

      // 전처리 실행
      const processedData = this.preprocessData(data);
      
      // CSV로 저장
      const outputFileName = this.generateOutputFileName(filePath);
      const outputPath = path.join(this.outputDir, outputFileName);
      
      await this.saveAsCSV(processedData, outputPath);
      
      console.log('✅ 전처리 완료:', {
        input: path.basename(filePath),
        output: outputFileName,
        records: processedData.length
      });
      
    } catch (error) {
      console.error('❌ 파일 전처리 실패:', path.basename(filePath), error.message);
    }
  }

  /**
   * Excel 파일 로드 (구분소유자명부 시트)
   */
  loadRegistryData(filePath) {
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

  /**
   * 전처리 파이프라인
   */
  preprocessData(data) {
    console.log('🔄 전처리 시작:', data.length, '행');
    
    // 1. 생년월일 추출
    data = this.extractBirthDate(data);
    
    // 2. 동호수 추출
    data = this.extractUnitInfo(data);
    
    // 3. 소유자 주소 추출
    data = this.extractOwnerAddress(data);
    
    // 4. 아파트 소재지 추출
    data = this.extractPropertyLocation(data);
    
    // 5. 건축물 연면적 추출
    data = this.extractBuildingArea(data);
    
    // 6. 등기원인 및 날짜 추출
    data = this.extractRegistrationPurpose(data);
    
    // 7. 근저당 정보 추출
    data = this.extractMortgageInfo(data);
    
    // 8. 보유기간 추출
    data = this.extractHoldingPeriod(data);
    
    // 9. 압류/가압류 정보 추출
    data = this.extractSeizureInfo(data);
    
    // 10. 소유형태 분류
    data = this.classifyOwnership(data);
    data = this.countOwnershipTypes(data);
    
    // 11. 거주형태 분류
    data = this.classifyResidenceType(data);
    
    // 12. 세대별 그룹화
    data = this.groupByHousehold(data);
    
    // 최종 데이터셋 생성
    const finalData = this.createFinalDataset(data);
    
    console.log('✅ 전처리 완료:', finalData.length, '행');
    return finalData;
  }

  // ========== 전처리 함수들 ==========

  extractBirthDate(data) {
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

  extractUnitInfo(data) {
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

  extractOwnerAddress(data) {
    return data.map(row => {
      const columns = Object.values(row);
      // 인덱스 25: 소유자 주소
      return {
        ...row,
        소유자_주소: columns[25] || null
      };
    });
  }

  extractUnitInfo(data) {
    return data.map(row => {
      const columns = Object.values(row);
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

  extractOwnerAddress(data) {
    return data.map(row => {
      const columns = Object.values(row);
      return {
        ...row,
        소유자_주소: columns[25] || null
      };
    });
  }

  extractPropertyLocation(data) {
    return data.map(row => {
      const columns = Object.values(row);
      return {
        ...row,
        아파트_소재지: columns[5] || null,
        도로명주소: columns[6] || null
      };
    });
  }

  extractBuildingArea(data) {
    return data.map(row => {
      const columns = Object.values(row);
      return {
        ...row,
        건축물_연면적: columns[19] || null
      };
    });
  }

  extractRegistrationPurpose(data) {
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

  extractMortgageInfo(data) {
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

  extractHoldingPeriod(data) {
    return data.map(row => {
      const columns = Object.values(row);
      return {
        ...row,
        보유기간: columns[45] || null
      };
    });
  }

  extractSeizureInfo(data) {
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

  classifyOwnership(data) {
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

  countOwnershipTypes(data) {
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

  classifyResidenceType(data) {
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
      const matchScore = this.calculateAddressMatchScore(ownerAddr, propertyAddr);
      
      if (matchScore >= 0.8) {
        return { ...row, 거주형태: '실거주' };
      } else {
        return { ...row, 거주형태: '투자' };
      }
    });
  }

  /**
   * 주소 매칭 점수 계산 (0.0 ~ 1.0)
   */
  calculateAddressMatchScore(ownerAddr, propertyAddr) {
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

    // 4. 상세 주소 매칭 (건물명, 번지 등)
    const extractBuildingInfo = (addr) => {
      // 건물명 추출 (예: "그랜드파크오피스텔", "아차산인앤인더블류클래스")
      const buildingMatch = addr.match(/([가-힣]+(?:아파트|오피스텔|빌라|빌딩|센터|타워|힐스|클래스|파크|빌|마을|단지))/);
      if (buildingMatch) {
        return buildingMatch[1];
      }
      
      // 번지 추출 (예: "76-1", "41")
      const lotMatch = addr.match(/(\d+(?:-\d+)?)/);
      if (lotMatch) {
        return lotMatch[1];
      }
      
      return '';
    };

    const ownerBuilding = extractBuildingInfo(normalizedOwner);
    const propertyBuilding = extractBuildingInfo(normalizedProperty);

    // 건물명이나 번지가 비슷하면 추가 점수
    if (ownerBuilding && propertyBuilding) {
      if (ownerBuilding === propertyBuilding) {
        score += 0.2;
      } else if (this.calculateStringSimilarity(ownerBuilding, propertyBuilding) > 0.7) {
        score += 0.1;
      }
    }

    // 5. 문자열 유사도 계산 (전체 주소)
    const stringSimilarity = this.calculateStringSimilarity(normalizedOwner, normalizedProperty);
    score += stringSimilarity * 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * 문자열 유사도 계산 (Levenshtein Distance 기반)
   */
  calculateStringSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return (maxLength - matrix[str2.length][str1.length]) / maxLength;
  }

  groupByHousehold(data) {
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

  createFinalDataset(data) {
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

  generateOutputFileName(inputPath) {
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // YYYY-MM-DDTHH-MM-SS-sssZ
    return `${baseName}_전처리_${timestamp}.csv`;
  }

  async saveAsCSV(data, outputPath) {
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

  stop() {
    if (this.watcher) {
      this.watcher.close();
      console.log('🛑 파일 감시 중지');
    }
  }
}

module.exports = AutoPreprocessor;
