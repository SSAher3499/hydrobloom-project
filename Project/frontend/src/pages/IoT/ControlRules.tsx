/**
 * Control Rules Builder
 * Create and manage automation rules (threshold, PID, scheduled)
 */

import React, { useState, useEffect } from 'react';
import iotService from '../../services/iotService';
import type {
  RaspberryPi,
  ControlRule,
  Sensor,
  ModbusActuator,
  CreateRuleForm,
  ControlRuleType,
} from '../../types/iot';

export default function ControlRules() {
  const [pis, setPis] = useState<RaspberryPi[]>([]);
  const [selectedPi, setSelectedPi] = useState<RaspberryPi | null>(null);
  const [rules, setRules] = useState<ControlRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);

  const [ruleForm, setRuleForm] = useState<CreateRuleForm>({
    name: '',
    ruleType: 'THRESHOLD',
    isActive: true,
    priority: 50,
    conditions: {},
    actions: {},
  });

  useEffect(() => {
    loadPis();
  }, []);

  useEffect(() => {
    if (selectedPi) {
      loadRules(selectedPi.id);
    }
  }, [selectedPi]);

  const loadPis = async () => {
    try {
      const farmId = localStorage.getItem('currentFarmId') || '';
      const data = await iotService.getPis(farmId);
      setPis(data);
      if (data.length > 0) {
        setSelectedPi(data[0]);
      }
    } catch (error) {
      console.error('Failed to load Pis:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async (piId: string) => {
    try {
      const data = await iotService.getRules(piId);
      setRules(data);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPi) return;

    try {
      await iotService.createRule(selectedPi.id, ruleForm);
      setShowRuleModal(false);
      resetForm();
      loadRules(selectedPi.id);
      alert('Control rule created successfully!');
    } catch (error: any) {
      console.error('Failed to create rule:', error);
      alert(error.response?.data?.error || 'Failed to create rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await iotService.deleteRule(id);
      if (selectedPi) {
        loadRules(selectedPi.id);
      }
      alert('Rule deleted successfully!');
    } catch (error) {
      console.error('Failed to delete rule:', error);
      alert('Failed to delete rule');
    }
  };

  const handleToggleRule = async (rule: ControlRule) => {
    try {
      await iotService.updateRule(rule.id, { isActive: !rule.isActive });
      if (selectedPi) {
        loadRules(selectedPi.id);
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      alert('Failed to toggle rule');
    }
  };

  const resetForm = () => {
    setRuleForm({
      name: '',
      ruleType: 'THRESHOLD',
      isActive: true,
      priority: 50,
      conditions: {},
      actions: {},
    });
  };

  const getRuleTypeColor = (ruleType: ControlRuleType) => {
    switch (ruleType) {
      case 'THRESHOLD':
        return 'bg-blue-600';
      case 'PID':
        return 'bg-purple-600';
      case 'SCHEDULED':
        return 'bg-green-600';
      case 'EMERGENCY_STOP':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-cyan-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (pis.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400 mb-4">No Raspberry Pis found.</p>
          <p className="text-gray-500">Register a Pi first to create control rules.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400">Control Rules</h1>
          <p className="text-gray-400 mt-1">Automate your greenhouse with smart rules</p>
        </div>
        <button
          onClick={() => setShowRuleModal(true)}
          disabled={!selectedPi}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Create Rule
        </button>
      </div>

      {/* Pi Selector */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Select Raspberry Pi:
        </label>
        <select
          value={selectedPi?.id || ''}
          onChange={(e) => {
            const pi = pis.find((p) => p.id === e.target.value);
            setSelectedPi(pi || null);
          }}
          className="w-full md:w-auto bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          {pis.map((pi) => (
            <option key={pi.id} value={pi.id}>
              {pi.name} ({pi.status})
            </option>
          ))}
        </select>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400 mb-4">No control rules configured yet.</p>
          <button
            onClick={() => setShowRuleModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Create Your First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{rule.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getRuleTypeColor(
                        rule.ruleType
                      )}`}
                    >
                      {rule.ruleType}
                    </span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                      Priority: {rule.priority}
                    </span>
                  </div>

                  {/* Threshold Rule Details */}
                  {rule.ruleType === 'THRESHOLD' && (
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>
                        Condition: Sensor value {rule.conditions.operator}{' '}
                        {rule.conditions.threshold}
                      </p>
                      <p>
                        Action: Set actuator to {rule.actions.targetState === 1 ? 'ON' : 'OFF'}
                      </p>
                    </div>
                  )}

                  {/* PID Rule Details */}
                  {rule.ruleType === 'PID' && rule.pidConfig && (
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>Setpoint: {rule.pidConfig.setpoint}</p>
                      <p>
                        PID Parameters: Kp={rule.pidConfig.kp}, Ki={rule.pidConfig.ki}, Kd=
                        {rule.pidConfig.kd}
                      </p>
                      <p>
                        Output Range: {rule.pidConfig.outputMin} - {rule.pidConfig.outputMax}
                      </p>
                    </div>
                  )}

                  {/* Scheduled Rule Details */}
                  {rule.ruleType === 'SCHEDULED' && rule.schedule && (
                    <div className="text-sm text-gray-300">
                      <p>Schedule: {rule.schedule}</p>
                      <p>
                        Action: Set actuator to {rule.actions.targetState === 1 ? 'ON' : 'OFF'}
                      </p>
                    </div>
                  )}

                  {rule.lastTriggered && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleRule(rule)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      rule.isActive
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                    }`}
                  >
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Rule Modal */}
      {showRuleModal && selectedPi && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-cyan-500 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">
              Create Control Rule for {selectedPi.name}
            </h3>
            <form onSubmit={handleCreateRule} className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., High Temperature Fan Control"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    Rule Type *
                  </label>
                  <select
                    value={ruleForm.ruleType}
                    onChange={(e) => {
                      const newType = e.target.value as ControlRuleType;
                      setRuleForm({ ...ruleForm, ruleType: newType, conditions: {}, actions: {} });
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="THRESHOLD">Threshold (ON/OFF)</option>
                    <option value="PID">PID Control</option>
                    <option value="SCHEDULED">Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    Priority (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={ruleForm.priority}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              {/* Threshold Rule Configuration */}
              {ruleForm.ruleType === 'THRESHOLD' && (
                <div className="border-t border-gray-700 pt-4 space-y-4">
                  <h4 className="font-semibold text-gray-300">Threshold Configuration</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Sensor ID *</label>
                      <input
                        type="text"
                        required
                        value={ruleForm.conditions.sensorId || ''}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            conditions: { ...ruleForm.conditions, sensorId: e.target.value },
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        placeholder="Sensor ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Operator *</label>
                      <select
                        value={ruleForm.conditions.operator || '>'}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            conditions: { ...ruleForm.conditions, operator: e.target.value },
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      >
                        <option value=">">{'>'}</option>
                        <option value="<">{'<'}</option>
                        <option value=">=">{'>='}</option>
                        <option value="<=">{'<='}</option>
                        <option value="==">{'=='}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Threshold *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={ruleForm.conditions.threshold || ''}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            conditions: {
                              ...ruleForm.conditions,
                              threshold: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Actuator ID *</label>
                      <input
                        type="text"
                        required
                        value={ruleForm.actions.actuatorId || ''}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            actions: { ...ruleForm.actions, actuatorId: e.target.value },
                            actuatorId: e.target.value,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Target State *</label>
                      <select
                        value={ruleForm.actions.targetState || 1}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            actions: {
                              ...ruleForm.actions,
                              targetState: parseInt(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      >
                        <option value={1}>ON (1)</option>
                        <option value={0}>OFF (0)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* PID Rule Configuration */}
              {ruleForm.ruleType === 'PID' && (
                <div className="border-t border-gray-700 pt-4 space-y-4">
                  <h4 className="font-semibold text-gray-300">PID Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Sensor ID *</label>
                      <input
                        type="text"
                        required
                        value={ruleForm.conditions.sensorId || ''}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            conditions: { ...ruleForm.conditions, sensorId: e.target.value },
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Actuator ID *</label>
                      <input
                        type="text"
                        required
                        value={ruleForm.actions.actuatorId || ''}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            actions: { ...ruleForm.actions, actuatorId: e.target.value },
                            actuatorId: e.target.value,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Kp *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={ruleForm.pidConfig?.kp || ''}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            pidConfig: {
                              ...ruleForm.pidConfig,
                              kp: parseFloat(e.target.value),
                              ki: ruleForm.pidConfig?.ki || 0,
                              kd: ruleForm.pidConfig?.kd || 0,
                              setpoint: ruleForm.pidConfig?.setpoint || 0,
                              outputMin: ruleForm.pidConfig?.outputMin || 0,
                              outputMax: ruleForm.pidConfig?.outputMax || 100,
                            },
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Ki *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={ruleForm.pidConfig?.ki || ''}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            pidConfig: {
                              ...ruleForm.pidConfig!,
                              ki: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Kd *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={ruleForm.pidConfig?.kd || ''}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            pidConfig: {
                              ...ruleForm.pidConfig!,
                              kd: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Setpoint *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={ruleForm.pidConfig?.setpoint || ''}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            pidConfig: {
                              ...ruleForm.pidConfig!,
                              setpoint: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Output Min *</label>
                      <input
                        type="number"
                        required
                        value={ruleForm.pidConfig?.outputMin || ''}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            pidConfig: {
                              ...ruleForm.pidConfig!,
                              outputMin: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Output Max *</label>
                      <input
                        type="number"
                        required
                        value={ruleForm.pidConfig?.outputMax || ''}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            pidConfig: {
                              ...ruleForm.pidConfig!,
                              outputMax: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Scheduled Rule Configuration */}
              {ruleForm.ruleType === 'SCHEDULED' && (
                <div className="border-t border-gray-700 pt-4 space-y-4">
                  <h4 className="font-semibold text-gray-300">Schedule Configuration</h4>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Cron Expression * (e.g., "0 6 * * *" for 6 AM daily)
                    </label>
                    <input
                      type="text"
                      required
                      value={ruleForm.schedule || ''}
                      onChange={(e) => setRuleForm({ ...ruleForm, schedule: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      placeholder="0 6 * * *"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Actuator ID *</label>
                      <input
                        type="text"
                        required
                        value={ruleForm.actions.actuatorId || ''}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            actions: { ...ruleForm.actions, actuatorId: e.target.value },
                            actuatorId: e.target.value,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Target State *</label>
                      <select
                        value={ruleForm.actions.targetState || 1}
                        onChange={(e) =>
                          setRuleForm({
                            ...ruleForm,
                            actions: {
                              ...ruleForm.actions,
                              targetState: parseInt(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      >
                        <option value={1}>ON (1)</option>
                        <option value={0}>OFF (0)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowRuleModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
