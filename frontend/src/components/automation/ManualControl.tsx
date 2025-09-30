import React, { useState, useCallback } from 'react';
import { Device, ManualCommand, ManualCommandResponse, DEVICE_TYPES, DEFAULT_MANUAL_TIMEOUT, MAX_MANUAL_TIMEOUT } from '../../types/automation';

interface ManualControlProps {
  devices: Device[];
  onSendCommand: (command: ManualCommand) => Promise<ManualCommandResponse>;
  isAdmin?: boolean;
}

const ManualControl: React.FC<ManualControlProps> = ({
  devices,
  onSendCommand,
  isAdmin = false
}) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [commandType, setCommandType] = useState<'override' | 'pulse' | 'release'>('override');
  const [actionValue, setActionValue] = useState<number>(0);
  const [duration, setDuration] = useState<number>(DEFAULT_MANUAL_TIMEOUT);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<ManualCommandResponse | null>(null);

  const handleDeviceSelect = useCallback((device: Device) => {
    setSelectedDevice(device);
    setActionValue(0);
    setReason('');
    setLastCommand(null);
  }, []);

  const handleSendCommand = useCallback(async (action: string, value?: number) => {
    if (!selectedDevice) return;

    const command: ManualCommand = {
      cmd_type: commandType,
      device_id: selectedDevice.id,
      action: {
        mode: commandType === 'release' ? 'auto' : 'manual',
        value: value,
        duration_sec: commandType === 'pulse' ? duration : undefined
      },
      owner: {
        user_id: 'current-user', // TODO: Get from auth context
        name: 'Current User'
      },
      reason: reason || undefined,
      duration_sec: commandType === 'release' ? 0 : duration,
      timestamp: new Date().toISOString()
    };

    setLoading(selectedDevice.id);
    try {
      const response = await onSendCommand(command);
      setLastCommand(response);
      if (response.status === 'ack') {
        // Update local device state optimistically
        // In real app, this would come from WebSocket updates
      }
    } catch (error) {
      console.error('Failed to send command:', error);
      setLastCommand({
        status: 'failure',
        message: 'Failed to send command'
      });
    } finally {
      setLoading(null);
    }
  }, [selectedDevice, commandType, duration, reason, onSendCommand]);

  const getDeviceIcon = (type: string) => {
    const icons: Record<string, string> = {
      fan: '🌪️',
      vent: '🪟',
      pump: '💧',
      valve: '🚰',
      dosing_pump: '💉',
      sensor: '📊'
    };
    return icons[type] || '⚙️';
  };

  const getDeviceStatus = (device: Device) => {
    if (!device.online) return 'offline';
    if (device.state.lock) return 'locked';
    if (device.state.mode === 'manual') return 'manual';
    if (device.state.mode === 'safety') return 'safety';
    return 'auto';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      auto: 'bg-green-100 text-green-800',
      manual: 'bg-blue-100 text-blue-800',
      safety: 'bg-red-100 text-red-800',
      locked: 'bg-yellow-100 text-yellow-800',
      offline: 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const canControl = (device: Device) => {
    return device.online && !device.state.lock && (isAdmin || device.state.mode !== 'safety');
  };

  const maxTimeout = isAdmin ? Infinity : MAX_MANUAL_TIMEOUT;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manual Device Control</h1>
        <p className="text-gray-600 mt-1">
          Override automated controls and manually operate devices
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Device List */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Devices</h2>
          <div className="grid gap-4">
            {devices.map(device => {
              const status = getDeviceStatus(device);
              const controllable = canControl(device);

              return (
                <div
                  key={device.id}
                  className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
                    selectedDevice?.id === device.id
                      ? 'border-green-500 ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!controllable ? 'opacity-50' : ''}`}
                  onClick={() => controllable && handleDeviceSelect(device)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getDeviceIcon(device.type)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{device.name}</h3>
                        <p className="text-sm text-gray-500">{device.scope.path}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      {device.state.on && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          ON
                        </span>
                      )}
                      {device.state.value !== undefined && (
                        <span className="text-sm text-gray-600">
                          {device.state.value}%
                        </span>
                      )}
                    </div>
                  </div>

                  {device.state.manualOverrideUntil && (
                    <div className="mt-2 text-xs text-blue-600">
                      Manual override until: {new Date(device.state.manualOverrideUntil).toLocaleString()}
                    </div>
                  )}

                  {!controllable && (
                    <div className="mt-2 text-xs text-red-600">
                      {!device.online && 'Device offline'}
                      {device.state.lock && 'Device locked (safety override)'}
                      {!isAdmin && device.state.mode === 'safety' && 'Safety mode - admin access required'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Control Panel */}
        <div className="lg:col-span-1">
          {selectedDevice ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Control: {selectedDevice.name}
              </h2>

              {/* Command Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Command Type
                </label>
                <select
                  value={commandType}
                  onChange={(e) => setCommandType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="override">Override (Manual Control)</option>
                  <option value="pulse">Pulse (Temporary Action)</option>
                  <option value="release">Release (Return to Auto)</option>
                </select>
              </div>

              {/* Action Controls */}
              {commandType !== 'release' && (
                <div className="space-y-4">
                  {/* Available Actions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Actions
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDevice.supportedActions.map(action => (
                        <button
                          key={action.action}
                          onClick={() => handleSendCommand(action.action,
                            ['on', 'off'].includes(action.action) ? undefined : actionValue
                          )}
                          disabled={loading === selectedDevice.id}
                          className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {action.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Value Input for actions that need it */}
                  {selectedDevice.supportedActions.some(a => !['on', 'off'].includes(a.action)) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Value (%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={actionValue}
                        onChange={(e) => setActionValue(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>0%</span>
                        <span className="font-medium">{actionValue}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Duration */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={Math.floor(duration / 60)}
                  onChange={(e) => setDuration(parseInt(e.target.value) * 60)}
                  min="1"
                  max={isAdmin ? 999999 : Math.floor(MAX_MANUAL_TIMEOUT / 60)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={commandType === 'release'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {commandType === 'override' && 'How long to maintain manual control'}
                  {commandType === 'pulse' && 'How long to run the action'}
                  {commandType === 'release' && 'Returns device to automatic control'}
                </p>
              </div>

              {/* Reason */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Emergency cooling, Maintenance test..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Command Response */}
              {lastCommand && (
                <div className={`mt-4 p-3 rounded-md ${
                  lastCommand.status === 'ack' ? 'bg-green-50 text-green-800' :
                  lastCommand.status === 'failure' ? 'bg-red-50 text-red-800' :
                  'bg-yellow-50 text-yellow-800'
                }`}>
                  <div className="font-medium">
                    {lastCommand.status === 'ack' ? 'Command Successful' :
                     lastCommand.status === 'failure' ? 'Command Failed' :
                     'Command Pending'}
                  </div>
                  {lastCommand.message && (
                    <div className="text-sm mt-1">{lastCommand.message}</div>
                  )}
                </div>
              )}

              {/* Emergency Release Button */}
              {selectedDevice.state.mode === 'manual' && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleSendCommand('release')}
                    disabled={loading === selectedDevice.id}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    🚨 Emergency Release to Auto
                  </button>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Immediately return device to automatic control
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <div className="text-gray-400 text-4xl mb-3">⚙️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Device
              </h3>
              <p className="text-gray-600">
                Choose a device from the list to control it manually
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Safety Warning */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-yellow-400 text-xl mr-3">⚠️</div>
          <div>
            <h4 className="font-medium text-yellow-800">Safety Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Manual device control overrides automated safety systems. Always ensure manual operations are safe
              for plants, equipment, and personnel. Devices will automatically return to normal operation after
              the specified duration or if safety conditions are triggered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualControl;