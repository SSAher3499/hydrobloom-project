import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HomeIcon,
  BuildingOffice2Icon,
  MapIcon,
  BeakerIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellAlertIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: HomeIcon },
    { name: t('nav.polyhouses'), href: '/polyhouses', icon: BuildingOffice2Icon },
    { name: t('nav.zones'), href: '/zones', icon: MapIcon },
    { name: t('nav.nurseries'), href: '/nurseries', icon: BeakerIcon },
    { name: t('nav.lifecycles'), href: '/lifecycles', icon: ArrowPathIcon },
    { name: t('nav.reservoirs'), href: '/reservoirs', icon: WrenchScrewdriverIcon },
    { name: t('nav.inventory'), href: '/inventory', icon: ClipboardDocumentListIcon },
    { name: t('nav.tasks'), href: '/tasks', icon: ClipboardDocumentListIcon },
    { name: t('nav.templates'), href: '/templates', icon: DocumentDuplicateIcon },
    { name: t('nav.users'), href: '/users', icon: UserGroupIcon },
    { name: t('nav.reports'), href: '/reports', icon: ChartBarIcon },
    { name: t('nav.alerts'), href: '/alerts', icon: BellAlertIcon },
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-dark border-r border-dark-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-dark-800">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-neon rounded-lg flex items-center justify-center shadow-neon animate-pulse-neon">
                  <span className="text-dark-900 font-bold text-xl">H</span>
                </div>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-neon-cyan to-neon-green bg-clip-text text-transparent">
                HydroBloom
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-neon-cyan transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    isActive
                      ? 'bg-dark-800 text-neon-cyan border-r-4 border-neon-cyan shadow-neon'
                      : 'text-gray-300 hover:bg-dark-800 hover:text-neon-green',
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-l-lg transition-all duration-200 hover:shadow-neon-green'
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon
                    className={clsx(
                      isActive ? 'text-neon-cyan' : 'text-gray-400 group-hover:text-neon-green',
                      'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                    )}
                  />
                  <span className={clsx(
                    isActive && 'font-semibold'
                  )}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;