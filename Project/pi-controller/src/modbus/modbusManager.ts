import ModbusRTU from 'jsmodbus';
import { SerialPort } from 'serialport';
import { Logger } from '../utils/logger';

const logger = Logger.getInstance();

export interface ModbusDevice {
  id: string;
  name: string;
  slaveId: number;
  registerAddr: number;
  registerType: 'holding' | 'input' | 'coil' | 'discrete';
  functionCode: number;
  scalingFactor?: number;
  scalingOffset?: number;
  unit?: string;
}

export class ModbusManager {
  private serialPort?: SerialPort;
  private client?: any;
  private isInitialized = false;
  private readonly EMERGENCY_STOP_REGISTER = parseInt(
    process.env.EMERGENCY_STOP_REGISTER || '100',
    10
  );

  async initialize() {
    try {
      const port = process.env.SERIAL_PORT || '/dev/ttyUSB0';
      const baudRate = parseInt(process.env.BAUD_RATE || '9600', 10);

      logger.info(`Initializing Modbus on ${port} at ${baudRate} baud`);

      this.serialPort = new SerialPort({
        path: port,
        baudRate,
        dataBits: parseInt(process.env.DATA_BITS || '8', 10) as 8 | 7 | 6 | 5,
        stopBits: parseInt(process.env.STOP_BITS || '1', 10) as 1 | 2,
        parity: (process.env.PARITY || 'none') as 'none' | 'even' | 'odd',
      });

      this.client = new ModbusRTU.client.RTU(this.serialPort, 1);

      this.isInitialized = true;
      logger.info('Modbus initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Modbus:', error);
      throw error;
    }
  }

  async readSensor(sensor: ModbusDevice): Promise<number> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Modbus not initialized');
    }

    try {
      let rawValue: number;

      switch (sensor.registerType) {
        case 'holding':
          const holdingResult = await this.client.readHoldingRegisters(
            sensor.slaveId,
            sensor.registerAddr,
            1
          );
          rawValue = holdingResult.response.body.valuesAsArray[0];
          break;

        case 'input':
          const inputResult = await this.client.readInputRegisters(
            sensor.slaveId,
            sensor.registerAddr,
            1
          );
          rawValue = inputResult.response.body.valuesAsArray[0];
          break;

        case 'coil':
          const coilResult = await this.client.readCoils(
            sensor.slaveId,
            sensor.registerAddr,
            1
          );
          rawValue = coilResult.response.body.valuesAsArray[0] ? 1 : 0;
          break;

        case 'discrete':
          const discreteResult = await this.client.readDiscreteInputs(
            sensor.slaveId,
            sensor.registerAddr,
            1
          );
          rawValue = discreteResult.response.body.valuesAsArray[0] ? 1 : 0;
          break;

        default:
          throw new Error(`Unknown register type: ${sensor.registerType}`);
      }

      // Apply scaling
      let scaledValue = rawValue;
      if (sensor.scalingFactor) {
        scaledValue *= sensor.scalingFactor;
      }
      if (sensor.scalingOffset) {
        scaledValue += sensor.scalingOffset;
      }

      return Math.round(scaledValue * 100) / 100; // Round to 2 decimals
    } catch (error) {
      logger.error(`Failed to read sensor ${sensor.name}:`, error);
      throw error;
    }
  }

  async writeActuator(actuator: ModbusDevice, value: number): Promise<void> {
    if (!this.isInitialized || !this.client) {
      throw new Error('Modbus not initialized');
    }

    try {
      logger.info(`Writing ${value} to actuator ${actuator.name} (register ${actuator.registerAddr})`);

      if (actuator.registerType === 'coil') {
        await this.client.writeSingleCoil(
          actuator.slaveId,
          actuator.registerAddr,
          value > 0
        );
      } else if (actuator.registerType === 'holding') {
        await this.client.writeSingleRegister(
          actuator.slaveId,
          actuator.registerAddr,
          value
        );
      } else {
        throw new Error(`Cannot write to register type: ${actuator.registerType}`);
      }

      logger.info(`Successfully wrote to actuator ${actuator.name}`);
    } catch (error) {
      logger.error(`Failed to write actuator ${actuator.name}:`, error);
      throw error;
    }
  }

  async triggerEmergencyStop(): Promise<void> {
    try {
      logger.warn('⚠️  EMERGENCY STOP TRIGGERED!');

      // Write to emergency stop coil (assumes slave ID 1)
      await this.client.writeSingleCoil(1, this.EMERGENCY_STOP_REGISTER, true);

      logger.info('Emergency stop executed successfully');
    } catch (error) {
      logger.error('Failed to execute emergency stop:', error);
      throw error;
    }
  }

  async releaseEmergencyStop(): Promise<void> {
    try {
      logger.info('Releasing emergency stop...');

      await this.client.writeSingleCoil(1, this.EMERGENCY_STOP_REGISTER, false);

      logger.info('Emergency stop released');
    } catch (error) {
      logger.error('Failed to release emergency stop:', error);
      throw error;
    }
  }

  async close() {
    if (this.serialPort && this.serialPort.isOpen) {
      await new Promise<void>((resolve) => {
        this.serialPort!.close((error) => {
          if (error) {
            logger.error('Error closing serial port:', error);
          }
          resolve();
        });
      });
    }
    this.isInitialized = false;
  }
}
