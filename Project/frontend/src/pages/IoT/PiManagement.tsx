/**
 * Pi Management Page
 * Register and manage Raspberry Pi controllers, sensors, and actuators
 */

import React, { useState, useEffect } from 'react';
import iotService from '../../services/iotService';
import type {
  RaspberryPi,
  CreatePiForm,
  CreateSensorForm,
  CreateActuatorForm,
  ActuatorType,
} from '../../types/iot';

export default function PiManagement() {
  const [pis, setPis] = useState<RaspberryPi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPiModal, setShowPiModal] = useState(false);
  const [showSensorModal, setShowSensorModal] = useState(false);
  const [showActuatorModal, setShowActuatorModal] = useState(false);
  const [selectedPi, setSelectedPi] = useState<RaspberryPi | null>(null);
  const [expandedPi, setExpandedPi] = useState<string | null>(null);

  // Form states
  const [piForm, setPiForm] = useState<CreatePiForm>({
    name: '',
    macAddress: '',
    ipAddress: '',
    farmId: localStorage.getItem('currentFarmId') || '',
    serialPort: '/dev/ttyUSB0',
  });

  const [sensorForm, setSensorForm] = useState<CreateSensorForm>({
    name: '',
    type: 'temperature',
    zoneId: '',
    unit: '°C',
    modbusSlaveId: 1,
    modbusRegisterAddr: 0,
    modbusRegisterType: 'holding',
    modbusFunctionCode: 3,
    baudRate: 9600,
    scalingFactor: 0.1,
    scalingOffset: 0,
  });

  const [actuatorForm, setActuatorForm] = useState<CreateActuatorForm>({
    name: '',
    type: 'FAN',
    modbusSlaveId: 1,
    modbusRegisterAddr: 0,
    modbusRegisterType: 'coil',
    modbusFunctionCode: 5,
  });

  useEffect(() => {
    loadPis();
  }, []);

  const loadPis = async () => {
    try {
      const farmId = localStorage.getItem('currentFarmId') || '';
      const data = await iotService.getPis(farmId);
      setPis(data);
    } catch (error) {
      console.error('Failed to load Pis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePi = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await iotService.createPi(piForm);
      setShowPiModal(false);
      setPiForm({
        name: '',
        macAddress: '',
        ipAddress: '',
        farmId: localStorage.getItem('currentFarmId') || '',
        serialPort: '/dev/ttyUSB0',
      });
      loadPis();
      alert('Raspberry Pi registered successfully!');
    } catch (error: any) {
      console.error('Failed to create Pi:', error);
      alert(error.response?.data?.error || 'Failed to register Raspberry Pi');
    }
  };

  const handleCreateSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPi) return;

    try {
      await iotService.createSensor(selectedPi.id, sensorForm);
      setShowSensorModal(false);
      setSensorForm({
        name: '',
        type: 'temperature',
        zoneId: '',
        unit: '°C',
        modbusSlaveId: 1,
        modbusRegisterAddr: 0,
        modbusRegisterType: 'holding',
        modbusFunctionCode: 3,
        baudRate: 9600,
        scalingFactor: 0.1,
        scalingOffset: 0,
      });
      loadPis();
      alert('Sensor added successfully!');
    } catch (error: any) {
      console.error('Failed to create sensor:', error);
      alert(error.response?.data?.error || 'Failed to add sensor');
    }
  };

  const handleCreateActuator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPi) return;

    try {
      await iotService.createActuator(selectedPi.id, actuatorForm);
      setShowActuatorModal(false);
      setActuatorForm({
        name: '',
        type: 'FAN',
        modbusSlaveId: 1,
        modbusRegisterAddr: 0,
        modbusRegisterType: 'coil',
        modbusFunctionCode: 5,
      });
      loadPis();
      alert('Actuator added successfully!');
    } catch (error: any) {
      console.error('Failed to create actuator:', error);
      alert(error.response?.data?.error || 'Failed to add actuator');
    }
  };

  const handleDeletePi = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Raspberry Pi?')) return;

    try {
      await iotService.deletePi(id);
      loadPis();
      alert('Raspberry Pi deleted successfully!');
    } catch (error) {
      console.error('Failed to delete Pi:', error);
      alert('Failed to delete Raspberry Pi');
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-cyan-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400">Pi Management</h1>
          <p className="text-gray-400 mt-1">Manage Raspberry Pi controllers and their devices</p>
        </div>
        <button
          onClick={() => setShowPiModal(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-semibold transition"
        >
          + Register New Pi
        </button>
      </div>

      {/* Pi List */}
      {pis.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400 mb-4">No Raspberry Pis registered yet.</p>
          <button
            onClick={() => setShowPiModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Register Your First Pi
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pis.map((pi) => (
            <div key={pi.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              {/* Pi Header */}
              <div
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-750 transition"
                onClick={() => setExpandedPi(expandedPi === pi.id ? null : pi.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full ${getPiStatusColor(pi.status)}`}></div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{pi.name}</h3>
                    <p className="text-sm text-gray-400">
                      {pi.macAddress} • {pi.ipAddress || 'No IP'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="text-gray-300">
                      {pi._count?.sensors || 0} sensors • {pi._count?.actuators || 0} actuators
                    </div>
                    {pi.lastSeen && (
                      <div className="text-gray-500">
                        Last seen: {new Date(pi.lastSeen).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform ${
                      expandedPi === pi.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedPi === pi.id && (
                <div className="border-t border-gray-700 p-4 bg-gray-850 space-y-4">
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedPi(pi);
                        setShowSensorModal(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                    >
                      + Add Sensor
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPi(pi);
                        setShowActuatorModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
                    >
                      + Add Actuator
                    </button>
                    <button
                      onClick={() => handleDeletePi(pi.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition text-sm ml-auto"
                    >
                      Delete Pi
                    </button>
                  </div>

                  {/* Sensors */}
                  {pi.sensors && pi.sensors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Sensors:</h4>
                      <div className="space-y-2">
                        {pi.sensors.map((sensor) => (
                          <div
                            key={sensor.id}
                            className="bg-gray-800 p-3 rounded-lg flex justify-between items-center"
                          >
                            <div>
                              <div className="text-white font-semibold">{sensor.name || sensor.type}</div>
                              <div className="text-xs text-gray-400">
                                Slave: {sensor.modbusSlaveId} • Register: {sensor.modbusRegisterAddr} •
                                Type: {sensor.modbusRegisterType}
                              </div>
                            </div>
                            <div className="text-cyan-400 font-bold">
                              {sensor.latestValue?.toFixed(2) || '--'} {sensor.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actuators */}
                  {pi.actuators && pi.actuators.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Actuators:</h4>
                      <div className="space-y-2">
                        {pi.actuators.map((actuator) => (
                          <div
                            key={actuator.id}
                            className="bg-gray-800 p-3 rounded-lg flex justify-between items-center"
                          >
                            <div>
                              <div className="text-white font-semibold">{actuator.name}</div>
                              <div className="text-xs text-gray-400">
                                Type: {actuator.type} • Slave: {actuator.modbusSlaveId} • Register:{' '}
                                {actuator.modbusRegisterAddr}
                              </div>
                            </div>
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                actuator.currentState === 0
                                  ? 'bg-gray-600 text-gray-300'
                                  : 'bg-green-600 text-white'
                              }`}
                            >
                              {actuator.currentState === 0 ? 'OFF' : 'ON'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Register Pi Modal */}
      {showPiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-cyan-500 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">Register Raspberry Pi</h3>
            <form onSubmit={handleCreatePi} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={piForm.name}
                  onChange={(e) => setPiForm({ ...piForm, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., Polyhouse-1-Controller"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">
                  MAC Address *
                </label>
                <input
                  type="text"
                  required
                  value={piForm.macAddress}
                  onChange={(e) => setPiForm({ ...piForm, macAddress: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., b8:27:eb:12:34:56"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">IP Address</label>
                <input
                  type="text"
                  value={piForm.ipAddress}
                  onChange={(e) => setPiForm({ ...piForm, ipAddress: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., 192.168.1.100"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Serial Port</label>
                <input
                  type="text"
                  value={piForm.serialPort}
                  onChange={(e) => setPiForm({ ...piForm, serialPort: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPiModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Register Pi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Sensor Modal */}
      {showSensorModal && selectedPi && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-cyan-500 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">
              Add Sensor to {selectedPi.name}
            </h3>
            <form onSubmit={handleCreateSensor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={sensorForm.name}
                    onChange={(e) => setSensorForm({ ...sensorForm, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Type *</label>
                  <input
                    type="text"
                    required
                    value={sensorForm.type}
                    onChange={(e) => setSensorForm({ ...sensorForm, type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={sensorForm.unit}
                    onChange={(e) => setSensorForm({ ...sensorForm, unit: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    Zone ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={sensorForm.zoneId}
                    onChange={(e) => setSensorForm({ ...sensorForm, zoneId: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
              <div className="border-t border-gray-700 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Modbus Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Slave ID *</label>
                    <input
                      type="number"
                      required
                      value={sensorForm.modbusSlaveId}
                      onChange={(e) =>
                        setSensorForm({ ...sensorForm, modbusSlaveId: parseInt(e.target.value) })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Register Address *</label>
                    <input
                      type="number"
                      required
                      value={sensorForm.modbusRegisterAddr}
                      onChange={(e) =>
                        setSensorForm({
                          ...sensorForm,
                          modbusRegisterAddr: parseInt(e.target.value),
                        })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Register Type *</label>
                    <select
                      value={sensorForm.modbusRegisterType}
                      onChange={(e) =>
                        setSensorForm({ ...sensorForm, modbusRegisterType: e.target.value })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="holding">Holding</option>
                      <option value="input">Input</option>
                      <option value="coil">Coil</option>
                      <option value="discrete">Discrete</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Function Code *</label>
                    <input
                      type="number"
                      required
                      value={sensorForm.modbusFunctionCode}
                      onChange={(e) =>
                        setSensorForm({
                          ...sensorForm,
                          modbusFunctionCode: parseInt(e.target.value),
                        })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Scaling Factor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sensorForm.scalingFactor}
                      onChange={(e) =>
                        setSensorForm({ ...sensorForm, scalingFactor: parseFloat(e.target.value) })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Scaling Offset</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sensorForm.scalingOffset}
                      onChange={(e) =>
                        setSensorForm({ ...sensorForm, scalingOffset: parseFloat(e.target.value) })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSensorModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Add Sensor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Actuator Modal */}
      {showActuatorModal && selectedPi && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-cyan-500 rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">
              Add Actuator to {selectedPi.name}
            </h3>
            <form onSubmit={handleCreateActuator} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={actuatorForm.name}
                  onChange={(e) => setActuatorForm({ ...actuatorForm, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Type *</label>
                <select
                  value={actuatorForm.type}
                  onChange={(e) =>
                    setActuatorForm({ ...actuatorForm, type: e.target.value as ActuatorType })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="FAN">Fan</option>
                  <option value="PUMP">Pump</option>
                  <option value="FOGGER">Fogger</option>
                  <option value="MOTOR">Motor</option>
                  <option value="VALVE">Valve</option>
                  <option value="HEATER">Heater</option>
                  <option value="COOLER">Cooler</option>
                  <option value="LIGHT">Light</option>
                  <option value="VENT">Vent</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    Slave ID *
                  </label>
                  <input
                    type="number"
                    required
                    value={actuatorForm.modbusSlaveId}
                    onChange={(e) =>
                      setActuatorForm({ ...actuatorForm, modbusSlaveId: parseInt(e.target.value) })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    Register Address *
                  </label>
                  <input
                    type="number"
                    required
                    value={actuatorForm.modbusRegisterAddr}
                    onChange={(e) =>
                      setActuatorForm({
                        ...actuatorForm,
                        modbusRegisterAddr: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowActuatorModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Add Actuator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
