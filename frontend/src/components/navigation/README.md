# Sidebar Navigation Component

A reusable, accessible, collapsible sidebar navigation component for farm management applications built with React, TypeScript, and Tailwind CSS.

## Features

- ✅ **Hierarchical Navigation**: Support for nested menu items with unlimited depth
- ✅ **Collapsible Groups**: Click to expand/collapse menu sections
- ✅ **Active State Management**: Highlight current page and parent groups
- ✅ **Accessibility**: Full ARIA support with keyboard navigation
- ✅ **Responsive Design**: Collapsible sidebar for mobile/narrow screens
- ✅ **Smooth Animations**: CSS transitions for open/close states
- ✅ **TypeScript Support**: Fully typed with proper interfaces
- ✅ **Customizable**: Easy to theme and extend

## Installation

The component uses the following dependencies:
- `react` (functional components + hooks)
- `clsx` (for conditional classes)
- `tailwindcss` (for styling)

## Basic Usage

```tsx
import React, { useState } from 'react';
import Sidebar from './components/navigation/Sidebar';
import { menuData } from './components/navigation/menuData';

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeId, setActiveId] = useState('dashboard');

  const handleNavigate = (item) => {
    if (item.link) {
      setActiveId(item.id);
      // For React Router:
      // navigate(item.link);
      // For Next.js:
      // router.push(item.link);
      console.log('Navigating to:', item.link);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        menuData={menuData}
        collapsed={collapsed}
        activeId={activeId}
        onNavigate={handleNavigate}
        defaultOpenIds={['farms']} // Start with Farms section open
      />

      {/* Main content area */}
      <main className="flex-1 p-6">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Toggle Sidebar
        </button>
        <h1>Main Content Area</h1>
      </main>
    </div>
  );
};
```

## Props API

### Sidebar Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `menuData` | `MenuItem[]` | **required** | Array of menu items to render |
| `collapsed` | `boolean` | `false` | Whether sidebar shows icons only |
| `singleOpen` | `boolean` | `false` | Only allow one submenu open at a time |
| `defaultOpenIds` | `string[]` | `[]` | Menu IDs to open by default |
| `activeId` | `string` | `undefined` | ID of currently active menu item |
| `onNavigate` | `(item: MenuItem) => void` | `undefined` | Callback when a link item is clicked |
| `className` | `string` | `undefined` | Additional CSS classes for the sidebar |

### MenuItem Interface

```tsx
interface MenuItem {
  id: string;           // Unique identifier
  label: string;        // Display text
  icon?: string;        // Icon component name (from iconMap)
  link?: string;        // URL/route (for leaf items)
  children?: MenuItem[]; // Nested menu items
}
```

## Advanced Examples

### Single Open Mode (Accordion Style)

```tsx
<Sidebar
  menuData={menuData}
  singleOpen={true} // Only one group can be open at a time
  defaultOpenIds={['farms']}
  activeId={activeId}
  onNavigate={handleNavigate}
/>
```

### With React Router Integration

```tsx
import { useNavigate, useLocation } from 'react-router-dom';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active item based on current route
  const getActiveIdFromPath = (path: string) => {
    // Your logic to map paths to menu item IDs
    if (path === '/dashboard') return 'dashboard';
    if (path === '/users') return 'users';
    if (path.startsWith('/polyhouses/zones')) return 'zones';
    return undefined;
  };

  const activeId = getActiveIdFromPath(location.pathname);

  const handleNavigate = (item: MenuItem) => {
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <Sidebar
      menuData={menuData}
      activeId={activeId}
      onNavigate={handleNavigate}
      defaultOpenIds={['farms']}
    />
  );
};
```

### Custom Icons

To use different icons, update the `iconMap` in `Sidebar.tsx`:

```tsx
import {
  HomeIcon,
  BuildingStorefrontIcon,
  // ... other icons from @heroicons/react
} from '@heroicons/react/24/outline';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TractorIcon: HomeIcon,
  WarehouseIcon: BuildingStorefrontIcon,
  // ... add your preferred icons
};
```

### Custom Styling

Override default styles with Tailwind classes:

```tsx
<Sidebar
  menuData={menuData}
  className="bg-blue-900 border-r-2 border-blue-700" // Custom background
  // The component uses CSS custom properties for easy theming
/>
```

For deeper customization, you can modify the Tailwind classes directly in the component or create CSS custom properties:

```css
/* In your global CSS */
:root {
  --sidebar-bg: theme('colors.gray.800');
  --sidebar-text: theme('colors.white');
  --sidebar-active-bg: theme('colors.green.600');
  --sidebar-hover-bg: theme('colors.gray.700');
}
```

## Accessibility Features

- **Keyboard Navigation**: Full support for Tab, Enter, Space, and Arrow keys
- **Screen Readers**: Proper ARIA labels, roles, and state announcements
- **Focus Management**: Visible focus indicators and logical tab order
- **Semantic HTML**: Uses proper `nav`, `button`, and list elements

### ARIA Attributes Used

- `role="navigation"` on the main sidebar
- `role="menu"` and `role="menuitem"` for menu structure
- `aria-expanded` for collapsible items
- `aria-controls` to link triggers with their controlled content
- `aria-labelledby` for submenu labeling

## Browser Support

Works in all modern browsers that support:
- ES2018+ features
- CSS Grid and Flexbox
- CSS Custom Properties
- CSS Transitions

## Performance Notes

- Menu state is managed with React hooks for optimal re-rendering
- Icons are loaded as inline SVGs to avoid network requests
- CSS transitions are GPU-accelerated where possible
- Component uses `useCallback` and `useMemo` for optimization

## Customization Guide

### Adding New Menu Items

1. Update your `menuData` array:

```tsx
const customMenuData = [
  ...menuData,
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'ChartIcon',
    children: [
      { id: 'charts', label: 'Charts', link: '/analytics/charts' },
      { id: 'reports', label: 'Reports', link: '/analytics/reports' }
    ]
  }
];
```

### Creating Custom Icon Sets

1. Create your icon components
2. Update the `iconMap` in `Sidebar.tsx`
3. Reference them by name in your menu data

### Theming

The component uses Tailwind's design system. Key classes you can customize:

- Background: `bg-gray-800` (main sidebar)
- Text colors: `text-white`, `text-gray-300`
- Active state: `bg-green-600`
- Hover states: `hover:bg-gray-700`
- Borders: `border-green-500`

## Troubleshooting

### Icons Not Showing
- Verify icon names in `menuData` match keys in `iconMap`
- Check that icon components are properly imported

### Navigation Not Working
- Ensure `onNavigate` callback is provided
- Verify `link` properties are set on leaf menu items
- Check that routing library is properly configured

### Accessibility Issues
- Test with screen reader software
- Verify keyboard navigation works without mouse
- Check color contrast ratios meet WCAG guidelines

## Contributing

When contributing to this component:

1. Maintain TypeScript types
2. Follow accessibility best practices
3. Add tests for new features
4. Update documentation
5. Ensure responsive design principles

## License

This component is part of the EcoFarmLogix project.