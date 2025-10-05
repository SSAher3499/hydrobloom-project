import React, { useState, useEffect } from 'react';
import { AutomationRule } from '../../types/automation';
import RuleBuilder from '../../components/automation/RuleBuilder';

const AutomationRules: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | undefined>();
  const [loading, setLoading] = useState(false);

  // Mock devices data - in real app, fetch from API
  const mockDevices = [
    { id: 'fan-1', name: 'Exhaust Fan 1', type: 'fan' },
    { id: 'fan-2', name: 'Circulation Fan 2', type: 'fan' },
    { id: 'vent-1', name: 'Top Vent', type: 'vent' },
    { id: 'pump-1', name: 'Main Water Pump', type: 'pump' },
    { id: 'valve-1', name: 'Irrigation Valve 1', type: 'valve' },
    { id: 'dosing-1', name: 'Nutrient Dosing Pump', type: 'dosing_pump' }
  ];

  // Mock rules data
  useEffect(() => {
    const mockRules: AutomationRule[] = [
      {
        id: 'rule-1',
        name: 'High Temperature Fan Control',
        description: 'Turn on exhaust fan when temperature exceeds 28°C',
        scope: {
          type: 'polyhouse',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          name: 'Polyhouse 1',
          path: 'Farm A > Polyhouse 1'
        },
        priority: 8,
        mode: 'auto',
        trigger: {
          sensor_type: 'temperature',
          operator: 'gt',
          value: 28,
          duration_sec: 300,
          scope: {
            type: 'polyhouse',
            farmId: 'farm-1',
            polyhouseId: 'polyhouse-1',
            name: 'Polyhouse 1',
            path: 'Farm A > Polyhouse 1'
          }
        },
        actions: [
          {
            device_id: 'fan-1',
            device_name: 'Exhaust Fan 1',
            command: {
              action: 'set_speed',
              value: 80
            }
          }
        ],
        created_by: 'user-1',
        created_at: '2024-01-15T10:30:00Z',
        deployed: true
      },
      {
        id: 'rule-2',
        name: 'Low Humidity Misting',
        description: 'Activate misting when humidity drops below 60%',
        scope: {
          type: 'zone',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          zoneId: 'zone-1',
          name: 'Zone A',
          path: 'Farm A > Polyhouse 1 > Zone A'
        },
        priority: 6,
        mode: 'auto',
        trigger: {
          sensor_type: 'humidity',
          operator: 'lt',
          value: 60,
          duration_sec: 180,
          scope: {
            type: 'zone',
            farmId: 'farm-1',
            polyhouseId: 'polyhouse-1',
            zoneId: 'zone-1',
            name: 'Zone A',
            path: 'Farm A > Polyhouse 1 > Zone A'
          }
        },
        actions: [
          {
            device_id: 'pump-1',
            device_name: 'Main Water Pump',
            command: {
              action: 'on'
            }
          },
          {
            device_id: 'valve-1',
            device_name: 'Irrigation Valve 1',
            command: {
              action: 'on'
            },
            delay_sec: 5
          }
        ],
        stop_condition: {
          sensor_type: 'humidity',
          operator: 'gte',
          value: 70,
          duration_sec: 60
        },
        created_by: 'user-1',
        created_at: '2024-01-14T14:20:00Z',
        deployed: true
      }
    ];
    setRules(mockRules);
  }, []);

  const handleCreateRule = () => {
    setEditingRule(undefined);
    setShowBuilder(true);
  };

  const handleEditRule = (rule: AutomationRule) => {
    setEditingRule(rule);
    setShowBuilder(true);
  };

  const handleSaveRule = async (rule: AutomationRule) => {
    setLoading(true);
    try {
      // In real app, make API call to save rule
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      if (editingRule) {
        setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
      } else {
        const newRule = { ...rule, id: `rule-${Date.now()}`, created_at: new Date().toISOString() };
        setRules(prev => [...prev, newRule]);
      }

      setShowBuilder(false);
      setEditingRule(undefined);
    } catch (error) {
      console.error('Failed to save rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    setLoading(true);
    try {
      // In real app, make API call to delete rule
      await new Promise(resolve => setTimeout(resolve, 500));
      setRules(prev => prev.filter(r => r.id !== ruleId));
    } catch (error) {
      console.error('Failed to delete rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    setLoading(true);
    try {
      // In real app, make API call to toggle rule
      await new Promise(resolve => setTimeout(resolve, 500));
      setRules(prev => prev.map(r =>
        r.id === ruleId ? { ...r, mode: enabled ? 'auto' : 'disabled' } : r
      ));
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showBuilder) {
    return (
      <RuleBuilder
        initialRule={editingRule}
        onSave={handleSaveRule}
        onCancel={() => {
          setShowBuilder(false);
          setEditingRule(undefined);
        }}
        availableDevices={mockDevices}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Rules</h1>
          <p className="text-gray-600 mt-1">
            Create and manage automated responses to sensor conditions
          </p>
        </div>
        <button
          onClick={handleCreateRule}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          Create New Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">⚙️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No automation rules</h3>
          <p className="text-gray-500 mb-4">
            Create your first automation rule to get started with automated farm management.
          </p>
          <button
            onClick={handleCreateRule}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Create Your First Rule
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {rules.map(rule => (
            <div key={rule.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rule.mode === 'auto' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {rule.mode === 'auto' ? 'Active' : 'Disabled'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Priority {rule.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{rule.description}</p>
                  <p className="text-sm text-gray-500">{rule.scope.path}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleRule(rule.id!, rule.mode !== 'auto')}
                    disabled={loading}
                    className={`px-3 py-1 text-sm rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${
                      rule.mode === 'auto'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500'
                        : 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                    }`}
                  >
                    {rule.mode === 'auto' ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleEditRule(rule)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id!)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Trigger */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Trigger</h4>
                    <div className="text-sm text-gray-600">
                      <p>When <strong>{rule.trigger.sensor_type.replace('_', ' ')}</strong> is <strong>{rule.trigger.operator}</strong> <strong>{rule.trigger.value}</strong></p>
                      <p>for <strong>{rule.trigger.duration_sec}s</strong></p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {rule.actions.map((action, index) => (
                        <p key={index}>
                          {action.delay_sec && action.delay_sec > 0 && `After ${action.delay_sec}s: `}
                          <strong>{action.device_name}</strong> → {action.command.action}
                          {action.command.value && ` (${action.command.value})`}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {rule.stop_condition && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-2">Stop Condition</h4>
                    <p className="text-sm text-gray-600">
                      Stop when <strong>{rule.stop_condition.sensor_type.replace('_', ' ')}</strong> is <strong>{rule.stop_condition.operator}</strong> <strong>{rule.stop_condition.value}</strong> for <strong>{rule.stop_condition.duration_sec}s</strong>
                    </p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                  <span>Created: {new Date(rule.created_at!).toLocaleDateString()}</span>
                  <span>Status: {rule.deployed ? 'Deployed' : 'Draft'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutomationRules;