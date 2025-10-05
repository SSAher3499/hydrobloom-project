import React, { useState, useCallback } from 'react';
import { AutomationRule, RuleFormData, SensorType, SENSOR_TYPES, OPERATORS, DEVICE_TYPES } from '../../types/automation';

interface RuleBuilderProps {
  initialRule?: AutomationRule;
  onSave: (rule: AutomationRule) => void;
  onCancel: () => void;
  availableDevices?: Array<{ id: string; name: string; type: string }>;
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({
  initialRule,
  onSave,
  onCancel,
  availableDevices = []
}) => {
  const [formData, setFormData] = useState<RuleFormData>({
    name: initialRule?.name || '',
    description: initialRule?.description || '',
    scope: initialRule?.scope || null,
    priority: initialRule?.priority || 5,
    mode: initialRule?.mode || 'auto',
    trigger: {
      sensor_type: initialRule?.trigger.sensor_type || '',
      operator: initialRule?.trigger.operator || 'gt',
      value: initialRule?.trigger.value.toString() || '',
      value_max: initialRule?.trigger.value_max?.toString() || '',
      duration_sec: initialRule?.trigger.duration_sec.toString() || '300'
    },
    actions: initialRule?.actions.map(action => ({
      device_id: action.device_id,
      action: action.command.action,
      value: action.command.value?.toString() || '',
      delay_sec: action.delay_sec?.toString() || '0'
    })) || [{ device_id: '', action: '', value: '', delay_sec: '0' }],
    stop_condition: {
      enabled: !!initialRule?.stop_condition,
      sensor_type: initialRule?.stop_condition?.sensor_type || '',
      operator: initialRule?.stop_condition?.operator || 'lt',
      value: initialRule?.stop_condition?.value.toString() || '',
      duration_sec: initialRule?.stop_condition?.duration_sec.toString() || '300'
    }
  });

  const updateTrigger = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      trigger: { ...prev.trigger, [field]: value }
    }));
  }, []);

  const updateAction = useCallback((index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, [field]: value } : action
      )
    }));
  }, []);

  const addAction = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { device_id: '', action: '', value: '', delay_sec: '0' }]
    }));
  }, []);

  const removeAction = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  }, []);

  const updateStopCondition = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      stop_condition: { ...prev.stop_condition, [field]: value }
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const rule: AutomationRule = {
      id: initialRule?.id,
      name: formData.name,
      description: formData.description,
      scope: formData.scope!,
      priority: formData.priority,
      mode: formData.mode,
      trigger: {
        sensor_type: formData.trigger.sensor_type as SensorType,
        operator: formData.trigger.operator as any,
        value: parseFloat(formData.trigger.value),
        value_max: formData.trigger.value_max ? parseFloat(formData.trigger.value_max) : undefined,
        duration_sec: parseInt(formData.trigger.duration_sec),
        scope: formData.scope!
      },
      actions: formData.actions.map(action => ({
        device_id: action.device_id,
        device_name: availableDevices.find(d => d.id === action.device_id)?.name,
        command: {
          action: action.action as any,
          value: action.value ? parseFloat(action.value) : undefined
        },
        delay_sec: parseInt(action.delay_sec)
      })),
      stop_condition: formData.stop_condition.enabled ? {
        sensor_type: formData.stop_condition.sensor_type as SensorType,
        operator: formData.stop_condition.operator as any,
        value: parseFloat(formData.stop_condition.value),
        duration_sec: parseInt(formData.stop_condition.duration_sec)
      } : undefined,
      created_by: 'current-user', // TODO: Get from auth context
      deployed: false
    };

    onSave(rule);
  }, [formData, initialRule, availableDevices, onSave]);

  const selectedSensorConfig = SENSOR_TYPES[formData.trigger.sensor_type as SensorType];
  const isBetweenOperator = formData.trigger.operator === 'between';

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {initialRule ? 'Edit Automation Rule' : 'Create New Automation Rule'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Trigger Condition */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trigger Condition</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sensor Type *
              </label>
              <select
                value={formData.trigger.sensor_type}
                onChange={(e) => updateTrigger('sensor_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select sensor type</option>
                {Object.entries(SENSOR_TYPES).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label} ({config.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operator *
              </label>
              <select
                value={formData.trigger.operator}
                onChange={(e) => updateTrigger('operator', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                {OPERATORS.map(op => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value * {selectedSensorConfig && `(${selectedSensorConfig.unit})`}
              </label>
              <input
                type="number"
                value={formData.trigger.value}
                onChange={(e) => updateTrigger('value', e.target.value)}
                min={selectedSensorConfig?.min}
                max={selectedSensorConfig?.max}
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {isBetweenOperator && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Value * {selectedSensorConfig && `(${selectedSensorConfig.unit})`}
              </label>
              <input
                type="number"
                value={formData.trigger.value_max}
                onChange={(e) => updateTrigger('value_max', e.target.value)}
                min={selectedSensorConfig?.min}
                max={selectedSensorConfig?.max}
                step="0.1"
                className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required={isBetweenOperator}
              />
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (seconds) *
            </label>
            <input
              type="number"
              value={formData.trigger.duration_sec}
              onChange={(e) => updateTrigger('duration_sec', e.target.value)}
              min="1"
              className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              How long the condition must be true before triggering
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
            <button
              type="button"
              onClick={addAction}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Add Action
            </button>
          </div>

          {formData.actions.map((action, index) => (
            <div key={index} className="border border-gray-100 rounded-md p-4 mb-4 last:mb-0">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-md font-medium text-gray-700">Action {index + 1}</h4>
                {formData.actions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAction(index)}
                    className="text-red-600 hover:text-red-800 focus:outline-none"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device *
                  </label>
                  <select
                    value={action.device_id}
                    onChange={(e) => updateAction(index, 'device_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select device</option>
                    {availableDevices.map(device => (
                      <option key={device.id} value={device.id}>
                        {device.name} ({device.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action *
                  </label>
                  <select
                    value={action.action}
                    onChange={(e) => updateAction(index, 'action', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select action</option>
                    <option value="on">Turn On</option>
                    <option value="off">Turn Off</option>
                    <option value="set_speed">Set Speed (%)</option>
                    <option value="set_position">Set Position (%)</option>
                    <option value="set_flow_rate">Set Flow Rate</option>
                    <option value="pulse">Pulse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <input
                    type="number"
                    value={action.value}
                    onChange={(e) => updateAction(index, 'value', e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={['on', 'off'].includes(action.action)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delay (seconds)
                </label>
                <input
                  type="number"
                  value={action.delay_sec}
                  onChange={(e) => updateAction(index, 'delay_sec', e.target.value)}
                  min="0"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Stop Condition */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={formData.stop_condition.enabled}
              onChange={(e) => updateStopCondition('enabled', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-lg font-semibold text-gray-900">
              Stop Condition (Optional)
            </label>
          </div>

          {formData.stop_condition.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sensor Type *
                </label>
                <select
                  value={formData.stop_condition.sensor_type}
                  onChange={(e) => updateStopCondition('sensor_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required={formData.stop_condition.enabled}
                >
                  <option value="">Select sensor type</option>
                  {Object.entries(SENSOR_TYPES).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label} ({config.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operator *
                </label>
                <select
                  value={formData.stop_condition.operator}
                  onChange={(e) => updateStopCondition('operator', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required={formData.stop_condition.enabled}
                >
                  {OPERATORS.filter(op => op.value !== 'between').map(op => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value *
                </label>
                <input
                  type="number"
                  value={formData.stop_condition.value}
                  onChange={(e) => updateStopCondition('value', e.target.value)}
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required={formData.stop_condition.enabled}
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {initialRule ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RuleBuilder;