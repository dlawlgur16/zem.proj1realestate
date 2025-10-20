import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, clearSession, touchSession } from '../utils/auth';

/**
 * 보호된 앱 홈 페이지 컴포넌트
 * 사용자 액티비티 시 세션 연장 및 로그아웃 기능 제공
 */
const AppHome = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 초기 세션 정보 로드
    const currentSession = getSession();
    setSession(currentSession);

    // 사용자 액티비티 감지하여 세션 연장
    const handleActivity = () => {
      touchSession();
    };

    // 이벤트 리스너 등록
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>세션을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)'
    }}>
      {/* 헤더 */}
      <header style={{
        background: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#2d3748',
            margin: 0
          }}>
            재건축 분석 시스템
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              {session.username} ({session.role})
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                background: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#c53030'}
              onMouseOut={(e) => e.target.style.background = '#e53e3e'}
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '1rem'
          }}>
            보호된 콘텐츠
          </h2>
          
          <p style={{
            color: '#4a5568',
            lineHeight: '1.6',
            marginBottom: '1.5rem'
          }}>
            이 페이지는 인증된 사용자만 접근할 수 있습니다.
          </p>
          
          <div style={{
            padding: '1rem',
            background: '#f7fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '0.5rem'
            }}>
              세션 정보
            </h3>
            <p style={{ color: '#4a5568', margin: '0.25rem 0' }}>
              사용자명: {session.username}
            </p>
            <p style={{ color: '#4a5568', margin: '0.25rem 0' }}>
              역할: {session.role}
            </p>
            <p style={{ color: '#4a5568', margin: '0.25rem 0' }}>
              만료 시간: {new Date(session.expiresAt).toLocaleString()}
            </p>
          </div>
          
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#edf2f7',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#4a5568'
          }}>
            💡 <strong>팁:</strong> 페이지에서 클릭, 키보드 입력, 스크롤 등의 활동을 하면 세션이 자동으로 연장됩니다.
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppHome;
