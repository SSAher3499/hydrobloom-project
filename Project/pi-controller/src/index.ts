/**
 * Growloc Pi Controller
 * Main entry point for Raspberry Pi edge computing controller
 *
 * Features:
 * - Modbus RTU communication for sensors and actuators
 * - Offline-first operation with local control logic
 * - MQTT cloud sync with store-and-forward queue
 * - Threshold, PID, and scheduled control rules
 * - Emergency stop functionality
 */

import dotenv from 'dotenv';
import { Logger } from './utils/logger';
import { ModbusManager } from './modbus/modbusManager';
import { MqttClient } from './mqtt/mqttClient';
import { QueueManager } from './queue/queueManager';
import { ControlEngine } from './control/controlEngine';
import { ConfigManager } from './config/configManager';

dotenv.config();

const logger = Logger.getInstance();

class PiController {
  private modbusManager!: ModbusManager;
  private mqttClient!: MqttClient;
  private queueManager!: QueueManager;
  private controlEngine!: ControlEngine;
  private configManager!: ConfigManager;
  private isShuttingDown = false;

  async start() {
    try {
      logger.info('🚀 Growloc Pi Controller starting...');
      logger.info(`Pi ID: ${process.env.PI_ID}`);
      logger.info(`Pi Name: ${process.env.PI_NAME}`);

      // Initialize components
      this.configManager = new ConfigManager();
      await this.configManager.load();
      logger.info('✅ Configuration loaded');

      this.queueManager = new QueueManager();
      await this.queueManager.initialize();
      logger.info('✅ Queue database initialized');

      this.modbusManager = new ModbusManager();
      await this.modbusManager.initialize();
      logger.info('✅ Modbus manager initialized');

      this.mqttClient = new MqttClient(this.queueManager);
      await this.mqttClient.connect();
      logger.info('✅ MQTT client connected');

      this.controlEngine = new ControlEngine(
        this.modbusManager,
        this.mqttClient,
        this.configManager
      );
      await this.controlEngine.start();
      logger.info('✅ Control engine started');

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start sensor reading loop
      this.startSensorReadingLoop();

      // Start heartbeat
      this.startHeartbeat();

      logger.info('🌱 Growloc Pi Controller running successfully!');
    } catch (error) {
      logger.error('❌ Failed to start Pi Controller:', error);
      process.exit(1);
    }
  }

  private startSensorReadingLoop() {
    const interval = parseInt(process.env.SENSOR_READ_INTERVAL || '5000', 10);

    setInterval(async () => {
      if (this.isShuttingDown) return;

      try {
        const sensors = this.configManager.getSensors();
        const readings: any[] = [];

        for (const sensor of sensors) {
          try {
            const value = await this.modbusManager.readSensor(sensor);

            const reading = {
              sensorId: sensor.id,
              value,
              timestamp: new Date().toISOString(),
              piId: process.env.PI_ID,
            };

            readings.push(reading);

            // Store in local queue
            await this.queueManager.addSensorReading(reading);

            logger.debug(`Sensor ${sensor.name}: ${value} ${sensor.unit}`);
          } catch (error) {
            logger.error(`Failed to read sensor ${sensor.name}:`, error);
          }
        }

        // Try to publish to cloud (will queue if offline)
        if (readings.length > 0) {
          await this.mqttClient.publishSensorData(readings);
        }

        // Trigger control logic
        await this.controlEngine.evaluate(readings);
      } catch (error) {
        logger.error('Error in sensor reading loop:', error);
      }
    }, interval);

    logger.info(`Sensor reading loop started (${interval}ms interval)`);
  }

  private startHeartbeat() {
    const interval = parseInt(process.env.HEARTBEAT_INTERVAL || '30000', 10);

    setInterval(async () => {
      if (this.isShuttingDown) return;

      try {
        await this.mqttClient.publishHeartbeat({
          piId: process.env.PI_ID!,
          name: process.env.PI_NAME!,
          status: 'ONLINE',
          timestamp: new Date().toISOString(),
          farmId: process.env.FARM_ID,
          polyhouseId: process.env.POLYHOUSE_ID,
        });
      } catch (error) {
        logger.warn('Failed to send heartbeat:', error);
      }
    }, interval);

    logger.info(`Heartbeat started (${interval}ms interval)`);
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      logger.info(`Received ${signal}, shutting down gracefully...`);

      try {
        // Stop control engine
        await this.controlEngine.stop();
        logger.info('Control engine stopped');

        // Turn off all actuators (safety)
        const actuators = this.configManager.getActuators();
        for (const actuator of actuators) {
          try {
            await this.modbusManager.writeActuator(actuator, 0);
            logger.info(`Actuator ${actuator.name} turned off`);
          } catch (error) {
            logger.error(`Failed to turn off actuator ${actuator.name}:`, error);
          }
        }

        // Send offline status
        await this.mqttClient.publishHeartbeat({
          piId: process.env.PI_ID!,
          name: process.env.PI_NAME!,
          status: 'OFFLINE',
          timestamp: new Date().toISOString(),
        });

        // Disconnect MQTT
        await this.mqttClient.disconnect();
        logger.info('MQTT client disconnected');

        // Close Modbus
        await this.modbusManager.close();
        logger.info('Modbus manager closed');

        // Close queue database
        await this.queueManager.close();
        logger.info('Queue database closed');

        logger.info('Shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
      shutdown('unhandledRejection');
    });
  }
}

// Start the controller
const controller = new PiController();
controller.start();
