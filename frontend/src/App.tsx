import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Alerts from './pages/Alerts';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/polyhouses" element={<div>Polyhouses Page</div>} />
            <Route path="/zones" element={<div>Zones Page</div>} />
            <Route path="/nurseries" element={<div>Nurseries Page</div>} />
            <Route path="/lifecycles" element={<div>Life Cycles Page</div>} />
            <Route path="/reservoirs" element={<div>Reservoirs Page</div>} />
            <Route path="/inventory" element={<div>Inventory Page</div>} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/templates" element={<div>Templates Page</div>} />
            <Route path="/users" element={<Users />} />
            <Route path="/reports" element={<div>Reports Page</div>} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </Layout>
      </LanguageProvider>
    </Router>
  );
}

export default App;
