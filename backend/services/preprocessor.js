/**
 * 데이터 전처리 서비스 (연번 기반 정확한 그룹화)
 * Excel 파일의 원시 데이터를 분석 가능한 형식으로 변환
 */

/**
 * 전처리 파이프라인
 */
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
    
    // 11. 거주형태 분류
    data = classifyResidenceType(data);
    
    // 12. 세대별 그룹화 (연번 기준 - 핵심!)
    data = groupByHouseholdNumber(data);
    
    // 최종 데이터셋 생성
    const finalData = createFinalDataset(data);
    
    console.log('✅ 전처리 완료:', finalData.length, '행');
    return finalData;
  }
  
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
      const keys = Object.keys(row);
      
      // 동 추출 (여러 방법 시도)
      let dong = '';
      // 1. 헤더 이름으로 접근
      if (row['동'] !== undefined && row['동'] !== null && row['동'] !== '') {
        dong = String(row['동']).trim();
      }
      // 2. 인덱스로 접근 (8번째 컬럼, 0-based)
      else if (columns[8] !== undefined && columns[8] !== null && columns[8] !== '') {
        dong = String(columns[8]).trim();
      }
      // 3. I열로 접근 (헤더 없을 때, I=8번째)
      else if (row['I'] !== undefined && row['I'] !== null && row['I'] !== '') {
        dong = String(row['I']).trim();
      }
      
      // 호수 추출 (여러 방법 시도)
      let ho = '';
      // 1. 헤더 이름으로 접근
      if (row['호수'] !== undefined && row['호수'] !== null && row['호수'] !== '') {
        ho = String(row['호수']).trim();
      }
      // 2. 인덱스로 접근 (11번째 컬럼, 0-based)
      else if (columns[11] !== undefined && columns[11] !== null && columns[11] !== '') {
        ho = String(columns[11]).trim();
      }
      // 3. L열로 접근 (헤더 없을 때, L=11번째)
      else if (row['L'] !== undefined && row['L'] !== null && row['L'] !== '') {
        ho = String(row['L']).trim();
      }
      
      // 호수가 "101-1호" 형식인지 확인하고, 그렇지 않으면 원본 그대로 사용
      // 만약 호수가 "1"만 있으면, 동과 결합해서 "101-1호" 형식으로 만들기 시도
      if (ho && !ho.includes('-') && !ho.includes('호')) {
        // 호수가 숫자만 있으면, 동과 결합
        const dongStr = String(dong).trim();
        const hoStr = String(ho).trim();
        if (dongStr && hoStr && /^\d+$/.test(hoStr)) {
          // "101-1호" 형식으로 만들기
          ho = `${dongStr}-${hoStr}호`;
        } else if (hoStr && /^\d+$/.test(hoStr)) {
          // 동이 없으면 호수만 "호" 붙이기
          ho = `${hoStr}호`;
        }
      } else if (ho && !ho.includes('호')) {
        // 호수에 "호"가 없으면 추가
        ho = `${ho}호`;
      }
      
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
      const area = columns[19] || null;
      // 숫자로 변환 시도
      const areaNum = area ? parseFloat(String(area).replace(/[^0-9.]/g, '')) : null;
      return {
        ...row,
        건축물_연면적: areaNum,
        전용면적_제곱미터: areaNum
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
        const pattern1 = 등기원인.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
        if (pattern1) {
          const year = pattern1[1];
          const month = pattern1[2].padStart(2, '0');
          const day = pattern1[3].padStart(2, '0');
          등기원인_년월일 = `${year}-${month}-${day}`;
        } else {
          const pattern2 = 등기원인.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
          if (pattern2) {
            const year = pattern2[1];
            const month = pattern2[2].padStart(2, '0');
            const day = pattern2[3].padStart(2, '0');
            등기원인_년월일 = `${year}-${month}-${day}`;
          } else {
            const pattern3 = 등기원인.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
            if (pattern3) {
              const year = pattern3[1];
              const month = pattern3[2].padStart(2, '0');
              const day = pattern3[3].padStart(2, '0');
              등기원인_년월일 = `${year}-${month}-${day}`;
            } else {
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
        근저당금액,
        유효근저당총액: 근저당금액
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
      
      const 압류가압류 = seizureTypes.length > 0 ? seizureTypes.join(', ') : '없음';
      
      return {
        ...row,
        압류가압류,
        압류가압류유무: seizureTypes.length > 0 ? 'Y' : 'N'
      };
    });
  }
  
  function classifyOwnership(data) {
    return data.map(row => {
      const columns = Object.values(row);
      const 소유구분 = String(columns[22] || '');
      const 공유여부 = String(columns[1] || '');
      
      // 공유 컬럼이 '-'이면 공유자
      const 소유형태 = (소유구분.includes('공유') || 공유여부 === '-') ? '공유자' : '단독소유자';
      
      return {
        ...row,
        소유구분,
        공유여부,
        소유형태
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
    const normalize = (addr) => {
      return addr
        .replace(/\s+/g, ' ')
        .replace(/[()]/g, '')
        .replace(/외\s*\d+필지/g, '')
        .replace(/제\d+층/g, '')
        .replace(/제\d+동/g, '')
        .replace(/\d+동/g, '')
        .replace(/\d+호/g, '')
        .trim();
    };
  
    const normalizedOwner = normalize(ownerAddr);
    const normalizedProperty = normalize(propertyAddr);
  
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
  
    let score = 0;
    if (ownerDistrict.city === propertyDistrict.city) {
      score += 0.3;
    }
    if (ownerDistrict.district === propertyDistrict.district) {
      score += 0.4;
    }
    if (ownerDistrict.dong && propertyDistrict.dong && 
        ownerDistrict.dong === propertyDistrict.dong) {
      score += 0.3;
    }
  
    return Math.min(score, 1.0);
  }
  
  /**
   * 🔥 핵심 함수: 연번(A열) 기준으로 세대 그룹화
   * 
   * 로직:
   * - A열(연번)에 값이 있으면: 새로운 세대의 시작 (대표 소유자)
   * - A열(연번)이 비어있으면: 바로 위 세대의 공유자
   * - 같은 연번 그룹 내에서 B열(공유)이 '-'이면: 공유세대
   */
  function groupByHouseholdNumber(data) {
    if (!data || data.length === 0) {
      console.log('⚠️ groupByHouseholdNumber: 데이터가 비어있습니다.');
      return [];
    }
    
    // 소유자명과 연번 추가
    const dataWithInfo = data.map((row, index) => {
      const columns = Object.values(row);
      const keys = Object.keys(row);
      
      // 디버깅: 첫 몇 행의 키 구조 확인
      if (index < 3) {
        console.log(`   [행 ${index}] 키 목록:`, keys.slice(0, 10).join(', '), '...');
        console.log(`   [행 ${index}] 샘플 데이터:`, JSON.stringify(Object.fromEntries(Object.entries(row).slice(0, 5))));
      }
      
      // A열(연번) 추출 - 여러 방법 시도
      let 연번 = null;
      // 1. 헤더 이름으로 접근
      if (row['연번'] !== undefined && row['연번'] !== null && row['연번'] !== '') {
        연번 = row['연번'];
      }
      // 2. __EMPTY (빈 셀 키)
      else if (row.__EMPTY !== undefined && row.__EMPTY !== null && row.__EMPTY !== '') {
        연번 = row.__EMPTY;
      }
      // 3. A열로 접근 (헤더 없을 때)
      else if (row['A'] !== undefined && row['A'] !== null && row['A'] !== '') {
        연번 = row['A'];
      }
      // 4. 첫 번째 컬럼 (인덱스 0)
      else if (columns[0] !== undefined && columns[0] !== null && columns[0] !== '') {
        연번 = columns[0];
      }
      
      // 소유자명 추출 (여러 방법 시도)
      let 소유자명 = null;
      // 1. 헤더 이름으로 접근 시도 (가장 우선)
      if (row['소유자명'] || row['성명'] || row['소유자'] || row['성명(소유자)']) {
        소유자명 = row['소유자명'] || row['성명'] || row['소유자'] || row['성명(소유자)'];
      }
      // 2. X열로 접근 (헤더 없을 때, X=23번째 컬럼)
      else if (row['X'] !== undefined && row['X'] !== null && row['X'] !== '') {
        소유자명 = row['X'];
      }
      // 3. 인덱스로 접근 (X열 = 23번째 컬럼, 0-based)
      else if (columns[23] !== undefined && columns[23] !== null && columns[23] !== '') {
        소유자명 = columns[23];
      }
      // 4. 모든 키를 순회하며 소유자명 관련 키 찾기
      else {
        for (const key of keys) {
          const keyLower = String(key).toLowerCase();
          if ((keyLower.includes('성명') || keyLower.includes('소유자') || keyLower.includes('이름')) && 
              row[key] && String(row[key]).trim() !== '') {
            소유자명 = row[key];
            break;
          }
        }
      }
      
      return {
        ...row,
        소유자명: 소유자명 ? String(소유자명).trim() : null,
        연번_원본: 연번,
        행번호: index
      };
    });
    
    // 연번 기준으로 세대 그룹 할당
    let currentHouseholdNumber = null;
    const householdGroups = [];
    
    // 빈 행 필터링 (연번이 없고 다른 데이터도 없는 행 제거)
    const validRows = [];
    const excludedRows = [];
    dataWithInfo.forEach((row, index) => {
      // 연번이 있거나, 다른 중요한 데이터가 있는 행만 포함
      // 공유자 행의 경우 연번이 없을 수 있으므로 소유자명이나 동호수만 있어도 포함
      // 헤더가 있는 경우와 없는 경우 모두 고려
      const hasData = 
        // 연번이 있으면 무조건 포함
        (row.연번_원본 !== null && row.연번_원본 !== undefined && row.연번_원본 !== '') ||
        // 소유자명이 있으면 포함
        (row.소유자명 !== null && row.소유자명 !== undefined && row.소유자명 !== '' && row.소유자명.trim() !== '') ||
        // 동호수가 있으면 포함
        (row.동호수 && row.동호수 !== '' && row.동호수.trim() !== '') ||
        // 동이나 호수가 있으면 포함 (헤더가 있을 때)
        (row.동 && row.동 !== '' && row.동.trim() !== '') ||
        (row.호수 && row.호수 !== '' && row.호수.trim() !== '') ||
        // 원본 데이터에서 직접 확인 (헤더 키로 접근)
        (row['동'] && String(row['동']).trim() !== '') ||
        (row['호수'] && String(row['호수']).trim() !== '') ||
        (row['동호수'] && String(row['동호수']).trim() !== '') ||
        // 인덱스로 접근 (헤더가 없을 때, 동=8, 호수=11)
        (Object.values(row)[8] && String(Object.values(row)[8]).trim() !== '') ||
        (Object.values(row)[11] && String(Object.values(row)[11]).trim() !== '');
      
      if (hasData) {
        validRows.push({ ...row, originalIndex: index });
      } else {
        // 제외된 행 로깅 (디버깅용)
        excludedRows.push({
          index,
          연번: row.연번_원본,
          소유자명: row.소유자명,
          동호수: row.동호수,
          동: row.동,
          호수: row.호수,
          원본키: Object.keys(row).slice(0, 10).join(', ')
        });
      }
    });
    
    console.log(`   유효한 행: ${dataWithInfo.length}행 → ${validRows.length}행`);
    if (excludedRows.length > 0) {
      console.log(`   ⚠️ 제외된 행 ${excludedRows.length}개:`);
      excludedRows.forEach((excluded, i) => {
        if (i < 10) { // 처음 10개만 출력
          console.log(`      [행 ${excluded.index}] 연번:${excluded.연번}, 소유자명:${excluded.소유자명}, 동호수:${excluded.동호수}, 동:${excluded.동}, 호수:${excluded.호수}`);
        }
      });
    }
    
    validRows.forEach((row, index) => {
      // 연번이 있으면 새로운 세대 시작
      if (row.연번_원본 !== null && row.연번_원본 !== undefined && row.연번_원본 !== '') {
        const 연번값 = String(row.연번_원본).trim();
        if (연번값 !== '' && !isNaN(parseInt(연번값))) {
          currentHouseholdNumber = parseInt(연번값).toString();
        }
      }
      
      // 첫 번째 행에 연번이 없으면 경고
      if (index === 0 && !currentHouseholdNumber) {
        console.log(`   ⚠️ 첫 번째 행에 연번이 없습니다. 행 번호를 사용합니다.`);
        currentHouseholdNumber = '1';
      }
      
      householdGroups.push(currentHouseholdNumber);
    });
    
    // 세대 그룹 번호 추가 (validRows 기준)
    const dataWithGroups = validRows.map((row, index) => ({
      ...row,
      세대그룹: householdGroups[index]
    }));
    
    // 세대 그룹별로 묶기
    const grouped = {};
    dataWithGroups.forEach(row => {
      const 세대그룹 = row.세대그룹;
      if (세대그룹 !== null && 세대그룹 !== undefined) {
        if (!grouped[세대그룹]) {
          grouped[세대그룹] = [];
        }
        grouped[세대그룹].push(row);
      }
    });
    
    console.log(`📊 세대 그룹 수: ${Object.keys(grouped).length}개`);
    
    // 각 세대의 행 생성
    const groupedRows = [];
    
    Object.keys(grouped).forEach(세대그룹 => {
      const group = grouped[세대그룹];
      
      // 공유자 여부 확인 (B열에 '-'가 있는지)
      const has공유자 = group.some(r => r.공유여부 === '-');
      
      // 거주형태 결정 (그룹 내 하나라도 실거주면 실거주)
      const residenceTypes = group.map(r => r.거주형태).filter(Boolean);
      let common거주형태 = null;
      if (residenceTypes.includes('실거주')) {
        common거주형태 = '실거주';
      } else if (residenceTypes.length > 0) {
        const counts = {};
        residenceTypes.forEach(type => {
          counts[type] = (counts[type] || 0) + 1;
        });
        const mode = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '투자');
        common거주형태 = mode;
      }
      
      if (has공유자) {
        // 공유세대: 첫 번째 행(대표 소유자)만 저장 (세대 단위로 1행)
        const representative = { ...group[0] };
        representative.총인원수 = group.length;
        representative.공유자수 = group.length;
        representative.세대유형 = '공유세대';
        representative.거주형태 = common거주형태 || representative.거주형태;
        groupedRows.push(representative);
      } else {
        // 단독세대: 첫 번째 행만 저장
        const representative = { ...group[0] };
        representative.총인원수 = 1;
        representative.공유자수 = 1;
        representative.세대유형 = '단독세대';
        representative.거주형태 = common거주형태 || representative.거주형태;
        groupedRows.push(representative);
      }
    });
    
    const 공유세대수 = groupedRows.filter(r => r.세대유형 === '공유세대').length;
    const 단독세대수 = groupedRows.filter(r => r.세대유형 === '단독세대').length;
    const 공유세대그룹수 = Object.keys(grouped).filter(k => grouped[k].some(r => r.공유여부 === '-')).length;
    const 총인원수 = groupedRows.reduce((sum, r) => sum + (r.총인원수 || 1), 0);
    console.log(`✅ 그룹화 완료: ${dataWithGroups.length}행 → ${groupedRows.length}행`);
    console.log(`   공유세대: ${공유세대수}개, 단독세대: ${단독세대수}개`);
    console.log(`   총 세대 수: ${groupedRows.length}개, 총 인원 수: ${총인원수}명`);
    
    return groupedRows;
  }
  
  function createFinalDataset(data) {
    return data.map(row => {
      // DB에 저장할 형식으로 변환
      return {
        '소유자명': row.소유자명 || null,
        '생년월일': row.생년월일 || null,
        '동호수': row.동호수 || null,
        '소유자_주소': row.소유자_주소 || null,
        '아파트_소재지': row.아파트_소재지 || row.도로명주소 || null,
        '건물명': null,
        '거주형태': row.거주형태 || null,
        '등기목적_분류': row.등기목적_분류 || null,
        '근저당금액': row.근저당금액 || null,
        '보유기간': row.보유기간 || null,
        '압류가압류': row.압류가압류 || null,
        '등기원인_년월일': row.등기원인_년월일 || null,
        '전용면적_제곱미터': row.전용면적_제곱미터 || row.건축물_연면적 || null,
        '유효근저당총액': row.유효근저당총액 || row.근저당금액 || null,
        '압류가압류유무': row.압류가압류유무 || (row.압류가압류 && row.압류가압류 !== '없음' ? 'Y' : 'N'),
        '주민번호': null,
        '연령대': null,
        // 세대 정보
        '공유자수': row.공유자수 || 1,
        '세대유형': row.세대유형 || '단독세대',
        '총인원수': row.총인원수 || 1
      };
    });
  }
  
  module.exports = {
    preprocessData
  };