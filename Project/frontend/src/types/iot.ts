/**
 * IoT TypeScript Types
 * Matches backend Prisma schema
 */

export type PiStatus = 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';

export type ActuatorType =
  | 'FAN'
  | 'PUMP'
  | 'FOGGER'
  | 'MOTOR'
  | 'VALVE'
  | 'HEATER'
  | 'COOLER'
  | 'LIGHT'
  | 'VENT';

export type ControlRuleType = 'THRESHOLD' | 'PID' | 'SCHEDULED' | 'EMERGENCY_STOP';

export interface RaspberryPi {
  id: string;
  name: string;
  macAddress: string;
  ipAddress?: string;
  farmId?: string;
  polyhouseId?: string;
  status: PiStatus;
  lastSeen?: Date | string;
  firmwareVersion?: string;
  serialPort: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  farm?: {
    id: string;
    name: string;
  };
  polyhouse?: {
    id: string;
    name: string;
  };
  sensors?: Sensor[];
  actuators?: ModbusActuator[];
  rules?: ControlRule[];
  _count?: {
    sensors: number;
    actuators: number;
    rules: number;
  };
}

export interface Sensor {
  id: string;
  zoneId: string;
  type: string;
  name?: string;
  latestValue?: number;
  unit?: string;
  lastSeen?: Date | string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Modbus fields
  raspberryPiId?: string;
  modbusSlaveId?: number;
  modbusRegisterAddr?: number;
  modbusRegisterType?: string;
  modbusFunctionCode?: number;
  baudRate?: number;
  scalingFactor?: number;
  scalingOffset?: number;
  zone?: {
    id: string;
    name: string;
  };
  raspberryPi?: RaspberryPi;
}

export interface ModbusActuator {
  id: string;
  name: string;
  raspberryPiId: string;
  zoneId?: string;
  polyhouseId?: string;
  type: ActuatorType;
  modbusSlaveId: number;
  modbusRegisterAddr: number;
  modbusRegisterType: string;
  modbusFunctionCode: number;
  currentState: number;
  isActive: boolean;
  lastToggled?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  raspberryPi?: RaspberryPi;
  zone?: {
    id: string;
    name: string;
  };
  polyhouse?: {
    id: string;
    name: string;
  };
}

export interface ControlRule {
  id: string;
  name: string;
  raspberryPiId: string;
  ruleType: ControlRuleType;
  isActive: boolean;
  priority: number;
  conditions: any; // JSON
  actions: any; // JSON
  schedule?: string;
  pidConfig?: {
    kp: number;
    ki: number;
    kd: number;
    setpoint: number;
    outputMin: number;
    outputMax: number;
  };
  lastTriggered?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  raspberryPi?: RaspberryPi;
  actuator?: ModbusActuator;
  actuatorId?: string;
}

export interface SensorReading {
  id: string;
  sensorId: string;
  value: number;
  timestamp: Date | string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PiListResponse {
  pis: RaspberryPi[];
}

export interface PiDetailResponse {
  pi: RaspberryPi;
}

export interface SensorResponse {
  sensor: Sensor;
}

export interface ActuatorResponse {
  actuator: ModbusActuator;
}

export interface RuleResponse {
  rule: ControlRule;
}

export interface RulesListResponse {
  rules: ControlRule[];
}

export interface SensorReadingsResponse {
  readings: SensorReading[];
}

// Socket.io Event Types
export interface SensorUpdateEvent {
  sensorId: string;
  value: number;
  timestamp: string;
  type: string;
  unit?: string;
  zoneId: string;
}

export interface ActuatorUpdateEvent {
  actuatorId: string;
  name: string;
  type: ActuatorType;
  state: number;
  timestamp: string;
}

export interface PiStatusUpdateEvent {
  piId: string;
  name: string;
  status: PiStatus;
  timestamp: string;
}

export interface InitialIoTData {
  sensors: Sensor[];
  actuators: ModbusActuator[];
  pis: RaspberryPi[];
  timestamp: string;
}

// Form Types
export interface CreatePiForm {
  name: string;
  macAddress: string;
  ipAddress?: string;
  farmId?: string;
  polyhouseId?: string;
  serialPort?: string;
  firmwareVersion?: string;
}

export interface CreateSensorForm {
  name: string;
  type: string;
  zoneId: string;
  unit?: string;
  modbusSlaveId: number;
  modbusRegisterAddr: number;
  modbusRegisterType: string;
  modbusFunctionCode: number;
  baudRate?: number;
  scalingFactor?: number;
  scalingOffset?: number;
}

export interface CreateActuatorForm {
  name: string;
  type: ActuatorType;
  zoneId?: string;
  polyhouseId?: string;
  modbusSlaveId: number;
  modbusRegisterAddr: number;
  modbusRegisterType?: string;
  modbusFunctionCode?: number;
}

export interface CreateRuleForm {
  name: string;
  ruleType: ControlRuleType;
  isActive?: boolean;
  priority?: number;
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
  actuatorId?: string;
}
