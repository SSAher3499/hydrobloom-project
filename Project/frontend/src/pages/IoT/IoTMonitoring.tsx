/**
 * IoT Monitoring Dashboard
 * Real-time monitoring of sensors, actuators, and Raspberry Pis
 */

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import iotService from '../../services/iotService';
import type {
  Sensor,
  ModbusActuator,
  RaspberryPi,
  SensorUpdateEvent,
  ActuatorUpdateEvent,
  PiStatusUpdateEvent,
  InitialIoTData,
} from '../../types/iot';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function IoTMonitoring() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [actuators, setActuators] = useState<ModbusActuator[]>([]);
  const [pis, setPis] = useState<RaspberryPi[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [selectedPiForStop, setSelectedPiForStop] = useState<string | null>(null);

  // Get farmId from localStorage or context (adjust based on your auth setup)
  const farmId = localStorage.getItem('currentFarmId') || '';

  useEffect(() => {
    if (!farmId) {
      setLoading(false);
      return;
    }

    // Initialize Socket.io connection
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('Socket.io connected');
      setIsConnected(true);
      // Subscribe to farm updates
      newSocket.emit('subscribe', { farmId });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setIsConnected(false);
    });

    // Listen for initial IoT data
    newSocket.on('initial-iot-data', (data: InitialIoTData) => {
      console.log('Received initial IoT data:', data);
      setSensors(data.sensors || []);
      setActuators(data.actuators || []);
      setPis(data.pis || []);
      setLoading(false);
    });

    // Listen for real-time sensor updates
    newSocket.on('sensor-update', (data: SensorUpdateEvent) => {
      setSensors((prev) =>
        prev.map((sensor) =>
          sensor.id === data.sensorId
            ? { ...sensor, latestValue: data.value, lastSeen: data.timestamp }
            : sensor
        )
      );
    });

    // Listen for real-time actuator updates
    newSocket.on('actuator-update', (data: ActuatorUpdateEvent) => {
      setActuators((prev) =>
        prev.map((actuator) =>
          actuator.id === data.actuatorId
            ? { ...actuator, currentState: data.state, lastToggled: data.timestamp }
            : actuator
        )
      );
    });

    // Listen for Pi status updates
    newSocket.on('pi-status-update', (data: PiStatusUpdateEvent) => {
      setPis((prev) =>
        prev.map((pi) =>
          pi.id === data.piId
            ? { ...pi, status: data.status, lastSeen: data.timestamp }
            : pi
        )
      );
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [farmId]);

  const handleActuatorToggle = async (actuatorId: string, currentState: number) => {
    const newState = currentState === 0 ? 1 : 0;
    try {
      await iotService.controlActuator(actuatorId, newState);
      // Update optimistically (real update will come via Socket.io)
      setActuators((prev) =>
        prev.map((a) => (a.id === actuatorId ? { ...a, currentState: newState } : a))
      );
    } catch (error) {
      console.error('Failed to control actuator:', error);
      alert('Failed to control actuator');
    }
  };

  const handleEmergencyStop = async () => {
    if (!selectedPiForStop) return;

    try {
      await iotService.emergencyStop(selectedPiForStop);
      alert('Emergency stop triggered! All actuators have been turned off.');
      setShowEmergencyDialog(false);
      setSelectedPiForStop(null);
    } catch (error) {
      console.error('Failed to trigger emergency stop:', error);
      alert('Failed to trigger emergency stop');
    }
  };

  const getSensorStatusColor = (sensor: Sensor) => {
    if (!sensor.lastSeen) return 'bg-gray-500';
    const lastSeenTime = new Date(sensor.lastSeen).getTime();
    const now = Date.now();
    const diff = now - lastSeenTime;

    if (diff < 10000) return 'bg-green-500'; // < 10s
    if (diff < 30000) return 'bg-yellow-500'; // < 30s
    return 'bg-red-500'; // > 30s
  };

  const getPiStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-500';
      case 'OFFLINE':
        return 'bg-gray-500';
      case 'ERROR':
        return 'bg-red-500';
      case 'MAINTENANCE':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!farmId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-900/30 border border-yellow-500 text-yellow-200 p-4 rounded-lg">
          Please select a farm to view IoT monitoring data.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-cyan-400 text-lg">Loading IoT data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400">IoT Monitoring</h1>
          <p className="text-gray-400 mt-1">Real-time sensor data and actuator control</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></div>
            <span className="text-sm text-gray-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Raspberry Pi Status Cards */}
      {pis.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-3">Raspberry Pi Controllers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pis.map((pi) => (
              <div
                key={pi.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{pi.name}</h3>
                    <p className="text-sm text-gray-400">MAC: {pi.macAddress}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getPiStatusColor(
                      pi.status
                    )} text-white`}
                  >
                    {pi.status}
                  </div>
                </div>
                {pi.lastSeen && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last seen: {new Date(pi.lastSeen).toLocaleString()}
                  </p>
                )}
                <button
                  onClick={() => {
                    setSelectedPiForStop(pi.id);
                    setShowEmergencyDialog(true);
                  }}
                  className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  🚨 Emergency Stop
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sensors Grid */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3">
          Sensors ({sensors.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sensors.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-400">
              No sensors configured. Add sensors via Pi Management page.
            </div>
          ) : (
            sensors.map((sensor) => (
              <div
                key={sensor.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300">{sensor.type}</h3>
                    <p className="text-xs text-gray-500">{sensor.name || 'Unnamed Sensor'}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${getSensorStatusColor(sensor)}`}></div>
                </div>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-cyan-400">
                    {sensor.latestValue !== null && sensor.latestValue !== undefined
                      ? sensor.latestValue.toFixed(2)
                      : '--'}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{sensor.unit || ''}</div>
                </div>
                {sensor.lastSeen && (
                  <div className="text-xs text-gray-500 text-center mt-2">
                    {new Date(sensor.lastSeen).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Actuators Grid */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3">
          Actuators ({actuators.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {actuators.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-400">
              No actuators configured. Add actuators via Pi Management page.
            </div>
          ) : (
            actuators.map((actuator) => (
              <div
                key={actuator.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition"
              >
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-white">{actuator.name}</h3>
                  <p className="text-sm text-gray-400">{actuator.type}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    State: {actuator.currentState === 0 ? 'OFF' : 'ON'}
                  </span>
                  <button
                    onClick={() => handleActuatorToggle(actuator.id, actuator.currentState)}
                    className={`px-6 py-2 rounded-lg font-semibold transition ${
                      actuator.currentState === 0
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                  >
                    {actuator.currentState === 0 ? 'Turn ON' : 'Turn OFF'}
                  </button>
                </div>
                {actuator.lastToggled && (
                  <div className="text-xs text-gray-500 mt-2">
                    Last toggled: {new Date(actuator.lastToggled).toLocaleString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Emergency Stop Confirmation Dialog */}
      {showEmergencyDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-red-500 mb-4">⚠️ Emergency Stop</h3>
            <p className="text-white mb-6">
              This will immediately turn OFF all actuators connected to this Raspberry Pi. This
              action should only be used in emergency situations.
            </p>
            <p className="text-gray-300 mb-6">Are you sure you want to proceed?</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEmergencyDialog(false);
                  setSelectedPiForStop(null);
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEmergencyStop}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Confirm Emergency Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
