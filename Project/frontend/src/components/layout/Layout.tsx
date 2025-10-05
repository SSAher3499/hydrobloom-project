import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from '../navigation/Sidebar';
import { menuData } from '../navigation/menuData';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Map current route to active menu item ID
  const getActiveIdFromPath = (path: string) => {
    if (path === '/dashboard') return 'dashboard';
    if (path === '/polyhouses') return 'polyhouses';
    if (path.startsWith('/polyhouses/zones')) return 'zones';
    if (path.startsWith('/polyhouses/nurseries')) return 'nurseries';
    if (path.startsWith('/polyhouses/lifecycles')) return 'lifecycles';
    if (path === '/reservoirs') return 'reservoirs';
    if (path === '/inventory') return 'inventory';
    if (path === '/tasks') return 'tasks';
    if (path === '/templates') return 'templates';
    if (path === '/users') return 'users';
    if (path.startsWith('/sales')) return 'sales';
    if (path === '/alerts') return 'notifications';
    if (path === '/iot/monitoring') return 'iot-monitoring';
    if (path === '/iot/pi-management') return 'pi-management';
    if (path === '/iot/control-rules') return 'control-rules';
    return 'dashboard';
  };

  const handleNavigate = (item: any) => {
    if (item.link) {
      navigate(item.link);
    }
  };

  const activeId = getActiveIdFromPath(location.pathname);

  return (
    <div className="h-screen flex overflow-hidden bg-dark-950">
      {/* New Expandable Sidebar */}
      <Sidebar
        menuData={menuData}
        collapsed={sidebarCollapsed}
        activeId={activeId}
        onNavigate={handleNavigate}
        defaultOpenIds={['farms']}
        className="h-screen sticky top-0 flex-shrink-0"
      />

      {/* Toggle Button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 bg-gray-800 text-white rounded-md shadow-lg hover:bg-gray-700"
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />

        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-dark-950">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;