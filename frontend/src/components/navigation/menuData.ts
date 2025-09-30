import { MenuItem } from './Sidebar';

/**
 * Example menu data for the farm management sidebar navigation.
 * This demonstrates the exact hierarchy specified in the requirements.
 *
 * Structure:
 * - Farms (expandable parent)
 *   - Dashboard (link)
 *   - Polyhouses (expandable)
 *     - Zones (link)
 *     - Nurseries (link)
 *     - Life cycles (link)
 *   - Reservoirs (link)
 *   - Inventory (link)
 *   - Tasks (link)
 * - Templates (top-level, outside Farms)
 * - Users (top-level, outside Farms)
 * - Sales (top-level, expandable, outside Farms)
 *   - Reports (link)
 *   - Orders (link)
 * - Notification & Alerts (top-level, outside Farms)
 */
export const menuData: MenuItem[] = [
  {
    id: 'farms',
    label: 'Farms',
    icon: 'TractorIcon',
    children: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        link: '/dashboard',
        icon: 'GridIcon'
      },
      {
        id: 'polyhouses',
        label: 'Polyhouses',
        icon: 'WarehouseIcon',
        children: [
          {
            id: 'zones',
            label: 'Zones',
            link: '/polyhouses/zones'
          },
          {
            id: 'nurseries',
            label: 'Nurseries',
            link: '/polyhouses/nurseries'
          },
          {
            id: 'lifecycles',
            label: 'Life cycles',
            link: '/polyhouses/lifecycles'
          }
        ]
      },
      {
        id: 'reservoirs',
        label: 'Reservoirs',
        link: '/reservoirs',
        icon: 'WaterIcon'
      },
      {
        id: 'inventory',
        label: 'Inventory',
        link: '/inventory',
        icon: 'BoxIcon'
      },
      {
        id: 'tasks',
        label: 'Tasks',
        link: '/tasks',
        icon: 'TasksIcon'
      }
    ]
  },
  {
    id: 'templates',
    label: 'Templates',
    link: '/templates',
    icon: 'TemplateIcon'
  },
  {
    id: 'users',
    label: 'Users',
    link: '/users',
    icon: 'UsersIcon'
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: 'ChartIcon',
    children: [
      {
        id: 'sales-reports',
        label: 'Reports',
        link: '/sales/reports'
      },
      {
        id: 'sales-orders',
        label: 'Orders',
        link: '/sales/orders'
      }
    ]
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: 'CogIcon',
    children: [
      {
        id: 'automation-rules',
        label: 'Rules',
        link: '/automation/rules'
      },
      {
        id: 'manual-control',
        label: 'Manual Control',
        link: '/automation/manual'
      },
      {
        id: 'automation-logs',
        label: 'Logs',
        link: '/automation/logs'
      }
    ]
  },
  {
    id: 'notifications',
    label: 'Notification & Alerts',
    link: '/notifications',
    icon: 'BellIcon'
  }
];

/**
 * Alternative menu data examples for different use cases
 */

// Example with fewer items (minimal farm setup)
export const minimalMenuData: MenuItem[] = [
  {
    id: 'farms',
    label: 'Farms',
    icon: 'TractorIcon',
    children: [
      { id: 'dashboard', label: 'Dashboard', link: '/dashboard', icon: 'GridIcon' },
      { id: 'inventory', label: 'Inventory', link: '/inventory', icon: 'BoxIcon' },
    ]
  },
  { id: 'users', label: 'Users', link: '/users', icon: 'UsersIcon' },
];

// Example with additional custom items
export const extendedMenuData: MenuItem[] = [
  ...menuData,
  {
    id: 'reports',
    label: 'Reports',
    icon: 'ChartIcon',
    children: [
      { id: 'production-reports', label: 'Production', link: '/reports/production' },
      { id: 'financial-reports', label: 'Financial', link: '/reports/financial' },
      { id: 'analytics', label: 'Analytics', link: '/reports/analytics' },
    ]
  },
  { id: 'settings', label: 'Settings', link: '/settings', icon: 'GridIcon' },
];

export default menuData;