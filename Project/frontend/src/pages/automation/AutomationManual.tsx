import React, { useState, useEffect } from 'react';
import { Device, ManualCommand, ManualCommandResponse, DeviceAction } from '../../types/automation';
import ManualControl from '../../components/automation/ManualControl';

const AutomationManual: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock devices data - in real app, fetch from API
  useEffect(() => {
    const mockDevices: Device[] = [
      {
        id: 'fan-1',
        name: 'Exhaust Fan 1',
        type: 'fan',
        supportedActions: [
          { action: 'on', parameterType: undefined },
          { action: 'off', parameterType: undefined },
          { action: 'set_speed', parameterType: 'percentage', minValue: 0, maxValue: 100 }
        ],
        state: {
          value: 75,
          on: true,
          mode: 'auto',
          source: 'rule-1',
          lock: false
        },
        scope: {
          type: 'polyhouse',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          name: 'Polyhouse 1',
          path: 'Farm A > Polyhouse 1'
        },
        online: true,
        lastUpdated: '2024-01-15T14:30:00Z'
      },
      {
        id: 'fan-2',
        name: 'Circulation Fan 2',
        type: 'fan',
        supportedActions: [
          { action: 'on', parameterType: undefined },
          { action: 'off', parameterType: undefined },
          { action: 'set_speed', parameterType: 'percentage', minValue: 0, maxValue: 100 }
        ],
        state: {
          value: 50,
          on: true,
          mode: 'manual',
          source: 'user-1',
          lock: false,
          manualOverrideUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes from now
        },
        scope: {
          type: 'zone',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          zoneId: 'zone-1',
          name: 'Zone A',
          path: 'Farm A > Polyhouse 1 > Zone A'
        },
        online: true,
        lastUpdated: '2024-01-15T14:25:00Z'
      },
      {
        id: 'vent-1',
        name: 'Top Vent System',
        type: 'vent',
        supportedActions: [
          { action: 'set_position', parameterType: 'percentage', minValue: 0, maxValue: 100 }
        ],
        state: {
          value: 25,
          on: true,
          mode: 'auto',
          source: 'rule-2',
          lock: false
        },
        scope: {
          type: 'polyhouse',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          name: 'Polyhouse 1',
          path: 'Farm A > Polyhouse 1'
        },
        online: true,
        lastUpdated: '2024-01-15T14:28:00Z'
      },
      {
        id: 'pump-1',
        name: 'Main Water Pump',
        type: 'pump',
        supportedActions: [
          { action: 'on', parameterType: undefined },
          { action: 'off', parameterType: undefined },
          { action: 'set_speed', parameterType: 'percentage', minValue: 0, maxValue: 100 }
        ],
        state: {
          value: 0,
          on: false,
          mode: 'auto',
          source: 'system',
          lock: false
        },
        scope: {
          type: 'farm',
          farmId: 'farm-1',
          name: 'Farm A',
          path: 'Farm A'
        },
        online: true,
        lastUpdated: '2024-01-15T14:20:00Z'
      },
      {
        id: 'valve-1',
        name: 'Irrigation Valve 1',
        type: 'valve',
        supportedActions: [
          { action: 'on', parameterType: undefined },
          { action: 'off', parameterType: undefined },
          { action: 'set_position', parameterType: 'percentage', minValue: 0, maxValue: 100 }
        ],
        state: {
          value: 100,
          on: true,
          mode: 'safety',
          source: 'safety-system',
          lock: true
        },
        scope: {
          type: 'zone',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          zoneId: 'zone-2',
          name: 'Zone B',
          path: 'Farm A > Polyhouse 1 > Zone B'
        },
        online: true,
        lastUpdated: '2024-01-15T14:32:00Z'
      },
      {
        id: 'dosing-1',
        name: 'Nutrient Dosing Pump A',
        type: 'dosing_pump',
        supportedActions: [
          { action: 'pulse', parameterType: 'seconds', minValue: 1, maxValue: 60 },
          { action: 'set_flow_rate', parameterType: 'ml_per_sec', minValue: 0.1, maxValue: 10 }
        ],
        state: {
          value: 2.5,
          on: false,
          mode: 'auto',
          source: 'schedule-1',
          lock: false
        },
        scope: {
          type: 'polyhouse',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          name: 'Polyhouse 1',
          path: 'Farm A > Polyhouse 1'
        },
        online: true,
        lastUpdated: '2024-01-15T14:15:00Z'
      },
      {
        id: 'sensor-1',
        name: 'Temperature Sensor 1',
        type: 'sensor',
        supportedActions: [], // Sensors typically don't have actions
        state: {
          value: 26.5,
          on: true,
          mode: 'auto',
          source: 'system',
          lock: false
        },
        scope: {
          type: 'zone',
          farmId: 'farm-1',
          polyhouseId: 'polyhouse-1',
          zoneId: 'zone-1',
          name: 'Zone A',
          path: 'Farm A > Polyhouse 1 > Zone A'
        },
        online: false, // Offline device example
        lastUpdated: '2024-01-15T13:45:00Z'
      }
    ];

    // Simulate API loading delay
    setTimeout(() => {
      setDevices(mockDevices);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSendCommand = async (command: ManualCommand): Promise<ManualCommandResponse> => {
    // Simulate API call
    console.log('Sending command:', command);

    // Simulate various response scenarios
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock different responses based on device
    if (command.device_id === 'valve-1') {
      return {
        status: 'failure',
        message: 'Device is locked due to safety override'
      };
    }

    if (command.device_id === 'sensor-1') {
      return {
        status: 'failure',
        message: 'Device is offline'
      };
    }

    if (Math.random() > 0.9) {
      return {
        status: 'failure',
        message: 'Communication timeout - please try again'
      };
    }

    // Update device state optimistically
    setDevices(prev => prev.map(device => {
      if (device.id !== command.device_id) return device;

      const newState = { ...device.state };

      if (command.cmd_type === 'release') {
        newState.mode = 'auto';
        newState.source = 'system';
        newState.manualOverrideUntil = undefined;
      } else {
        newState.mode = 'manual';
        newState.source = command.owner.user_id;
        if (command.cmd_type === 'override') {
          newState.manualOverrideUntil = new Date(Date.now() + command.duration_sec * 1000).toISOString();
        }

        // Update device value/state based on action
        if (command.action.value !== undefined) {
          newState.value = command.action.value;
          newState.on = command.action.value > 0;
        } else if (command.action.mode === 'manual') {
          // For on/off commands without specific values
          const action = command.action as any;
          if (action.action === 'on') {
            newState.on = true;
            newState.value = device.type === 'fan' || device.type === 'pump' ? 100 : newState.value;
          } else if (action.action === 'off') {
            newState.on = false;
            newState.value = 0;
          }
        }
      }

      return {
        ...device,
        state: newState,
        lastUpdated: new Date().toISOString()
      };
    }));

    return {
      status: 'ack',
      message: 'Command executed successfully',
      command_id: `cmd-${Date.now()}`
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <ManualControl
      devices={devices}
      onSendCommand={handleSendCommand}
      isAdmin={false} // TODO: Get from auth context
    />
  );
};

export default AutomationManual;