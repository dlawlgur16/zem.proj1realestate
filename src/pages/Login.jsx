import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getSession, setSession } from '../utils/auth';

/**
 * 로그인 페이지 컴포넌트
 * 데모용 하드코딩된 계정으로 로그인 처리
 */
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 이미 로그인된 경우 /app으로 리다이렉트
  const session = getSession();
  if (session) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 데모 계정 체크 (admin/password123)
    if (username === 'admin' && password === 'password123') {
      try {
        setSession({ 
          username: 'admin', 
          role: 'admin' 
        });
        
        // 기존 재건축 분석 시스템으로 리다이렉트
        window.location.href = '/';
      } catch (error) {
        setError('로그인 처리 중 오류가 발생했습니다.');
      }
    } else {
      setError('잘못된 사용자명 또는 비밀번호입니다.');
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          color: '#2d3748',
          fontSize: '1.5rem',
          fontWeight: '700'
        }}>
          로그인
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#4a5568',
              fontWeight: '500'
            }}>
              사용자명
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              required
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#4a5568',
              fontWeight: '500'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              required
            />
          </div>
          
          {error && (
            <div style={{
              color: '#e53e3e',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-1px)')}
            onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#f7fafc',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#4a5568'
        }}>
          <strong>데모 계정:</strong><br />
          사용자명: admin<br />
          비밀번호: password123
        </div>
      </div>
    </div>
  );
};

export default Login;
