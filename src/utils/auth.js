/**
 * 클라이언트-only localStorage 세션 관리 유틸리티
 * 
 * 주의: 이 방식은 데모/내부용입니다.
 * 민감한 서비스에서는 서버 세션/HttpOnly 쿠키를 권장합니다.
 */

const SESSION_KEY = 'session';

/**
 * 세션 정보를 localStorage에 저장
 * @param {Object} session - 세션 정보
 * @param {string} session.username - 사용자명
 * @param {string} session.role - 역할 (기본값: 'user')
 * @param {number} session.ttlMs - 만료 시간(밀리초) (기본값: 1시간)
 */
export const setSession = ({ username, role = 'user', ttlMs = 60 * 60 * 1000 }) => {
  const session = {
    username,
    role,
    expiresAt: Date.now() + ttlMs
  };
  
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('세션 저장 실패:', error);
  }
};

/**
 * localStorage에서 세션 정보 조회
 * @returns {Object|null} 세션 정보 또는 null
 */
export const getSession = () => {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    
    const session = JSON.parse(sessionStr);
    
    // 만료 시간 체크
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('세션 조회 실패:', error);
    clearSession();
    return null;
  }
};

/**
 * localStorage에서 세션 정보 삭제
 */
export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('세션 삭제 실패:', error);
  }
};

/**
 * 세션 만료 시간 연장
 * @param {number} ttlMs - 새로운 만료 시간(밀리초) (기본값: 1시간)
 */
export const touchSession = (ttlMs = 60 * 60 * 1000) => {
  const session = getSession();
  if (session) {
    setSession({
      username: session.username,
      role: session.role,
      ttlMs
    });
  }
};

/**
 * 인증 상태 확인
 * @returns {boolean} 인증 여부
 */
export const isAuthenticated = () => {
  return !!getSession();
};
