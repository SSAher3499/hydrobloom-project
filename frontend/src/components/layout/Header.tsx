import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import LanguageToggle from '../ui/LanguageToggle';
import NotificationPopup, { Notification } from '../ui/NotificationPopup';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedFarm, setSelectedFarm] = useState('Demo Farm');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'alert',
      title: 'High pH Alert - Zone A',
      message: 'pH level has exceeded the safe threshold (7.5). Immediate action required.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      read: false,
    },
    {
      id: '2',
      type: 'warning',
      title: 'Low Water Level - Reservoir 1',
      message: 'Water level is below 20%. Consider refilling soon.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      read: false,
    },
    {
      id: '3',
      type: 'success',
      title: 'System Update Complete',
      message: 'All sensors have been successfully calibrated and are now online.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      read: true,
    },
  ]);

  const farms = [
    { id: '1', name: 'Demo Farm', location: 'Maharashtra, India' },
    { id: '2', name: 'Green Valley Farm', location: 'Punjab, India' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadNotifications = notifications.filter(n => !n.read);

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
    setIsNotificationOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-dark-900 border-b border-dark-800 px-4 sm:px-6 lg:px-8 shadow-lg">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-neon-cyan hover:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-neon-cyan transition-all duration-200"
            onClick={onMenuClick}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Farm selector */}
          <Menu as="div" className="relative ml-4">
            <Menu.Button className="flex items-center space-x-2 text-sm font-medium text-gray-200 hover:text-neon-green focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-900 rounded-lg px-4 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-neon-green transition-all duration-200">
              <div className="text-left">
                <div className="font-semibold text-white">{selectedFarm}</div>
                <div className="text-xs text-gray-400">
                  {farms.find(f => f.name === selectedFarm)?.location}
                </div>
              </div>
              <ChevronDownIcon className="h-4 w-4" />
            </Menu.Button>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-lg bg-dark-800 shadow-lg ring-1 ring-neon-cyan ring-opacity-25 border border-dark-700 focus:outline-none">
                <div className="py-1">
                  {farms.map((farm) => (
                    <Menu.Item key={farm.id}>
                      {({ active }) => (
                        <button
                          onClick={() => setSelectedFarm(farm.name)}
                          className={clsx(
                            active ? 'bg-dark-700 text-neon-green' : 'text-gray-200',
                            'block w-full text-left px-4 py-2 text-sm hover:bg-dark-700 transition-colors duration-150'
                          )}
                        >
                          <div className="font-medium">{farm.name}</div>
                          <div className="text-xs text-gray-400">{farm.location}</div>
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        <div className="flex items-center space-x-4">
          {/* Language toggle */}
          <LanguageToggle />

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleNotificationClick}
              className="p-2 text-gray-400 hover:text-neon-cyan hover:bg-dark-800 rounded-md focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-900 transition-all duration-200"
            >
              <BellIcon className="h-6 w-6" />
            </button>
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-neon-pink rounded-full flex items-center justify-center shadow-neon-pink animate-pulse">
                <span className="text-xs text-white font-bold">{unreadNotifications.length}</span>
              </span>
            )}
            <NotificationPopup
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearAll={handleClearAll}
            />
          </div>

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-2 text-sm text-gray-200 hover:text-neon-green focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:ring-offset-2 focus:ring-offset-dark-900 rounded-lg p-2 bg-dark-800 hover:bg-dark-700 border border-dark-700 hover:border-neon-green transition-all duration-200">
              <UserCircleIcon className="h-8 w-8 text-neon-cyan" />
              <div className="hidden sm:block text-left">
                <div className="font-medium text-white">{user?.name}</div>
                <div className="text-xs text-gray-400">{user?.role?.replace('_', ' ') || 'Farm Manager'}</div>
              </div>
              <ChevronDownIcon className="h-4 w-4" />
            </Menu.Button>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-dark-800 shadow-lg ring-1 ring-neon-cyan ring-opacity-25 border border-dark-700 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          active ? 'bg-dark-700 text-neon-green' : 'text-gray-200',
                          'block w-full text-left px-4 py-2 text-sm hover:bg-dark-700 transition-colors duration-150'
                        )}
                      >
                        Profile Settings
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={clsx(
                          active ? 'bg-dark-700 text-neon-green' : 'text-gray-200',
                          'flex items-center w-full text-left px-4 py-2 text-sm hover:bg-dark-700 transition-colors duration-150'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Header;