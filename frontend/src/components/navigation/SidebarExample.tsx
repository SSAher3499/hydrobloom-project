import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { menuData, minimalMenuData } from './menuData';
import type { MenuItem } from './Sidebar';

/**
 * Example component demonstrating how to use the Sidebar component
 * with different configurations and routing integration.
 */
const SidebarExample: React.FC = () => {
  // Sidebar state
  const [collapsed, setCollapsed] = useState(false);
  const [singleOpen, setSingleOpen] = useState(false);
  const [activeId, setActiveId] = useState('dashboard');
  const [currentPath, setCurrentPath] = useState('/dashboard');
  const [useMinimalData, setUseMinimalData] = useState(false);

  // Simulate navigation (replace with your routing solution)
  const handleNavigate = (item: MenuItem) => {
    if (item.link) {
      console.log(`Navigating to: ${item.link}`);
      setActiveId(item.id);
      setCurrentPath(item.link);

      // For React Router, you would use:
      // const navigate = useNavigate();
      // navigate(item.link);

      // For Next.js, you would use:
      // const router = useRouter();
      // router.push(item.link);
    }
  };

  // Demo: Simulate active state based on current path
  React.useEffect(() => {
    // Map paths to menu item IDs (in real app, this would be more sophisticated)
    const pathToIdMap: Record<string, string> = {
      '/dashboard': 'dashboard',
      '/polyhouses/zones': 'zones',
      '/polyhouses/nurseries': 'nurseries',
      '/polyhouses/lifecycles': 'lifecycles',
      '/reservoirs': 'reservoirs',
      '/inventory': 'inventory',
      '/tasks': 'tasks',
      '/templates': 'templates',
      '/users': 'users',
      '/sales/reports': 'sales-reports',
      '/sales/orders': 'sales-orders',
      '/notifications': 'notifications',
    };

    const newActiveId = pathToIdMap[currentPath];
    if (newActiveId) {
      setActiveId(newActiveId);
    }
  }, [currentPath]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          menuData={useMinimalData ? minimalMenuData : menuData}
          collapsed={collapsed}
          singleOpen={singleOpen}
          activeId={activeId}
          onNavigate={handleNavigate}
          defaultOpenIds={['farms']} // Start with Farms section expanded
          className="h-screen sticky top-0"
        />

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl">
            {/* Demo Controls */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Sidebar Demo Controls
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    collapsed
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {collapsed ? 'Expand' : 'Collapse'} Sidebar
                </button>

                <button
                  onClick={() => setSingleOpen(!singleOpen)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    singleOpen
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {singleOpen ? 'Multi-open' : 'Single-open'} Mode
                </button>

                <button
                  onClick={() => setUseMinimalData(!useMinimalData)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    useMinimalData
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {useMinimalData ? 'Full' : 'Minimal'} Menu
                </button>

                <select
                  value={currentPath}
                  onChange={(e) => setCurrentPath(e.target.value)}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white"
                >
                  <option value="/dashboard">Dashboard</option>
                  <option value="/polyhouses/zones">Polyhouse Zones</option>
                  <option value="/polyhouses/nurseries">Nurseries</option>
                  <option value="/inventory">Inventory</option>
                  <option value="/users">Users</option>
                  <option value="/sales/reports">Sales Reports</option>
                  <option value="/notifications">Notifications</option>
                </select>
              </div>
            </div>

            {/* Current State Display */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                Current State
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Active Page:</span>
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded">
                    {activeId}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Current Path:</span>
                  <span className="ml-2 font-mono text-blue-600">
                    {currentPath}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Sidebar:</span>
                  <span className="ml-2">
                    {collapsed ? 'Collapsed' : 'Expanded'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Menu Mode:</span>
                  <span className="ml-2">
                    {singleOpen ? 'Single-open' : 'Multi-open'}
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Showcase */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Sidebar Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-700">Hierarchical Navigation</h4>
                    <p className="text-sm text-gray-600">
                      Supports unlimited nesting depth with proper visual hierarchy
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-700">Active State Management</h4>
                    <p className="text-sm text-gray-600">
                      Current page highlighted, parent groups show active children
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-700">Accessibility</h4>
                    <p className="text-sm text-gray-600">
                      Full keyboard navigation, ARIA labels, screen reader support
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-medium text-gray-700">Responsive Design</h4>
                    <p className="text-sm text-gray-600">
                      Collapsible to icons-only for mobile/narrow screens
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Examples */}
            <div className="mt-8 bg-gray-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Integration Code Examples
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">React Router:</h4>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`import { useNavigate, useLocation } from 'react-router-dom';

const handleNavigate = (item) => {
  const navigate = useNavigate();
  if (item.link) navigate(item.link);
};`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Next.js:</h4>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`import { useRouter } from 'next/router';

const handleNavigate = (item) => {
  const router = useRouter();
  if (item.link) router.push(item.link);
};`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SidebarExample;