import React, { useState, useEffect } from 'react';
import { AutomationLog } from '../../types/automation';

const AutomationLogs: React.FC = () => {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: '',
    result: '',
    device: '',
    user: '',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  // Mock logs data
  useEffect(() => {
    const mockLogs: AutomationLog[] = [
      {
        id: 'log-1',
        timestamp: '2024-01-15T14:32:15Z',
        type: 'manual_command',
        user_id: 'user-1',
        user_name: 'John Smith',
        device_id: 'fan-1',
        device_name: 'Exhaust Fan 1',
        action: 'Manual override: Set speed to 80%',
        details: {
          command_type: 'override',
          previous_value: 60,
          new_value: 80,
          duration_sec: 1800,
          reason: 'High temperature alert'
        },
        result: 'success',
        scope: {
          type: 'polyhouse',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          name: 'Polyhouse 1',
          path: 'Farm A > Polyhouse 1'
        }
      },
      {
        id: 'log-2',
        timestamp: '2024-01-15T14:30:45Z',
        type: 'rule_trigger',
        rule_id: 'rule-1',
        rule_name: 'High Temperature Fan Control',
        device_id: 'fan-1',
        device_name: 'Exhaust Fan 1',
        action: 'Automated trigger: Set fan speed to 75%',
        details: {
          trigger_condition: 'temperature > 28°C for 300s',
          sensor_value: 29.2,
          previous_device_value: 50,
          new_device_value: 75
        },
        result: 'success',
        scope: {
          type: 'polyhouse',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          name: 'Polyhouse 1',
          path: 'Farm A > Polyhouse 1'
        }
      },
      {
        id: 'log-3',
        timestamp: '2024-01-15T14:28:22Z',
        type: 'manual_command',
        user_id: 'user-2',
        user_name: 'Alice Johnson',
        device_id: 'valve-1',
        device_name: 'Irrigation Valve 1',
        action: 'Manual command: Turn off valve',
        details: {
          command_type: 'override',
          previous_value: 100,
          new_value: 0,
          duration_sec: 900,
          reason: 'Maintenance required'
        },
        result: 'failure',
        error_message: 'Device is locked due to safety override',
        scope: {
          type: 'zone',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          zoneId: 'zone-2',
          name: 'Zone B',
          path: 'Farm A > Polyhouse 1 > Zone B'
        }
      },
      {
        id: 'log-4',
        timestamp: '2024-01-15T14:25:10Z',
        type: 'safety_override',
        device_id: 'valve-1',
        device_name: 'Irrigation Valve 1',
        action: 'Safety override: Valve locked due to low reservoir level',
        details: {
          safety_condition: 'reservoir_level < 10%',
          sensor_value: 8.5,
          override_reason: 'Prevent pump damage'
        },
        result: 'success',
        scope: {
          type: 'zone',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          zoneId: 'zone-2',
          name: 'Zone B',
          path: 'Farm A > Polyhouse 1 > Zone B'
        }
      },
      {
        id: 'log-5',
        timestamp: '2024-01-15T14:20:33Z',
        type: 'rule_deploy',
        user_id: 'user-1',
        user_name: 'John Smith',
        rule_id: 'rule-2',
        rule_name: 'Low Humidity Misting',
        action: 'Rule deployed and activated',
        details: {
          rule_priority: 6,
          trigger_condition: 'humidity < 60% for 180s',
          actions_count: 2
        },
        result: 'success',
        scope: {
          type: 'zone',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          zoneId: 'zone-1',
          name: 'Zone A',
          path: 'Farm A > Polyhouse 1 > Zone A'
        }
      },
      {
        id: 'log-6',
        timestamp: '2024-01-15T14:15:18Z',
        type: 'device_offline',
        device_id: 'sensor-1',
        device_name: 'Temperature Sensor 1',
        action: 'Device went offline',
        details: {
          last_communication: '2024-01-15T13:45:22Z',
          offline_duration_minutes: 30
        },
        result: 'pending',
        scope: {
          type: 'zone',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          zoneId: 'zone-1',
          name: 'Zone A',
          path: 'Farm A > Polyhouse 1 > Zone A'
        }
      }
    ];

    // Simulate API loading delay
    setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filter.type && log.type !== filter.type) return false;
    if (filter.result && log.result !== filter.result) return false;
    if (filter.device && !log.device_name?.toLowerCase().includes(filter.device.toLowerCase())) return false;
    if (filter.user && !log.user_name?.toLowerCase().includes(filter.user.toLowerCase())) return false;
    if (filter.startDate && new Date(log.timestamp) < new Date(filter.startDate)) return false;
    if (filter.endDate && new Date(log.timestamp) > new Date(filter.endDate)) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + logsPerPage);

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      manual_command: '🎮',
      rule_trigger: '⚙️',
      rule_deploy: '🚀',
      safety_override: '🚨',
      device_offline: '📡'
    };
    return icons[type] || '📝';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      manual_command: 'bg-blue-100 text-blue-800',
      rule_trigger: 'bg-green-100 text-green-800',
      rule_deploy: 'bg-purple-100 text-purple-800',
      safety_override: 'bg-red-100 text-red-800',
      device_offline: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getResultColor = (result: string) => {
    const colors: Record<string, string> = {
      success: 'bg-green-100 text-green-800',
      failure: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[result] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading automation logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Automation Logs</h1>
        <p className="text-gray-600 mt-1">
          View audit trail of all automation activities, manual commands, and system events
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Types</option>
              <option value="manual_command">Manual Command</option>
              <option value="rule_trigger">Rule Trigger</option>
              <option value="rule_deploy">Rule Deploy</option>
              <option value="safety_override">Safety Override</option>
              <option value="device_offline">Device Offline</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Result
            </label>
            <select
              value={filter.result}
              onChange={(e) => setFilter(prev => ({ ...prev, result: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Results</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device
            </label>
            <input
              type="text"
              value={filter.device}
              onChange={(e) => setFilter(prev => ({ ...prev, device: e.target.value }))}
              placeholder="Search device..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User
            </label>
            <input
              type="text"
              value={filter.user}
              onChange={(e) => setFilter(prev => ({ ...prev, user: e.target.value }))}
              placeholder="Search user..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {currentLogs.length} of {filteredLogs.length} logs
          </p>
          <button
            onClick={() => setFilter({
              type: '', result: '', device: '', user: '', startDate: '', endDate: ''
            })}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {currentLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
            <p className="text-gray-500">
              {filteredLogs.length === 0 && logs.length > 0
                ? 'Try adjusting your filters to see more results.'
                : 'Automation activity will appear here as it happens.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device/Rule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scope
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getTypeIcon(log.type)}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(log.type)}`}>
                            {log.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={log.action}>
                          {log.action}
                        </div>
                        {log.error_message && (
                          <div className="text-red-600 text-xs mt-1">
                            {log.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          {log.device_name && (
                            <div className="font-medium">{log.device_name}</div>
                          )}
                          {log.rule_name && (
                            <div className="font-medium text-purple-700">{log.rule_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.user_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getResultColor(log.result)}`}>
                          {log.result.charAt(0).toUpperCase() + log.result.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={log.scope.path}>
                          {log.scope.path}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(startIndex + logsPerPage, filteredLogs.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredLogs.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === currentPage
                                ? 'z-10 bg-green-50 border-green-500 text-green-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AutomationLogs;