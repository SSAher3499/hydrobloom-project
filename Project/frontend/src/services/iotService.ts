/**
 * IoT API Service
 * Handles all API calls for Raspberry Pi, Sensors, Actuators, and Control Rules
 */

import axios from 'axios';
import type {
  RaspberryPi,
  Sensor,
  ModbusActuator,
  ControlRule,
  SensorReading,
  CreatePiForm,
  CreateSensorForm,
  CreateActuatorForm,
  CreateRuleForm,
  PiListResponse,
  PiDetailResponse,
  SensorResponse,
  ActuatorResponse,
  RuleResponse,
  RulesListResponse,
  SensorReadingsResponse,
} from '../types/iot';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ============================================================================
// Raspberry Pi Management
// ============================================================================

export const iotService = {
  // Get all Raspberry Pis
  async getPis(farmId?: string): Promise<RaspberryPi[]> {
    const params = farmId ? { farmId } : {};
    const response = await axios.get<PiListResponse>(`${API_URL}/iot/pis`, { params });
    return response.data.pis;
  },

  // Get Pi details
  async getPi(id: string): Promise<RaspberryPi> {
    const response = await axios.get<PiDetailResponse>(`${API_URL}/iot/pis/${id}`);
    return response.data.pi;
  },

  // Register new Pi
  async createPi(data: CreatePiForm): Promise<RaspberryPi> {
    const response = await axios.post<PiDetailResponse>(`${API_URL}/iot/pis`, data);
    return response.data.pi;
  },

  // Update Pi
  async updatePi(id: string, data: Partial<CreatePiForm>): Promise<RaspberryPi> {
    const response = await axios.put<PiDetailResponse>(`${API_URL}/iot/pis/${id}`, data);
    return response.data.pi;
  },

  // Delete Pi
  async deletePi(id: string): Promise<void> {
    await axios.delete(`${API_URL}/iot/pis/${id}`);
  },

  // ============================================================================
  // Sensor Management
  // ============================================================================

  // Add sensor to Pi
  async createSensor(piId: string, data: CreateSensorForm): Promise<Sensor> {
    const response = await axios.post<SensorResponse>(
      `${API_URL}/iot/pis/${piId}/sensors`,
      data
    );
    return response.data.sensor;
  },

  // Update sensor
  async updateSensor(id: string, data: Partial<CreateSensorForm>): Promise<Sensor> {
    const response = await axios.put<SensorResponse>(`${API_URL}/iot/sensors/${id}`, data);
    return response.data.sensor;
  },

  // Delete sensor
  async deleteSensor(id: string): Promise<void> {
    await axios.delete(`${API_URL}/iot/sensors/${id}`);
  },

  // Get sensor readings (historical data)
  async getSensorReadings(
    sensorId: string,
    startDate?: string,
    endDate?: string,
    limit?: number
  ): Promise<SensorReading[]> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (limit) params.limit = limit;

    const response = await axios.get<SensorReadingsResponse>(
      `${API_URL}/iot/sensors/${sensorId}/readings`,
      { params }
    );
    return response.data.readings;
  },

  // ============================================================================
  // Actuator Management
  // ============================================================================

  // Add actuator to Pi
  async createActuator(piId: string, data: CreateActuatorForm): Promise<ModbusActuator> {
    const response = await axios.post<ActuatorResponse>(
      `${API_URL}/iot/pis/${piId}/actuators`,
      data
    );
    return response.data.actuator;
  },

  // Update actuator
  async updateActuator(
    id: string,
    data: Partial<CreateActuatorForm>
  ): Promise<ModbusActuator> {
    const response = await axios.put<ActuatorResponse>(
      `${API_URL}/iot/actuators/${id}`,
      data
    );
    return response.data.actuator;
  },

  // Delete actuator
  async deleteActuator(id: string): Promise<void> {
    await axios.delete(`${API_URL}/iot/actuators/${id}`);
  },

  // Send manual control command to actuator
  async controlActuator(id: string, state: number): Promise<void> {
    await axios.post(`${API_URL}/iot/actuators/${id}/command`, { state });
  },

  // ============================================================================
  // Control Rules Management
  // ============================================================================

  // Get all rules for a Pi
  async getRules(piId: string): Promise<ControlRule[]> {
    const response = await axios.get<RulesListResponse>(`${API_URL}/iot/pis/${piId}/rules`);
    return response.data.rules;
  },

  // Create control rule
  async createRule(piId: string, data: CreateRuleForm): Promise<ControlRule> {
    const response = await axios.post<RuleResponse>(
      `${API_URL}/iot/pis/${piId}/rules`,
      data
    );
    return response.data.rule;
  },

  // Update rule
  async updateRule(id: string, data: Partial<CreateRuleForm>): Promise<ControlRule> {
    const response = await axios.put<RuleResponse>(`${API_URL}/iot/rules/${id}`, data);
    return response.data.rule;
  },

  // Delete rule
  async deleteRule(id: string): Promise<void> {
    await axios.delete(`${API_URL}/iot/rules/${id}`);
  },

  // ============================================================================
  // Emergency Control
  // ============================================================================

  // Trigger emergency stop
  async emergencyStop(piId: string): Promise<void> {
    await axios.post(`${API_URL}/iot/pis/${piId}/emergency-stop`);
  },
};

export default iotService;
