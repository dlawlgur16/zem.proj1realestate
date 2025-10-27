/**
 * 집합건물 등기부등본 데이터 전처리 스크립트 (JavaScript)
 * 
 * 필요 컬럼:
 * 1. 생년월일
 * 2. 아파트 동, 호수
 * 3. 소유자 주소지
 * 4. 아파트 소재지
 * 5. 등기목적 (소유권이전: 매매, 증여, 상속)
 * 6. 근저당설정 여부 / 근저당금액
 * 7. 보유기간
 * 8. 소유자에관한사항 (압류, 가압류)
 * 9. 공유자세대수 / 단독세대수 구분
 * 10. 건축물 연면적
 * 
 * 필요 패키지:
 * npm install xlsx
 */

const XLSX = require('xlsx');
const fs = require('fs');

/**
 * 등기부등본 엑셀 파일 로드
 */
function loadRegistryData(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = '구분소유자명부';
    const worksheet = workbook.Sheets[sheetName];
    
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
 * 생년월일 추출
 */
function extractBirthDate(data) {
    return data.map(row => {
        const columns = Object.values(row);
        return {
            ...row,
            생년월일: columns[24] || null
        };
    });
}

/**
 * 아파트 동, 호수 추출
 */
function extractUnitInfo(data) {
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

/**
 * 소유자 주소지 추출
 */
function extractOwnerAddress(data) {
    return data.map(row => {
        const columns = Object.values(row);
        return {
            ...row,
            소유자_주소: columns[25] || null
        };
    });
}

/**
 * 아파트 소재지 추출
 */
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

/**
 * 건축물 연면적 추출
 */
function extractBuildingArea(data) {
    return data.map(row => {
        const columns = Object.values(row);
        return {
            ...row,
            건축물_연면적: columns[19] || null
        };
    });
}

/**
 * 등기목적 추출 및 분류
 */
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
        
        return {
            ...row,
            등기원인,
            등기목적,
            등기목적_분류
        };
    });
/**
 * 등기원인 추출 및 분류
 */
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
            // 패턴 1: YYYY년 MM월 DD일 (예: 2020년 5월 15일)
            const pattern1 = 등기원인.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
            if (pattern1) {
                const year = pattern1[1];
                const month = pattern1[2].padStart(2, '0');
                const day = pattern1[3].padStart(2, '0');
                등기원인_년월일 = `${year}-${month}-${day}`;
            } else {
                // 패턴 2: YYYY.MM.DD (예: 2020.05.15)
                const pattern2 = 등기원인.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
                if (pattern2) {
                    const year = pattern2[1];
                    const month = pattern2[2].padStart(2, '0');
                    const day = pattern2[3].padStart(2, '0');
                    등기원인_년월일 = `${year}-${month}-${day}`;
                } else {
                    // 패턴 3: YYYY-MM-DD (예: 2020-05-15)
                    const pattern3 = 등기원인.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
                    if (pattern3) {
                        const year = pattern3[1];
                        const month = pattern3[2].padStart(2, '0');
                        const day = pattern3[3].padStart(2, '0');
                        등기원인_년월일 = `${year}-${month}-${day}`;
                    } else {
                        // 패턴 4: YYYYMMDD (예: 20200515)
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
            등기원인,
            등기원인_년월일,
            등기목적_분류
        };
    });
}
}

/**
 * 근저당 정보 추출
 */
