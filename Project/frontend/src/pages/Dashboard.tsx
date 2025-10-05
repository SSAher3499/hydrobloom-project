import React, { useEffect, useState } from 'react';
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
import { farmApi } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const FARM_ID = 'demo-farm-1'; // Default farm ID

interface FarmSummary {
  polyhouses: number;
  reservoirs: number;
  zones: number;
  nurseries: number;
  inventoryAvailablePercent: number;
  inventoryCost: number;
  activeAlerts: number;
  overdueTasks: number;
  utilizationPercent: number;
  expectedHarvestRevenue: number;
  salesRevenue: number;
}

interface WeatherData {
  current: string;
  feelsLike: string;
  humidity: string;
  wind: string;
  pressure: string;
  condition?: string;
}

interface TelemetryData {
  [key: string]: {
    value: number;
    unit: string;
  };
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<FarmSummary | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const { telemetry: socketTelemetry, isConnected } = useSocket(FARM_ID);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryData, weatherData, telemetryData] = await Promise.all([
          farmApi.getSummary(FARM_ID),
          farmApi.getWeather(FARM_ID),
          farmApi.getLatestTelemetry(FARM_ID),
        ]);

        setSummary(summaryData);
        setWeather(weatherData);
        setTelemetry(telemetryData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update telemetry from socket
  useEffect(() => {
    if (socketTelemetry?.sensors) {
      const telemetryMap: TelemetryData = {};
      const typeCounts: Record<string, number> = {};

      socketTelemetry.sensors.forEach((sensor) => {
        if (sensor.latestValue !== null) {
          if (!telemetryMap[sensor.type]) {
            telemetryMap[sensor.type] = { value: 0, unit: sensor.unit || '' };
            typeCounts[sensor.type] = 0;
          }
          telemetryMap[sensor.type].value += sensor.latestValue;
          typeCounts[sensor.type]++;
        }
      });

      // Calculate averages
      Object.keys(telemetryMap).forEach((type) => {
        telemetryMap[type].value = parseFloat(
          (telemetryMap[type].value / typeCounts[type]).toFixed(2)
        );
      });

      setTelemetry(telemetryMap);
    }
  }, [socketTelemetry]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading || !summary || !weather || !telemetry) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-neon-cyan text-xl">Loading...</div>
      </div>
    );
  }

  const summaryTiles = [
    {
      name: t('dashboard.summary.polyhouses'),
      value: String(summary.polyhouses),
      icon: BuildingOffice2Icon,
      color: 'bg-blue-500',
      href: '/polyhouses',
    },
    {
      name: t('dashboard.summary.reservoirs'),
      value: String(summary.reservoirs),
      icon: WrenchScrewdriverIcon,
      color: 'bg-cyan-500',
      href: '/reservoirs',
    },
    {
      name: t('dashboard.summary.zones'),
      value: String(summary.zones),
      icon: MapIcon,
      color: 'bg-green-500',
      href: '/zones',
    },
    {
      name: t('dashboard.summary.nurseries'),
      value: String(summary.nurseries),
      icon: BeakerIcon,
      color: 'bg-purple-500',
      href: '/nurseries',
    },
    {
      name: t('dashboard.summary.inventory'),
      value: `${summary.inventoryAvailablePercent}%`,
      icon: ClipboardDocumentListIcon,
      color: 'bg-emerald-500',
      href: '/inventory',
    },
    {
      name: t('dashboard.summary.alarms'),
      value: String(summary.activeAlerts),
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      href: '/alerts',
    },
    {
      name: t('dashboard.summary.overdue_tasks'),
      value: String(summary.overdueTasks),
      icon: ClockIcon,
      color: 'bg-orange-500',
      href: '/tasks',
    },
    {
      name: t('dashboard.summary.utilization'),
      value: `${summary.utilizationPercent}%`,
      icon: ChartBarIcon,
      color: 'bg-indigo-500',
      href: '/reports',
    },
    {
      name: t('dashboard.summary.expected_revenue'),
      value: formatCurrency(summary.expectedHarvestRevenue),
      icon: CurrencyDollarIcon,
      color: 'bg-green-600',
      href: '/reports',
    },
    {
      name: t('dashboard.summary.inventory_cost'),
      value: formatCurrency(summary.inventoryCost),
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      href: '/inventory',
    },
    {
      name: t('dashboard.summary.sale_revenue'),
      value: formatCurrency(summary.salesRevenue),
      icon: CurrencyDollarIcon,
      color: 'bg-green-700',
      href: '/reports',
    },
  ];

  const sensorData = [
    {
      name: t('dashboard.sensors.ph'),
      value: telemetry.pH?.value || 0,
      unit: telemetry.pH?.unit || '',
      optimal: [6.0, 7.0],
      current: telemetry.pH?.value || 0,
    },
    {
      name: t('dashboard.sensors.ec'),
      value: telemetry.EC?.value || 0,
      unit: telemetry.EC?.unit || 'mS/cm',
      optimal: [1.0, 1.5],
      current: telemetry.EC?.value || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-green bg-clip-text text-transparent">
          {t('dashboard.title')}
        </h1>
        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="flex items-center gap-2 text-sm text-neon-green bg-dark-800 px-3 py-2 rounded-lg border border-dark-700">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
              Live
            </div>
          )}
          <div className="text-sm text-gray-400 bg-dark-800 px-4 py-2 rounded-lg border border-dark-700">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
        {summaryTiles.map((tile) => (
          <div
            key={tile.name}
            className="bg-dark-900 rounded-xl border border-dark-700 p-4 md:p-6 hover:border-neon-cyan hover:shadow-neon transition-all duration-300 cursor-pointer group min-w-0"
          >
            <div className="flex items-center">
              <div className={`${tile.color} rounded-lg p-3 group-hover:shadow-lg transition-all duration-300 flex-shrink-0`}>
                <tile.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-400 group-hover:text-neon-green transition-colors truncate">{tile.name}</p>
                <p className="text-2xl font-bold text-white group-hover:text-neon-cyan transition-colors">{tile.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Weather Widget */}
        <div className="bg-dark-900 rounded-xl border border-dark-700 p-4 md:p-6 hover:border-neon-cyan transition-all duration-300">
          <h3 className="text-lg font-semibold text-neon-cyan mb-4 flex items-center">
            <span className="w-2 h-2 bg-neon-cyan rounded-full mr-2 animate-pulse"></span>
            {t('dashboard.weather.title')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.weather.current')}</span>
              <span className="font-bold text-white">{weather.current}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.weather.feels_like')}</span>
              <span className="font-medium text-gray-200">{weather.feelsLike}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.weather.humidity')}</span>
              <span className="font-medium text-gray-200">{weather.humidity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.weather.wind')}</span>
              <span className="font-medium text-gray-200">{weather.wind}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('dashboard.weather.pressure')}</span>
              <span className="font-medium text-gray-200">{weather.pressure}</span>
            </div>
          </div>
        </div>

        {/* Sensor Cards */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {sensorData.map((sensor) => (
            <div key={sensor.name} className="bg-dark-900 rounded-xl border border-dark-700 p-4 md:p-6 hover:border-neon-green hover:shadow-neon-green transition-all duration-300">
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
      <div className="bg-dark-900 rounded-xl border border-dark-700 p-4 md:p-6 hover:border-neon-cyan transition-all duration-300">
        <h3 className="text-lg font-semibold text-neon-cyan mb-6 flex items-center">
          <span className="w-2 h-2 bg-neon-cyan rounded-full mr-2 animate-pulse"></span>
          {t('dashboard.quick_actions.title')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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