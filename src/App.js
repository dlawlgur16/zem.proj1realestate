import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './components/MainApp';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ProjectIndex from './pages/ProjectIndex';


function App() {
  return (
    <Router basename={process.env.NODE_ENV === 'production' ? process.env.PUBLIC_URL : ''}>
      <div className="App">
        <Routes>
          {/* 1. 로그인 페이지 */}
          <Route path="/" element={<Login />} />
    
          {/* 2. 프로젝트 선택 (인증 필요) */}
          <Route path="/app" element={<ProtectedRoute />}>
            <Route index element={<ProjectIndex />} />
          </Route>
    
          {/* 3. 데이터 분석 (인증 필요) */}
          <Route path="/app/analysis" element={<ProtectedRoute />}>
            <Route index element={<MainApp />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}


export default App;
