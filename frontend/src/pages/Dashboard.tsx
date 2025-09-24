import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BuildingOffice2Icon,
  BeakerIcon,
  MapIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  const summaryTiles = [
    {
      name: t('dashboard.summary.polyhouses'),
      value: '12',
      icon: BuildingOffice2Icon,
      color: 'bg-blue-500',
      href: '/polyhouses',
    },
    {
      name: t('dashboard.summary.reservoirs'),
      value: '8',
      icon: WrenchScrewdriverIcon,
      color: 'bg-cyan-500',
      href: '/reservoirs',
    },
    {
      name: t('dashboard.summary.zones'),
      value: '45',
      icon: MapIcon,
      color: 'bg-green-500',
      href: '/zones',
    },
    {
      name: t('dashboard.summary.nurseries'),
      value: '24',
      icon: BeakerIcon,
      color: 'bg-purple-500',
      href: '/nurseries',
    },
    {
      name: t('dashboard.summary.inventory'),
      value: '87%',
      icon: ClipboardDocumentListIcon,
      color: 'bg-emerald-500',
      href: '/inventory',
    },
    {
      name: t('dashboard.summary.alarms'),
      value: '3',
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      href: '/alerts',
    },
    {
      name: t('dashboard.summary.overdue_tasks'),
      value: '7',
      icon: ClockIcon,
      color: 'bg-orange-500',
      href: '/tasks',
    },
    {
      name: t('dashboard.summary.utilization'),
      value: '94%',
      icon: ChartBarIcon,
      color: 'bg-indigo-500',
      href: '/reports',
    },
    {
      name: t('dashboard.summary.expected_revenue'),
      value: '₹2,45,000',
      icon: CurrencyDollarIcon,
      color: 'bg-green-600',
      href: '/reports',
    },
    {
      name: t('dashboard.summary.inventory_cost'),
      value: '₹89,500',
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      href: '/inventory',
    },
    {
      name: t('dashboard.summary.sale_revenue'),
      value: '₹1,78,000',
      icon: CurrencyDollarIcon,
      color: 'bg-green-700',
      href: '/reports',
    },
  ];

  const sensorData = [
    { name: t('dashboard.sensors.ph'), value: 6.8, unit: '', optimal: [6.0, 7.0], current: 6.8 },
    { name: t('dashboard.sensors.ec'), value: 1.2, unit: 'mS/cm', optimal: [1.0, 1.5], current: 1.2 },
  ];

  const weatherData = {
    current: '28°C',
    feelsLike: '32°C',
    humidity: '65%',
    wind: '12 km/h',
    pressure: '1013 hPa',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-green bg-clip-text text-transparent">
          {t('dashboard.title')}
        </h1>
        <div className="text-sm text-gray-400 bg-dark-800 px-4 py-2 rounded-lg border border-dark-700">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {summaryTiles.map((tile) => (
          <div
            key={tile.name}
            className="bg-dark-900 rounded-xl border border-dark-700 p-6 hover:border-neon-cyan hover:shadow-neon transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center">
              <div className={`${tile.color} rounded-lg p-3 group-hover:shadow-lg transition-all duration-300`}>
                <tile.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400 group-hover:text-neon-green transition-colors">{tile.name}</p>
                <p className="text-2xl font-bold text-white group-hover:text-neon-cyan transition-colors">{tile.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Widget */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 hover:border-neon-cyan transition-all duration-300">
          <h3 className="text-lg font-semibold text-neon-cyan mb-4 flex items-center">
            <span className="w-2 h-2 bg-neon-cyan rounded-full mr-2 animate-pulse"></span>
            {t('dashboard.weather.title')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.weather.current')}</span>
              <span className="font-bold text-white">{weatherData.current}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.weather.feels_like')}</span>
              <span className="font-medium text-gray-200">{weatherData.feelsLike}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.weather.humidity')}</span>
              <span className="font-medium text-gray-200">{weatherData.humidity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.weather.wind')}</span>
              <span className="font-medium text-gray-200">{weatherData.wind}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.weather.pressure')}</span>
              <span className="font-medium text-gray-200">{weatherData.pressure}</span>
            </div>
          </div>
        </div>

        {/* Sensor Cards */}
        <div className="lg:col-span-2 space-y-6">
          {sensorData.map((sensor) => (
            <div key={sensor.name} className="bg-dark-900 rounded-xl border border-dark-700 p-6 hover:border-neon-green hover:shadow-neon-green transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-neon-green flex items-center">
                  <span className="w-2 h-2 bg-neon-green rounded-full mr-2 animate-pulse"></span>
                  {sensor.name}
                </h4>
                <span className="text-3xl font-bold text-white bg-gradient-to-r from-neon-cyan to-neon-green bg-clip-text text-transparent">
                  {sensor.value} {sensor.unit}
                </span>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-4 border border-dark-600">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    sensor.current >= sensor.optimal[0] && sensor.current <= sensor.optimal[1]
                      ? 'bg-gradient-to-r from-primary-500 to-neon-green shadow-neon-green'
                      : 'bg-gradient-to-r from-neon-yellow to-neon-pink shadow-neon-pink'
                  }`}
                  style={{
                    width: `${Math.min((sensor.current / (sensor.optimal[1] * 1.2)) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-400 mt-3">
                <span>Optimal: <span className="text-neon-green font-medium">{sensor.optimal[0]} - {sensor.optimal[1]} {sensor.unit}</span></span>
                <span>Current: <span className="text-neon-cyan font-medium">{sensor.current} {sensor.unit}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-6 hover:border-neon-cyan transition-all duration-300">
        <h3 className="text-lg font-semibold text-neon-cyan mb-6 flex items-center">
          <span className="w-2 h-2 bg-neon-cyan rounded-full mr-2 animate-pulse"></span>
          {t('dashboard.quick_actions.title')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="group flex items-center justify-center px-6 py-4 border border-neon-green rounded-lg shadow-sm bg-dark-800 text-neon-green hover:bg-neon-green hover:text-dark-900 font-semibold transition-all duration-300 hover:shadow-neon-green">
            <span className="group-hover:scale-110 transition-transform duration-200">
              {t('dashboard.quick_actions.add_alert')}
            </span>
          </button>
          <button className="group flex items-center justify-center px-6 py-4 border border-neon-cyan rounded-lg shadow-sm bg-dark-800 text-neon-cyan hover:bg-neon-cyan hover:text-dark-900 font-semibold transition-all duration-300 hover:shadow-neon">
            <span className="group-hover:scale-110 transition-transform duration-200">
              {t('dashboard.quick_actions.add_task')}
            </span>
          </button>
          <button className="group flex items-center justify-center px-6 py-4 border border-neon-pink rounded-lg shadow-sm bg-dark-800 text-neon-pink hover:bg-neon-pink hover:text-white font-semibold transition-all duration-300 hover:shadow-neon-pink">
            <span className="group-hover:scale-110 transition-transform duration-200">
              {t('dashboard.quick_actions.add_user')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;