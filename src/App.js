import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './components/MainApp';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ProjectIndex from './pages/ProjectIndex';

const basename = process.env.REACT_APP_BASENAME || '/';

function App() {
  return (
    <Router basename={basename}>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/app" element={<ProtectedRoute />}>
            <Route index element={<ProjectIndex />} />
          </Route>
          <Route path="/app/analysis" element={<ProtectedRoute />}>
            <Route index element={<MainApp />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;