function extractMortgageInfo(data) {
    return data.map(row => {
        const columns = Object.values(row);
        const 권리종류 = String(columns[37] || '');
        const 권리내용 = String(columns[38] || '');
        
        // 근저당 여부 판단
        const 근저당설정여부 = (권리종류.includes('근저당') || 권리내용.includes('근저당')) ? 'Y' : 'N';
        
        // 근저당 금액 추출
        let 근저당금액 = null;
        if (근저당설정여부 === 'Y' && 권리내용) {
            // 8자리 이상 순수 숫자를 찾아서 합산
            const amounts = 권리내용.match(/^\s*(\d{8,})\s*$/gm);
            if (amounts) {
                근저당금액 = amounts.reduce((sum, amount) => sum + parseFloat(amount.trim()), 0);
            } else {
                // "원", "만원", "억" 등이 붙은 패턴 찾기
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

/**
 * 보유기간 추출
 */
function extractHoldingPeriod(data) {
    return data.map(row => {
        const columns = Object.values(row);
        return {
            ...row,
            보유기간: columns[45] || null
        };
    });
}

/**
 * 압류/가압류 정보 추출
 */
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

/**
 * 소유형태 분류
 */
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

/**
 * 공유자/단독소유자 수 집계
 */
function countOwnershipTypes(data) {
    // 동호수별로 그룹화
    const grouped = {};
    data.forEach(row => {
        const 동호수 = row.동호수;
        if (!grouped[동호수]) {
            grouped[동호수] = [];
        }
        grouped[동호수].push(row);
    });
    
    // 각 그룹의 통계 계산
    const ownershipSummary = {};
    Object.keys(grouped).forEach(동호수 => {
        const group = grouped[동호수];
        ownershipSummary[동호수] = {
            총인원수: group.length,
            공유자수: group.filter(r => r.소유형태 === '공유자').length,
            단독소유자수: group.filter(r => r.소유형태 === '단독소유자').length
        };
    });
    
    // 원본 데이터에 통계 추가
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

/**
 * 해외 주소 감지
 */
function isOverseasAddress(address) {
    if (!address || address === '') return false;
    
    const addressStr = String(address).toLowerCase();
    
    // 해외 국가명 패턴
    const overseasPatterns = [
        // 영어권
        'usa', 'united states', 'america', 'canada', 'uk', 'united kingdom', 
        'england', 'australia', 'new zealand',
        // 아시아
        'japan', 'china', 'taiwan', 'hong kong', 'singapore', 'malaysia',
        'thailand', 'vietnam', 'philippines', 'indonesia',
        // 유럽
        'france', 'germany', 'spain', 'italy', 'netherlands', 'belgium',
        'switzerland', 'austria', 'sweden', 'norway', 'denmark',
        // 한글 국가명
        '일본', '중국', '대만', '홍콩', '싱가포르', '말레이시아',
        '태국', '베트남', '필리핀', '인도네시아',
        '미국', '캐나다', '영국', '호주', '뉴질랜드',
        '프랑스', '독일', '스페인', '이탈리아', '네덜란드',
        '벨기에', '스위스', '오스트리아', '스웨덴', '노르웨이', '덴마크',
        // 주소 형식 패턴
        'street', 'avenue', 'road', 'lane', 'drive', 'court', 'blvd',
        'apt', 'suite', 'floor', 'unit'
    ];
    
    for (const pattern of overseasPatterns) {
        if (addressStr.includes(pattern)) return true;
    }
    
    // 미국 우편번호 패턴
    if (/\b\d{5}(-\d{4})?\b/.test(addressStr)) return true;
    
    // 캐나다 우편번호 패턴
    if (/[a-z]\d[a-z]\s?\d[a-z]\d/i.test(addressStr)) return true;
    
    // 일본 우편번호 패턴
    if (/\d{3}-\d{4}/.test(addressStr)) return true;
    
    // 한국 주소 패턴이 없으면 해외로 간주
    const koreanPatterns = [
        '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
        '경기', '강원', '충청', '전라', '경상', '제주',
        '시', '도', '구', '군', '동', '읍', '면', '리'
    ];
    
    const hasKoreanPattern = koreanPatterns.some(pattern => addressStr.includes(pattern));
    
    // 한글이 많이 포함되어 있으면 한국 주소
    const koreanCharCount = (addressStr.match(/[가-힣]/g) || []).length;
    if (koreanCharCount > 5 && hasKoreanPattern) {
        return false;
    }
    
    // 영문 주소이면서 한국 패턴이 없으면 해외
    const englishCharCount = (addressStr.match(/[a-z]/gi) || []).length;
    if (englishCharCount > 10 && !hasKoreanPattern) {
        return true;
    }
    
    return false;
}

/**
 * 주소 정규화
 */
function normalizeAddress(address) {
    if (!address || address === '') return '';
    
    // 해외 주소인 경우 'OVERSEAS' 반환
    if (isOverseasAddress(address)) {
        return 'OVERSEAS';
    }
    
    let normalized = String(address);
    
    // 괄호 내용 추출 및 제거
    const parenMatch = normalized.match(/\(([^)]*)\)/);
    const parenContent = parenMatch ? parenMatch[1] : '';
    normalized = normalized.replace(/\([^)]*\)/g, '');
    
    // 특수문자 제거
    normalized = normalized.replace(/[-,.]/g, ' ');
    
    // 시/도 추출
    const sidoPatterns = [
        '서울특별시', '부산광역시', '대구광역시', '인천광역시',
        '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
        '경기도', '강원도', '충청북도', '충청남도', '전라북도',
        '전라남도', '경상북도', '경상남도', '제주특별자치도'
    ];
    
    let sido = '';
    for (const pattern of sidoPatterns) {
        if (normalized.includes(pattern)) {
            sido = pattern;
            normalized = normalized.replace(pattern, ' ');
            break;
        }
    }
    
    // 시/도 이름 단순화
    sido = sido.replace(/특별시|광역시|특별자치시|특별자치도|도/g, '');
    
    // 구/군/시 추출
    const sigunguMatch = normalized.match(/([가-힣]+[시군구])/);
    const sigungu = sigunguMatch ? sigunguMatch[1] : '';
    
    // 동/읍/면 추출
    const dongMatch = normalized.match(/([가-힣]+[동읍면])/);
    let dong = dongMatch ? dongMatch[1] : '';
    
    // 괄호 안에 동 정보가 있을 경우
    if (!dong && parenContent) {
        const parenDongMatch = parenContent.match(/([가-힣]+[동읍면])/);
        if (parenDongMatch) {
            dong = parenDongMatch[1];
        }
    }
    
    // 결과 조합
    return `${sido}${sigungu}${dong}`.trim();
}

/**
 * 동호수 추출 (주소에서)
 */
function extractDongHo(address) {
    if (!address) return { dong: null, ho: null };
    
    const str = String(address);
    
    // 동 추출
    const dongMatch = str.match(/제?(\d+)동/);
    const dong = dongMatch ? dongMatch[1] : null;
    
    // 호수 추출
    const hoMatch = str.match(/제?(\d+(?:-\d+)?)호/);
    const ho = hoMatch ? hoMatch[1] : null;
    
    return { dong, ho };
}

/**
 * 지번 추출 (주소에서)
 */
function extractJibun(address) {
    if (!address) return null;
    
    const str = String(address);
    const jibunMatch = str.match(/[동읍면가]\s*(\d+(?:-\d+)?)/);
    
    return jibunMatch ? jibunMatch[1] : null;
}

/**
 * 거주형태 분류 (실거주 vs 투자)
 */
function classifyResidenceType(data) {
    return data.map(row => {
        const ownerAddr = row.소유자_주소;
        const propertyAddr = row.아파트_소재지;
        
        // 주소 정보가 없으면 구분 불가
        if (!ownerAddr || !propertyAddr || ownerAddr === '' || propertyAddr === '') {
            return { ...row, 거주형태: '정보없음' };
        }
        
        // 해외 거주 확인 (소유자 주소가 해외인 경우)
        if (isOverseasAddress(ownerAddr)) {
            return { ...row, 거주형태: '해외거주' };
        }
        
        // 1. 동호수 비교
        const ownerDongHo = extractDongHo(ownerAddr);
        const propertyDongHo = extractDongHo(propertyAddr);
        
        if (ownerDongHo.ho && propertyDongHo.ho) {
            if (ownerDongHo.ho === propertyDongHo.ho) {
                // 동 정보가 있으면 동도 확인
                if (ownerDongHo.dong && propertyDongHo.dong) {
                    if (ownerDongHo.dong === propertyDongHo.dong) {
                        return { ...row, 거주형태: '실거주' };
                    }
                } else {
                    return { ...row, 거주형태: '실거주' };
                }
            } else {
                // 호수가 다르면 투자
                return { ...row, 거주형태: '투자' };
            }
        }
        
        // 2. 지번 비교 (동호수 정보가 없을 때만)
        if (!ownerDongHo.ho && !propertyDongHo.ho) {
            const ownerJibun = extractJibun(ownerAddr);
            const propertyJibun = extractJibun(propertyAddr);
            
            if (ownerJibun && propertyJibun && ownerJibun === propertyJibun) {
                const ownerNorm = normalizeAddress(ownerAddr);
                const propertyNorm = normalizeAddress(propertyAddr);
                
                // 해외 주소는 제외
                if (ownerNorm === 'OVERSEAS') {
                    return { ...row, 거주형태: '해외거주' };
                }
                
                if (ownerNorm.length >= 6 && propertyNorm.length >= 6) {
                    if (ownerNorm.substring(0, 6) === propertyNorm.substring(0, 6)) {
                        return { ...row, 거주형태: '실거주' };
                    }
                }
            }
        }
        
        // 3. 정규화된 주소 비교
        if (!ownerDongHo.ho && !propertyDongHo.ho) {
            const normalizedOwner = normalizeAddress(ownerAddr);
            const normalizedProperty = normalizeAddress(propertyAddr);
            
            // 해외 주소 체크
            if (normalizedOwner === 'OVERSEAS') {
                return { ...row, 거주형태: '해외거주' };
            }
            
            if (!normalizedOwner || !normalizedProperty) {
                return { ...row, 거주형태: '정보없음' };
            }
            
            if (normalizedOwner === normalizedProperty) {
                return { ...row, 거주형태: '실거주(추정)' };
            }
        }
        
        // 4. 같은 구인지 확인
        const normalizedOwner = normalizeAddress(ownerAddr);
        const normalizedProperty = normalizeAddress(propertyAddr);
        
        // 해외 주소 최종 체크
        if (normalizedOwner === 'OVERSEAS') {
            return { ...row, 거주형태: '해외거주' };
        }
        
        if (normalizedOwner && normalizedProperty) {
            if (normalizedOwner.length >= 6 && normalizedProperty.length >= 6) {
                if (normalizedOwner.substring(0, 6) === normalizedProperty.substring(0, 6)) {
                    return { ...row, 거주형태: '같은구' };
                }
            }
        }
        
        // 5. 그 외는 투자
        return { ...row, 거주형태: '투자' };
    });
}

/**
 * 세대별 그룹화 (1세대 = 1행)
 */
function groupByHousehold(data) {
    // 소유자명 추출
    const dataWithOwnerName = data.map(row => {
        const columns = Object.values(row);
        return {
            ...row,
            소유자명: columns[23] || null
        };
    });
    
    // 동호수별로 그룹화
    const grouped = {};
    dataWithOwnerName.forEach(row => {
        const 동호수 = row.동호수;
        if (!grouped[동호수]) {
            grouped[동호수] = [];
        }
        grouped[동호수].push(row);
    });
    
    // 각 그룹의 대표 행 선정
    const groupedRows = [];
    Object.keys(grouped).forEach(동호수 => {
        const group = grouped[동호수];
        const representative = { ...group[0] };
        
        // 거주형태는 전체 그룹에서 판단
        const residenceTypes = group.map(r => r.거주형태);
        if (residenceTypes.includes('실거주')) {
            representative.거주형태 = '실거주';
        } else if (residenceTypes.includes('실거주(추정)')) {
            representative.거주형태 = '실거주(추정)';
        } else {
            // 최빈값 찾기
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

/**
 * 최종 데이터셋 생성
 */
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
        '등기원인',
        '등기원인_년월일',
        '근저당설정여부',
        '근저당금액',
        '보유기간',
        '압류가압류',
        '소유형태',
        '세대유형',
        '총인원수',
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

/**
 * 기본 통계 출력
 */
function printStatistics(data) {
    const countValues = (field) => {
        const counts = {};
        data.forEach(row => {
            const value = row[field] || 'null';
            counts[value] = (counts[value] || 0) + 1;
        });
        return counts;
    };
    
    console.log('\n' + '='.repeat(80));
    console.log('기본 통계');
    console.log('='.repeat(80));
    
    console.log('\n등기목적 분류:');
    console.log(countValues('등기목적_분류'));
    
    console.log('\n근저당설정 여부:');
    console.log(countValues('근저당설정여부'));
    
    console.log('\n소유형태:');
    console.log(countValues('소유형태'));
    
    console.log('\n세대유형:');
    console.log(countValues('세대유형'));
    
    console.log('\n압류/가압류:');
    console.log(countValues('압류가압류'));
    
    console.log('\n거주형태:');
    console.log(countValues('거주형태'));
}

/**
 * 전체 전처리 파이프라인 실행
 */
function preprocessRegistryData(inputPath, outputPath = null) {
    console.log('='.repeat(80));
    console.log('등기부등본 데이터 전처리 시작');
    console.log('='.repeat(80));
    
    // 1. 데이터 로드
    console.log('\n[1/11] 데이터 로딩 중...');
    let data = loadRegistryData(inputPath);
    console.log(`   로드된 데이터: ${data.length}행`);
    
    // 2. 생년월일 추출
    console.log('\n[2/11] 생년월일 추출 중...');
    data = extractBirthDate(data);
    
    // 3. 동호수 추출
    console.log('\n[3/11] 동호수 정보 추출 중...');
    data = extractUnitInfo(data);
    
    // 4. 소유자 주소 추출
    console.log('\n[4/11] 소유자 주소 추출 중...');
    data = extractOwnerAddress(data);
    
    // 5. 아파트 소재지 추출
    console.log('\n[5/11] 아파트 소재지 추출 중...');
    data = extractPropertyLocation(data);
    
    // 5-1. 건축물 연면적 추출
    console.log('\n[5-1/11] 건축물 연면적 추출 중...');
    data = extractBuildingArea(data);
    
    // 6. 등기목적 추출
    console.log('\n[6/11] 등기목적 분류 중...');
    data = extractRegistrationPurpose(data);
    
    // 7. 근저당 정보 추출
    console.log('\n[7/11] 근저당 정보 추출 중...');
    data = extractMortgageInfo(data);
    
    // 8. 보유기간 추출
    console.log('\n[8/11] 보유기간 추출 중...');
    data = extractHoldingPeriod(data);
    
    // 9. 압류/가압류 정보 추출
    console.log('\n[9/11] 압류/가압류 정보 추출 중...');
    data = extractSeizureInfo(data);
    
    // 10. 소유형태 분류
    console.log('\n[10/11] 소유형태 분류 중...');
    data = classifyOwnership(data);
    data = countOwnershipTypes(data);
    
    // 11. 거주형태 분류
    console.log('\n[11/13] 거주형태 분류 중...');
    data = classifyResidenceType(data);
    
    // 12. 세대별 그룹화
    console.log('\n[12/13] 세대별 그룹화 중...');
    data = groupByHousehold(data);
    console.log(`   그룹화 후: ${data.length}개 세대`);
    
    // 최종 데이터셋 생성
    console.log('\n최종 데이터셋 생성 중...');
    const finalData = createFinalDataset(data);
    
    // 결과 출력
    console.log('\n' + '='.repeat(80));
    console.log('전처리 완료!');
    console.log('='.repeat(80));
    console.log(`\n최종 데이터 행 수: ${finalData.length}`);
    console.log(`최종 데이터 열 수: ${Object.keys(finalData[0] || {}).length}`);
    
    console.log('\n컬럼 목록:');
    if (finalData.length > 0) {
        Object.keys(finalData[0]).forEach((col, i) => {
            console.log(`  ${i + 1}. ${col}`);
        });
    }
    
    // 기본 통계
    printStatistics(finalData);
    
    // 파일 저장
    if (outputPath) {
        // CSV 형식으로 저장
        const worksheet = XLSX.utils.json_to_sheet(finalData);
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        
        // UTF-8 BOM 추가 (엑셀에서 한글이 깨지지 않도록)
        const BOM = '\uFEFF';
        fs.writeFileSync(outputPath, BOM + csv, 'utf8');
        console.log(`\n결과 파일 저장: ${outputPath}`);
    }
    
    // 결과 미리보기
    console.log('\n' + '='.repeat(80));
    console.log('결과 데이터 미리보기 (처음 5행)');
    console.log('='.repeat(80));
    console.table(finalData.slice(0, 5));
    
    return finalData;
}

// 실행
if (require.main === module) {
    const inputFile = '/mnt/user-data/uploads/4__집합건물_등기부등본을_이용한__구분소유자명부_작성사례_샘플_.xlsx';
    const outputFile = '/mnt/user-data/outputs/전처리_결과.csv';
    
    try {
        const result = preprocessRegistryData(inputFile, outputFile);
        console.log('\n처리 완료!');
    } catch (error) {
        console.error('오류 발생:', error);
    }
}

module.exports = {
    preprocessRegistryData,
    loadRegistryData,
    extractBirthDate,
    extractUnitInfo,
    extractOwnerAddress,
    extractPropertyLocation,
    extractBuildingArea,
    extractRegistrationPurpose,
    extractMortgageInfo,
    extractHoldingPeriod,
    extractSeizureInfo,
    classifyOwnership,
    countOwnershipTypes,
    classifyResidenceType,
    groupByHousehold,
    createFinalDataset,
    isOverseasAddress,
    normalizeAddress
};