import { Logger } from '../utils/logger';
import { ModbusDevice } from '../modbus/modbusManager';
import fs from 'fs/promises';
import path from 'path';

const logger = Logger.getInstance();

export interface ControlRule {
  id: string;
  name: string;
  type: 'THRESHOLD' | 'PID' | 'SCHEDULED' | 'EMERGENCY_STOP';
  isActive: boolean;
  priority: number;
  conditions: any;
  actions: any;
  schedule?: string;
  pidConfig?: {
    kp: number;
    ki: number;
    kd: number;
    setpoint: number;
    outputMin: number;
    outputMax: number;
  };
}

export class ConfigManager {
  private sensors: ModbusDevice[] = [];
  private actuators: ModbusDevice[] = [];
  private controlRules: ControlRule[] = [];

  async load() {
    try {
      // Load devices configuration
      const devicesPath = path.join(__dirname, '../../config/devices.json');
      const devicesData = await fs.readFile(devicesPath, 'utf-8');
      const devices = JSON.parse(devicesData);

      this.sensors = devices.sensors || [];
      this.actuators = devices.actuators || [];

      logger.info(`Loaded ${this.sensors.length} sensors, ${this.actuators.length} actuators`);

      // Load control rules
      const rulesPath = path.join(__dirname, '../../config/control-rules.json');
      const rulesData = await fs.readFile(rulesPath, 'utf-8');
      const rules = JSON.parse(rulesData);

      this.controlRules = rules.rules || [];

      logger.info(`Loaded ${this.controlRules.length} control rules`);
    } catch (error) {
      logger.error('Failed to load configuration:', error);
      // Use empty config if files don't exist
      logger.warn('Using empty configuration');
    }
  }

  getSensors(): ModbusDevice[] {
    return this.sensors;
  }

  getActuators(): ModbusDevice[] {
    return this.actuators;
  }

  getControlRules(): ControlRule[] {
    return this.controlRules.filter((rule) => rule.isActive);
  }

  getSensorById(id: string): ModbusDevice | undefined {
    return this.sensors.find((s) => s.id === id);
  }

  getActuatorById(id: string): ModbusDevice | undefined {
    return this.actuators.find((a) => a.id === id);
  }
}
