import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './components/MainApp';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ProjectIndex from './pages/ProjectIndex';

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div className="App">
        <Routes>
          {/* 홈페이지는 로그인 페이지 */}
          <Route path="/" element={<Login />} />
          
          {/* 데이터 분석 앱 */}
          <Route path="/analysis" element={<MainApp />} />
          
          {/* 인증이 필요한 앱 라우트 */}
          <Route path="/app" element={<ProtectedRoute />}>
            <Route index element={<ProjectIndex />} />
            <Route path="analysis" element={<MainApp />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
