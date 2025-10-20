import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './components/MainApp';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ProjectIndex from './pages/ProjectIndex';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 기존 라우트 보존 */}
          <Route path="/" element={<MainApp />} />
          <Route path="/analysis" element={<MainApp />} />
          
          {/* 새로운 인증 라우트 */}
          <Route path="/login" element={<Login />} />
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
