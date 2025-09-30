import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Switch } from '@headlessui/react';
import clsx from 'clsx';

interface AlertCondition {
  id: string;
  sensor: string;
  operator: string;
  value: number;
  unit: string;
}

interface AlertConfig {
  id: string;
  name: string;
  repeatsIn: number;
  repeatUnit: string;
  isActive: boolean;
  channels: ('EMAIL' | 'WHATSAPP' | 'SMS')[];
  conditions: AlertCondition[];
  subscribers: string[];
  lastTriggered?: string;
  createdAt: string;
}

const Alerts: React.FC = () => {
  const { t } = useTranslation();

  const [alerts, setAlerts] = useState<AlertConfig[]>([
    {
      id: '1',
      name: 'High pH Alert - Zone A',
      repeatsIn: 30,
      repeatUnit: 'minutes',
      isActive: true,
      channels: ['EMAIL', 'WHATSAPP'],
      conditions: [
        {
          id: '1',
          sensor: 'pH',
          operator: '>',
          value: 7.5,
          unit: '',
        },
      ],
      subscribers: ['shubham@EcoFarmLogix.com', 'priya@EcoFarmLogix.com'],
      lastTriggered: '2025-09-23T10:30:00Z',
      createdAt: '2025-09-20',
    },
    {
      id: '2',
      name: 'Low Water Level - Reservoir 1',
      repeatsIn: 1,
      repeatUnit: 'hours',
      isActive: true,
      channels: ['EMAIL', 'SMS'],
      conditions: [
        {
          id: '2',
          sensor: 'Water Level',
          operator: '<',
          value: 20,
          unit: '%',
        },
      ],
      subscribers: ['raj@EcoFarmLogix.com'],
      createdAt: '2025-09-21',
    },
    {
      id: '3',
      name: 'Temperature Alert - Polyhouse 2',
      repeatsIn: 15,
      repeatUnit: 'minutes',
      isActive: false,
      channels: ['WHATSAPP'],
      conditions: [
        {
          id: '3',
          sensor: 'Temperature',
          operator: '>',
          value: 35,
          unit: '°C',
        },
      ],
      subscribers: ['anita@EcoFarmLogix.com', 'shubham@EcoFarmLogix.com'],
      createdAt: '2025-09-22',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    repeatsIn: 30,
    repeatUnit: 'minutes',
    channels: [] as string[],
    subscribers: '',
    conditions: [{
      sensor: 'pH',
      operator: '>',
      value: 7.0,
      unit: '',
    }],
  });

  const sensorOptions = [
    { value: 'pH', label: 'pH Level', unit: '' },
    { value: 'EC', label: 'EC Level', unit: 'mS/cm' },
    { value: 'Temperature', label: 'Temperature', unit: '°C' },
    { value: 'Humidity', label: 'Humidity', unit: '%' },
    { value: 'Water Level', label: 'Water Level', unit: '%' },
  ];

  const operatorOptions = [
    { value: '>', label: 'Greater than (>)' },
    { value: '<', label: 'Less than (<)' },
    { value: '=', label: 'Equal to (=)' },
    { value: '>=', label: 'Greater than or equal (>=)' },
    { value: '<=', label: 'Less than or equal (<=)' },
  ];

  const repeatUnitOptions = [
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Hours' },
    { value: 'days', label: 'Days' },
  ];

  const getChannelBadgeColor = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WHATSAPP':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SMS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenModal = (alert?: AlertConfig) => {
    if (alert) {
      setEditingAlert(alert);
      setFormData({
        name: alert.name,
        repeatsIn: alert.repeatsIn,
        repeatUnit: alert.repeatUnit,
        channels: alert.channels,
        subscribers: alert.subscribers.join(', '),
        conditions: alert.conditions.map(({ id, ...condition }) => condition),
      });
    } else {
      setEditingAlert(null);
      setFormData({
        name: '',
        repeatsIn: 30,
        repeatUnit: 'minutes',
        channels: [],
        subscribers: '',
        conditions: [{
          sensor: 'pH',
          operator: '>',
          value: 7.0,
          unit: '',
        }],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAlert(null);
  };

  const handleChannelChange = (channel: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        channels: [...formData.channels, channel],
      });
    } else {
      setFormData({
        ...formData,
        channels: formData.channels.filter(c => c !== channel),
      });
    }
  };

  const handleConditionChange = (index: number, field: string, value: any) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };

    // Auto-set unit when sensor changes
    if (field === 'sensor') {
      const sensor = sensorOptions.find(s => s.value === value);
      newConditions[index].unit = sensor?.unit || '';
    }

    setFormData({ ...formData, conditions: newConditions });
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        { sensor: 'pH', operator: '>', value: 7.0, unit: '' },
      ],
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newAlert: AlertConfig = {
      id: editingAlert?.id || Date.now().toString(),
      name: formData.name,
      repeatsIn: formData.repeatsIn,
      repeatUnit: formData.repeatUnit,
      isActive: true,
      channels: formData.channels as ('EMAIL' | 'WHATSAPP' | 'SMS')[],
      conditions: formData.conditions.map((condition, index) => ({
        id: `${Date.now()}-${index}`,
        ...condition,
      })),
      subscribers: formData.subscribers.split(',').map(s => s.trim()).filter(Boolean),
      createdAt: editingAlert?.createdAt || new Date().toISOString().split('T')[0],
      lastTriggered: editingAlert?.lastTriggered,
    };

    if (editingAlert) {
      setAlerts(alerts.map(alert => alert.id === editingAlert.id ? newAlert : alert));
    } else {
      setAlerts([...alerts, newAlert]);
    }

    handleCloseModal();
  };

  const toggleAlert = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, isActive: !alert.isActive }
        : alert
    ));
  };

  const deleteAlert = (alertId: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('alerts.title')}</h1>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {t('alerts.add_alert')}
        </button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className={clsx(
                  'w-3 h-3 rounded-full',
                  alert.isActive ? 'bg-green-500' : 'bg-gray-300'
                )} />
                <h3 className="text-lg font-medium text-gray-900">{alert.name}</h3>
                <span className="text-sm text-gray-500">
                  Repeats every {alert.repeatsIn} {alert.repeatUnit}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={alert.isActive}
                  onChange={() => toggleAlert(alert.id)}
                  className={clsx(
                    alert.isActive ? 'bg-primary-600' : 'bg-gray-200',
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      alert.isActive ? 'translate-x-5' : 'translate-x-0',
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                    )}
                  />
                </Switch>
                <button
                  onClick={() => handleOpenModal(alert)}
                  className="text-primary-600 hover:text-primary-900"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Conditions */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {t('alerts.conditions')}
                </h4>
                <div className="space-y-1">
                  {alert.conditions.map((condition, index) => (
                    <div key={condition.id} className="text-sm text-gray-600">
                      {condition.sensor} {condition.operator} {condition.value} {condition.unit}
                    </div>
                  ))}
                </div>
              </div>

              {/* Channels */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {t('alerts.channels')}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {alert.channels.map((channel) => (
                    <span
                      key={channel}
                      className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
                        getChannelBadgeColor(channel)
                      )}
                    >
                      {t(`alerts.${channel.toLowerCase()}`)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Last Triggered */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Last Triggered
                </h4>
                <div className="text-sm text-gray-600">
                  {alert.lastTriggered ? formatDate(alert.lastTriggered) : 'Never'}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                {t('alerts.subscribers')} ({alert.subscribers.length})
              </h4>
              <div className="text-sm text-gray-600">
                {alert.subscribers.join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Alert Modal */}
      <Transition appear show={isModalOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleCloseModal}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    {editingAlert ? 'Edit Alert' : t('alerts.add_alert')}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Alert Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('alerts.name')}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g., High pH Alert - Zone A"
                      />
                    </div>

                    {/* Repeat Settings */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('alerts.repeats_in')}
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.repeatsIn}
                          onChange={(e) => setFormData({ ...formData, repeatsIn: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unit
                        </label>
                        <select
                          value={formData.repeatUnit}
                          onChange={(e) => setFormData({ ...formData, repeatUnit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          {repeatUnitOptions.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Notification Channels */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('alerts.channels')}
                      </label>
                      <div className="space-y-2">
                        {['EMAIL', 'WHATSAPP', 'SMS'].map((channel) => (
                          <label key={channel} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.channels.includes(channel)}
                              onChange={(e) => handleChannelChange(channel, e.target.checked)}
                              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {t(`alerts.${channel.toLowerCase()}`)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Conditions */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('alerts.conditions')}
                        </label>
                        <button
                          type="button"
                          onClick={addCondition}
                          className="text-sm text-primary-600 hover:text-primary-800"
                        >
                          + Add Condition
                        </button>
                      </div>
                      <div className="space-y-3">
                        {formData.conditions.map((condition, index) => (
                          <div key={index} className="grid grid-cols-4 gap-2 p-3 border border-gray-200 rounded-md">
                            <select
                              value={condition.sensor}
                              onChange={(e) => handleConditionChange(index, 'sensor', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              {sensorOptions.map((sensor) => (
                                <option key={sensor.value} value={sensor.value}>
                                  {sensor.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={condition.operator}
                              onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              {operatorOptions.map((op) => (
                                <option key={op.value} value={op.value}>
                                  {op.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              step="0.1"
                              value={condition.value}
                              onChange={(e) => handleConditionChange(index, 'value', Number(e.target.value))}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">{condition.unit}</span>
                              {formData.conditions.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeCondition(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subscribers */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('alerts.subscribers')}
                      </label>
                      <textarea
                        required
                        value={formData.subscribers}
                        onChange={(e) => setFormData({ ...formData, subscribers: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={3}
                        placeholder="Enter email addresses separated by commas"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter email addresses separated by commas
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {editingAlert ? t('common.save') : t('common.add')}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Alerts;