import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Alerts from './pages/Alerts';
import Polyhouses from './pages/Polyhouses';
import Reservoirs from './pages/Reservoirs';
import Login from './pages/Login';
import LoginPassword from './pages/LoginPassword';
import LoginEmail from './pages/LoginEmail';
import OtpVerify from './pages/OtpVerify';
import Register from './pages/Register';
import OnboardingAssets from './pages/OnboardingAssets';
import OnboardingUsers from './pages/OnboardingUsers';
import SidebarDemo from './pages/SidebarDemo';
import AutomationRules from './pages/automation/AutomationRules';
import AutomationManual from './pages/automation/AutomationManual';
import AutomationLogs from './pages/automation/AutomationLogs';
import IoTMonitoring from './pages/IoT/IoTMonitoring';
import PiManagement from './pages/IoT/PiManagement';
import ControlRules from './pages/IoT/ControlRules';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/login/password" element={<LoginPassword />} />
            <Route path="/login/email" element={<LoginEmail />} />
            <Route path="/otp-verify" element={<OtpVerify />} />
            <Route path="/register" element={<Register />} />
            <Route path="/sidebar-demo" element={<SidebarDemo />} />

            {/* Onboarding Routes (require auth but not completed onboarding) */}
            <Route
              path="/onboarding/assets"
              element={
                <ProtectedRoute requireOnboarding={false}>
                  <OnboardingAssets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/users"
              element={
                <ProtectedRoute requireOnboarding={false}>
                  <OnboardingUsers />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes (require auth and completed onboarding) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/polyhouses"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Polyhouses />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/zones"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Zones Page</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurseries"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Nurseries Page</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lifecycles"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Life Cycles Page</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservoirs"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Reservoirs />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Inventory Page</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Tasks />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Templates Page</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Reports Page</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Alerts />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Sales Reports Page</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/orders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Sales Orders Page</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Alerts />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/automation/rules"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AutomationRules />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/automation/manual"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AutomationManual />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/automation/logs"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AutomationLogs />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/iot/monitoring"
              element={
                <ProtectedRoute>
                  <Layout>
                    <IoTMonitoring />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/iot/pi-management"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PiManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/iot/control-rules"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ControlRules />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/polyhouses/zones"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Polyhouse Zones Page</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/polyhouses/nurseries"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Polyhouse Nurseries Page</div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/polyhouses/lifecycles"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div>Polyhouse Life Cycles Page</div>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
