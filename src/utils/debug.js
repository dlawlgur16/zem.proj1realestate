/**
 * 환경 변수 기반 디버깅 유틸리티
 * 개발 환경에서만 로그 출력
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * 개발 환경에서만 console.log 실행
 */
export const debugLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * 개발 환경에서만 console.warn 실행
 */
export const debugWarn = (...args) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

/**
 * 개발 환경에서만 console.error 실행
 */
export const debugError = (...args) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

/**
 * 에러는 항상 로그 (프로덕션에서도 필요)
 */
export const logError = (error, context = '') => {
  console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);

  // 개발 환경에서만 스택 트레이스 출력
  if (isDevelopment && error.stack) {
    console.error('Stack trace:', error.stack);
  }
};

/**
 * 성능 측정 (개발 환경에서만)
 */
export const measurePerformance = (label, fn) => {
  if (!isDevelopment) {
    return fn();
  }

  const start = performance.now();
  const result = fn();
  const end = performance.now();

  console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);

  return result;
};

export default {
  debugLog,
  debugWarn,
  debugError,
  logError,
  measurePerformance
};
