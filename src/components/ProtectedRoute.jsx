import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

/**
 * 보호된 라우트 컴포넌트
 * 인증되지 않은 사용자를 /login으로 리다이렉트
 */
const ProtectedRoute = () => {
  // 인증 상태 확인
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;
