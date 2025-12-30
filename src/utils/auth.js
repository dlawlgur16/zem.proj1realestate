/**
 * JWT 기반 인증 유틸리티
 */

const SESSION_KEY = 'session';

/**
 * 세션 정보를 localStorage에 저장
 * @param {Object} session - 세션 정보
 * @param {string} session.token - JWT 토큰
 * @param {Object} session.user - 사용자 정보
 */
export const setSession = ({ token, user }) => {
  const session = {
    token,
    user,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24시간
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
 * JWT 토큰 조회
 * @returns {string|null} JWT 토큰 또는 null
 */
export const getToken = () => {
  const session = getSession();
  return session?.token || null;
};

/**
 * 현재 사용자 정보 조회
 * @returns {Object|null} 사용자 정보 또는 null
 */
export const getUser = () => {
  const session = getSession();
  return session?.user || null;
};

/**
 * 현재 사용자 역할 조회
 * @returns {string|null} 역할 또는 null
 */
export const getRole = () => {
  const user = getUser();
  return user?.role || null;
};

/**
 * 관리자 여부 확인
 * @returns {boolean} 관리자 여부
 */
export const isAdmin = () => {
  return getRole() === 'admin';
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
 * 인증 상태 확인
 * @returns {boolean} 인증 여부
 */
export const isAuthenticated = () => {
  return !!getSession();
};
