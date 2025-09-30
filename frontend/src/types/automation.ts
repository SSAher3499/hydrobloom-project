// Automation Data Models and Types

export interface Device {
  id: string;
  name: string;
  type: 'fan' | 'vent' | 'pump' | 'valve' | 'dosing_pump' | 'sensor';
  supportedActions: DeviceAction[];
  state: DeviceState;
  scope: Scope;
  online: boolean;
  lastUpdated: string;
}

export interface DeviceState {
  value?: number; // Current value (0-100 for percentage, specific value for others)
  on: boolean;
  mode: 'auto' | 'manual' | 'safety' | 'offline';
  source?: string; // User ID or rule ID that last controlled this device
  lock: boolean; // If device is locked due to safety override
  manualOverrideUntil?: string; // ISO timestamp when manual override expires
}

export interface DeviceAction {
  action: 'on' | 'off' | 'set_speed' | 'set_position' | 'pulse' | 'set_flow_rate';
  parameterType?: 'percentage' | 'ml_per_sec' | 'seconds';
  minValue?: number;
  maxValue?: number;
}

export interface Scope {
  type: 'farm' | 'polyhouse' | 'zone' | 'device_group';
  farmId: string;
  polyhouseId?: string;
  zoneId?: string;
  deviceGroupId?: string;
  name: string;
  path: string; // e.g., "Farm A > Polyhouse 1 > Zone B"
}

// Manual Control Types
export interface ManualCommand {
  cmd_type: 'override' | 'pulse' | 'release';
  device_id: string;
  action: {
    mode: 'manual' | 'auto';
    value?: number;
    duration_sec?: number;
  };
  owner: {
    user_id: string;
    name: string;
  };
  reason?: string;
  duration_sec: number; // How long the manual override should last
  timestamp: string;
}

export interface ManualCommandResponse {
  status: 'ack' | 'failure' | 'pending';
  message?: string;
  command_id?: string;
}

// Rule Builder Types
export interface AutomationRule {
  id?: string;
  name: string;
  description?: string;
  scope: Scope;
  priority: number; // 1-10, higher priority wins
  mode: 'auto' | 'disabled';
  trigger: RuleTrigger;
  actions: RuleAction[];
  stop_condition?: RuleCondition;
  created_by: string;
  created_at?: string;
  last_modified?: string;
  deployed: boolean;
}

export interface RuleTrigger {
  sensor_type: SensorType;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';
  value: number;
  value_max?: number; // For 'between' operator
  duration_sec: number; // How long condition must be true before triggering
  scope: Scope;
}

export interface RuleAction {
  device_id: string;
  device_name?: string;
  command: DeviceCommand;
  delay_sec?: number; // Optional delay before executing this action
}

export interface DeviceCommand {
  action: 'on' | 'off' | 'set_speed' | 'set_position' | 'set_flow_rate';
  value?: number;
}

export interface RuleCondition {
  sensor_type: SensorType;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
  value: number;
  duration_sec: number;
}

export type SensorType =
  | 'temperature'
  | 'humidity'
  | 'soil_moisture'
  | 'ph'
  | 'ec'
  | 'reservoir_level'
  | 'light_intensity'
  | 'co2_level';

// Simulation Types
export interface RuleSimulation {
  rule: AutomationRule;
  sensor_data: SensorReading[];
  time_range: {
    start: string;
    end: string;
  };
}

export interface SensorReading {
  sensor_type: SensorType;
  value: number;
  timestamp: string;
  scope: Scope;
}

export interface SimulationResult {
  triggers_count: number;
  actions_executed: Array<{
    timestamp: string;
    device_id: string;
    action: DeviceCommand;
    reason: string;
  }>;
  warnings: string[];
  estimated_runtime_hours: number;
}

// Logging and Audit Types
export interface AutomationLog {
  id: string;
  timestamp: string;
  type: 'manual_command' | 'rule_trigger' | 'rule_deploy' | 'safety_override' | 'device_offline';
  user_id?: string;
  user_name?: string;
  device_id?: string;
  device_name?: string;
  rule_id?: string;
  rule_name?: string;
  action: string;
  details: Record<string, any>;
  result: 'success' | 'failure' | 'pending';
  error_message?: string;
  scope: Scope;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DevicesResponse {
  devices: Device[];
  total: number;
  scope: Scope;
}

export interface RulesResponse {
  rules: AutomationRule[];
  total: number;
}

export interface LogsResponse {
  logs: AutomationLog[];
  total: number;
  page: number;
  per_page: number;
}

// UI State Types
export interface AutomationState {
  selectedScope: Scope | null;
  devices: Device[];
  rules: AutomationRule[];
  logs: AutomationLog[];
  loading: boolean;
  error: string | null;
}

// Form Types for UI Components
export interface RuleFormData {
  name: string;
  description: string;
  scope: Scope | null;
  priority: number;
  mode: 'auto' | 'disabled';
  trigger: {
    sensor_type: SensorType | '';
    operator: string;
    value: string;
    value_max: string;
    duration_sec: string;
  };
  actions: Array<{
    device_id: string;
    action: string;
    value: string;
    delay_sec: string;
  }>;
  stop_condition: {
    enabled: boolean;
    sensor_type: SensorType | '';
    operator: string;
    value: string;
    duration_sec: string;
  };
}

// Constants
export const SENSOR_TYPES: Record<SensorType, { label: string; unit: string; min: number; max: number }> = {
  temperature: { label: 'Temperature', unit: '°C', min: -10, max: 50 },
  humidity: { label: 'Humidity', unit: '%', min: 0, max: 100 },
  soil_moisture: { label: 'Soil Moisture', unit: '%', min: 0, max: 100 },
  ph: { label: 'pH Level', unit: 'pH', min: 0, max: 14 },
  ec: { label: 'Electrical Conductivity', unit: 'mS/cm', min: 0, max: 10 },
  reservoir_level: { label: 'Reservoir Level', unit: '%', min: 0, max: 100 },
  light_intensity: { label: 'Light Intensity', unit: 'lux', min: 0, max: 100000 },
  co2_level: { label: 'CO2 Level', unit: 'ppm', min: 0, max: 2000 },
};

export const OPERATORS = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
  { value: 'between', label: 'Between' },
];

export const DEVICE_TYPES = [
  { value: 'fan', label: 'Fan', actions: ['on', 'off', 'set_speed'] },
  { value: 'vent', label: 'Vent', actions: ['set_position'] },
  { value: 'pump', label: 'Pump', actions: ['on', 'off', 'set_speed'] },
  { value: 'valve', label: 'Valve', actions: ['on', 'off', 'set_position'] },
  { value: 'dosing_pump', label: 'Dosing Pump', actions: ['pulse', 'set_flow_rate'] },
];

export const DEFAULT_MANUAL_TIMEOUT = 30 * 60; // 30 minutes in seconds
export const MAX_MANUAL_TIMEOUT = 60 * 60; // 60 minutes in seconds
export const ADMIN_MAX_TIMEOUT = Number.POSITIVE_INFINITY; // No limit for admins