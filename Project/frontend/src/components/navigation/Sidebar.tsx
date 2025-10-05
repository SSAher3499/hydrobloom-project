import React, { useState, useCallback, useMemo } from 'react';
import clsx from 'clsx';

// Icon components (placeholder SVGs - replace with your preferred icon library)
const TractorIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.29 1.51 4.04 3 5.5l6 6 6-6z" />
  </svg>
);

const GridIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const WarehouseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const WaterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11" />
  </svg>
);

const BoxIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const TasksIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const TemplateIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const ChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.51 20.49l15-15m-15 15L12 8l7.51 12.49M12 8V3" />
  </svg>
);

const CogIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TractorIcon,
  GridIcon,
  WarehouseIcon,
  WaterIcon,
  BoxIcon,
  TasksIcon,
  TemplateIcon,
  UsersIcon,
  ChartIcon,
  BellIcon,
  CogIcon,
};

// Types
export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  link?: string;
  children?: MenuItem[];
}

interface SidebarProps {
  menuData: MenuItem[];
  collapsed?: boolean;
  singleOpen?: boolean;
  defaultOpenIds?: string[];
  activeId?: string;
  onNavigate?: (item: MenuItem) => void;
  className?: string;
}

interface MenuItemProps {
  item: MenuItem;
  level: number;
  collapsed: boolean;
  activeId?: string;
  openIds: Set<string>;
  onToggle: (id: string) => void;
  onNavigate?: (item: MenuItem) => void;
}

// Individual menu item component
const SidebarMenuItem: React.FC<MenuItemProps> = ({
  item,
  level,
  collapsed,
  activeId,
  openIds,
  onToggle,
  onNavigate,
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const isOpen = openIds.has(item.id);
  const isActive = activeId === item.id;
  const hasActiveChild = useMemo(() => {
    if (!hasChildren || !activeId) return false;
    const checkActiveChild = (children: MenuItem[]): boolean => {
      return children.some(child =>
        child.id === activeId || (child.children && checkActiveChild(child.children))
      );
    };
    return checkActiveChild(item.children!);
  }, [hasChildren, activeId, item.children]);

  const IconComponent = item.icon ? iconMap[item.icon] : null;

  const handleClick = useCallback(() => {
    if (hasChildren) {
      onToggle(item.id);
    } else if (item.link && onNavigate) {
      onNavigate(item);
    }
  }, [hasChildren, item, onToggle, onNavigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const baseClasses = clsx(
    'w-full flex items-center text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-inset',
    {
      'px-3 py-2 rounded-md': level === 0,
      'px-6 py-2 rounded-md ml-3': level === 1,
      'px-8 py-1.5 rounded-md ml-6': level === 2,
      'text-white hover:bg-gray-700': !isActive,
      'bg-green-600 text-white': isActive,
      'font-medium': hasActiveChild,
      'border-l-2 border-green-500': hasActiveChild && level === 0,
    }
  );

  return (
    <div>
      <button
        className={baseClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-controls={hasChildren ? `submenu-${item.id}` : undefined}
        role="menuitem"
        tabIndex={0}
      >
        {IconComponent && (
          <IconComponent className={clsx('flex-shrink-0', {
            'h-5 w-5': true,
            'mr-3': !collapsed,
            'mr-0': collapsed,
          })} />
        )}

        {!collapsed && (
          <>
            <span className="flex-1 text-sm">{item.label}</span>
            {hasChildren && (
              <ChevronDownIcon
                className={clsx('h-4 w-4 ml-2 transition-transform duration-200', {
                  'rotate-180': isOpen,
                })}
              />
            )}
          </>
        )}
      </button>

      {/* Submenu */}
      {hasChildren && !collapsed && (
        <div
          id={`submenu-${item.id}`}
          className={clsx('overflow-hidden transition-all duration-300 ease-in-out', {
            'max-h-96 opacity-100': isOpen,
            'max-h-0 opacity-0': !isOpen,
          })}
          role="menu"
          aria-labelledby={item.id}
        >
          <div className="py-1">
            {item.children!.map((child) => (
              <SidebarMenuItem
                key={child.id}
                item={child}
                level={level + 1}
                collapsed={collapsed}
                activeId={activeId}
                openIds={openIds}
                onToggle={onToggle}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Sidebar component
const Sidebar: React.FC<SidebarProps> = ({
  menuData,
  collapsed = false,
  singleOpen = false,
  defaultOpenIds = [],
  activeId,
  onNavigate,
  className,
}) => {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultOpenIds));

  const handleToggle = useCallback(
    (id: string) => {
      setOpenIds((prev) => {
        const newOpenIds = new Set(prev);

        if (singleOpen) {
          // In single open mode, close all others
          newOpenIds.clear();
          if (!prev.has(id)) {
            newOpenIds.add(id);
          }
        } else {
          // In multi-open mode, toggle the clicked item
          if (newOpenIds.has(id)) {
            newOpenIds.delete(id);
          } else {
            newOpenIds.add(id);
          }
        }

        return newOpenIds;
      });
    },
    [singleOpen]
  );

  return (
    <nav
      className={clsx(
        'bg-gray-800 text-white transition-all duration-300 ease-in-out h-full flex flex-col',
        {
          'w-64': !collapsed,
          'w-16': collapsed,
        },
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo/Brand area - Fixed at top */}
      <div className={clsx('p-4 flex-shrink-0', { 'px-2': collapsed })}>
        {!collapsed && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-green-400">🌱 EcoFarmLogix</h1>
          </div>
        )}

        {collapsed && (
          <div className="mb-6 flex justify-center">
            <span className="text-2xl">🌱</span>
          </div>
        )}
      </div>

      {/* Menu Items - Scrollable */}
      <div className={clsx('flex-1 overflow-y-auto px-4 pb-4', { 'px-2': collapsed })}>
        <div className="space-y-1" role="menu">
          {menuData.map((item) => (
            <SidebarMenuItem
              key={item.id}
              item={item}
              level={0}
              collapsed={collapsed}
              activeId={activeId}
              openIds={openIds}
              onToggle={handleToggle}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;