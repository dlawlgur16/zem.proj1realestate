/**
 * 주소 파싱 유틸리티
 * CSV/XLSX 데이터에서 주소 정보 추출
 */

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
  // 먼저 동 필드를 직접 확인
  if (row['동'] && String(row['동']).trim() !== '') {
    const dong = String(row['동']).trim();
    if (dong.includes('동')) {
      return dong;
    }
    if (/^\d+$/.test(dong)) {
      return `${dong}동`;
    }
    return dong;
  }
  
  // 동호수에서 추출 시도
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
 * "101-1호", "101-2호", "1동6602" 형식도 처리
 */
function extractHo(row) {
  // 먼저 호수 필드를 직접 확인
  if (row['호수'] && String(row['호수']).trim() !== '') {
    const ho = String(row['호수']).trim();
    if (ho.includes('호')) {
      return ho;
    }
    if (/^\d+(-\d+)?$/.test(ho)) {
      return `${ho}호`;
    }
    return ho;
  }
  
  // 동호수에서 추출 시도
  const dongho = row['동호수'] || row['건물명'] || '';
  
  // "101-1호" 형식 처리
  const dashMatch = dongho.match(/(\d+-\d+)호/);
  if (dashMatch) return `${dashMatch[1]}호`;
  
  // 일반 "101호" 형식 처리
  const match = dongho.match(/(\d+)호/);
  if (match) return `${match[1]}호`;
  
  // "1동6602" 형식 처리
  const dongHoMatch = dongho.match(/\d+동(\d+)/);
  if (dongHoMatch) return `${dongHoMatch[1]}호`;
  
  // "1 101" 형식 처리
  const spaceMatch = dongho.match(/\s(\d+)$/);
  if (spaceMatch) return `${spaceMatch[1]}호`;
  
  // "101-1" 형식 (호 없이) 처리
  const dashNoHo = dongho.match(/(\d+-\d+)$/);
  if (dashNoHo) return `${dashNoHo[1]}호`;
  
  return null;
}

module.exports = {
  extractCity,
  extractDistrict,
  extractDong,
  extractHo
};
