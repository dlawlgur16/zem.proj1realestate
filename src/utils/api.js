/**
 * 백엔드 API 클라이언트
 * Supabase PostgreSQL DB와 연동
 */

// 로컬 개발 환경: 하드코딩
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * API 요청 헬퍼 함수
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // body가 있으면 JSON 문자열로 변환
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    console.log(`🌐 API 요청: ${url}`, { method: config.method || 'GET', headers: config.headers });
    
    const response = await fetch(url, config);
    
    console.log(`📡 API 응답: ${url}`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      contentType: response.headers.get('content-type')
    });
    
    // 응답이 비어있을 수 있음
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    }
    
    console.log(`📦 API 응답 데이터: ${url}`, data);
    
    if (!response.ok) {
      const errorMsg = data.error?.message || data.error || `HTTP error! status: ${response.status}`;
      console.error(`❌ API 요청 실패: ${url}`, errorMsg);
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ API 요청 실패: ${url}`, {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Buildings API
 */
export const buildingsAPI = {
  // 모든 건물 조회
  getAll: () => apiRequest('/buildings'),
  
  // 특정 건물 조회
  getById: (id) => apiRequest(`/buildings/${id}`),
  
  // 건물 생성
  create: (buildingData) => apiRequest('/buildings', {
    method: 'POST',
    body: buildingData
  }),
  
  // 건물 수정
  update: (id, buildingData) => apiRequest(`/buildings/${id}`, {
    method: 'PUT',
    body: buildingData
  }),
  
  // 건물 삭제
  delete: (id) => apiRequest(`/buildings/${id}`, {
    method: 'DELETE'
  })
};

/**
 * Units API
 */
export const unitsAPI = {
  // 건물의 모든 세대 조회
  getByBuilding: (buildingId) => apiRequest(`/units/building/${buildingId}`),
  
  // 특정 세대 조회
  getById: (id) => apiRequest(`/units/${id}`),
  
  // 세대 생성
  create: (unitData) => apiRequest('/units', {
    method: 'POST',
    body: unitData
  }),
  
  // 세대 일괄 추가
  createBatch: (buildingId, units) => apiRequest('/units/batch', {
    method: 'POST',
    body: { building_id: buildingId, units }
  })
};

/**
 * 헬스 체크
 */
export const healthCheck = () => apiRequest('/health');

/**
 * CSV 파일 업로드
 */
export const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append('csvFile', file);

  const API_BASE_URL = 'http://localhost:5000/api';
  const url = `${API_BASE_URL}/upload/csv`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '업로드 실패' }));
      throw new Error(errorData.error?.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('CSV 업로드 실패:', error);
    throw error;
  }
};

/**
 * DB에서 건물 목록을 가져와서 프로젝트 형식으로 변환
 */
export const loadBuildingsAsProjects = async () => {
  try {
    console.log('🔍 DB 건물 목록 로드 시작...');
    console.log('📡 API URL: http://localhost:5000/api');
    
    const response = await buildingsAPI.getAll();
    
    console.log('📦 API 응답:', {
      success: response?.success,
      hasData: !!response?.data,
      dataLength: response?.data?.length,
      response: response
    });
    
    if (response && response.success && response.data) {
      const projects = response.data.map(building => ({
        id: `db-${building.id}`,
        name: building.name || '이름 없음',
        address: building.address || building.city || '',
        type: 'db',
        buildingId: building.id,
        unitCount: parseInt(building.unit_count) || 0,
        mortgageCount: parseInt(building.mortgage_count) || 0,
        createdAt: building.created_at,
        // 기존 프로젝트 형식과 호환성을 위한 필드
        dataFile: null,
        image: '/image/img_chart-02.jpg'
      }));
      
      console.log('✅ DB 프로젝트 변환 완료:', projects.length, '개');
      return projects;
    }
    
    console.warn('⚠️ 응답에 데이터가 없습니다:', response);
    return [];
  } catch (error) {
    console.error('❌ DB에서 건물 목록 로드 실패:', error);
    console.error('❌ 에러 상세:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return [];
  }
};

/**
 * DB에서 건물의 세대 데이터를 가져와서 CSV 형식으로 변환
 */
export const loadBuildingDataFromDB = async (buildingId) => {
  try {
    // 건물 상세 정보 가져오기
    const building = await buildingsAPI.getById(buildingId);
    
    if (!building.success || !building.data) {
      throw new Error('건물 정보를 찾을 수 없습니다.');
    }
    
    // 세대 데이터 가져오기
    const units = await unitsAPI.getByBuilding(buildingId);
    
    if (!units.success || !units.data) {
      // 세대가 없으면 빈 배열 반환
      return [];
    }
    
    // units 데이터를 CSV 형식(객체 배열)으로 변환
    // 기존 DataAnalysis 컴포넌트가 기대하는 형식으로 변환
    const csvData = units.data.map(unit => {
      // 동호수 형식 정규화: dong이 "1동" 형태면 "1"로, ho가 "101호" 형태면 "101"로 변환
      let dongStr = unit.dong ? unit.dong.toString().replace(/동$/, '').trim() : '';
      let hoStr = unit.ho ? unit.ho.toString().replace(/호$/, '').trim() : '';
      const dongho = dongStr && hoStr ? `${dongStr} ${hoStr}` : (dongStr || hoStr || '');
      
      // 근저당금액 처리 (숫자 또는 문자열)
      let loanAmount = unit.근저당금액 || unit.유효근저당총액 || null;
      if (loanAmount !== null && loanAmount !== undefined) {
        const numAmount = typeof loanAmount === 'number' ? loanAmount : parseFloat(loanAmount);
        loanAmount = !isNaN(numAmount) && numAmount > 0 ? numAmount : null;
      }
      
      // 압류가압류 처리 (여러 형식 지원)
      let seizureStatus = unit.압류가압류 || unit.압류가압류유무 || '';
      if (seizureStatus) {
        const seizureStr = seizureStatus.toString().toLowerCase();
        // 'Y', '1', 'true', '있음', '압류', '가압류' 등을 'Y'로 변환
        if (seizureStr === 'y' || seizureStr === '1' || seizureStr === 'true' || 
            seizureStr.includes('있음') || seizureStr.includes('압류') || seizureStr.includes('가압류')) {
          seizureStatus = 'Y';
        } else {
          seizureStatus = 'N';
        }
      } else {
        seizureStatus = 'N';
      }
      
      // 면적 처리 (숫자 또는 문자열)
      const area = unit.area_m2 || unit.전용면적_제곱미터 || null;
      const areaStr = area !== null && area !== undefined ? 
        (typeof area === 'number' ? area.toString() : area.toString()) : '';
      
      // 등기원인_년월일 형식 확인 및 정규화
      let registrationDate = unit.등기원인_년월일 || null;
      if (registrationDate) {
        // 이미 YYYY-MM-DD 형식이면 그대로 사용
        // 다른 형식이면 변환 시도
        const dateStr = registrationDate.toString();
        if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
          // 다른 형식의 날짜를 YYYY-MM-DD로 변환 시도
          const dateMatch = dateStr.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
          if (dateMatch) {
            const year = dateMatch[1];
            const month = dateMatch[2].padStart(2, '0');
            const day = dateMatch[3].padStart(2, '0');
            registrationDate = `${year}-${month}-${day}`;
          }
        }
      }
      
      return {
        // 기존 CSV 컬럼명과 매핑 (DataAnalysis가 기대하는 모든 컬럼)
        '동호수': dongho,
        '건물명': building.data.name || '',
        '건축물_연면적': areaStr,
        '전용면적_제곱미터': area,
        // DB에 저장된 추가 컬럼들 (있는 경우)
        '소유자명': unit.소유자명 || '',
        '생년월일': unit.생년월일 ? unit.생년월일.toString() : '',
        '소유자_주소': unit.소유자_주소 || '',
        '아파트_소재지': unit.아파트_소재지 || building.data.address || '',
        '거주형태': unit.거주형태 || '',
        '등기목적_분류': unit.등기목적_분류 || '',
        '근저당금액': loanAmount !== null ? loanAmount.toString() : '',
        '보유기간': unit.보유기간 || '',
        '압류가압류': seizureStatus,
        '등기원인_년월일': registrationDate || '',
        '주민번호': unit.주민번호 || '',
        '연령대': unit.연령대 || '',
        // 공유세대 정보
        '공유자수': unit.공유자수 || 1,
        '세대유형': unit.세대유형 || (unit.공유자수 > 1 ? '공유세대' : '단독세대'),
        // 추가 정보
        'building_id': buildingId,
        'unit_id': unit.id,
        'created_at': unit.created_at
      };
    });
    
    return csvData;
  } catch (error) {
    console.error('DB에서 건물 데이터 로드 실패:', error);
    throw error;
  }
};

export default {
  buildings: buildingsAPI,
  units: unitsAPI,
  healthCheck,
  loadBuildingsAsProjects,
  loadBuildingDataFromDB
};

