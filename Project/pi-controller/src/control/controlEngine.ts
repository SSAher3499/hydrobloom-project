import { ModbusManager } from '../modbus/modbusManager';
import { MqttClient } from '../mqtt/mqttClient';
import { ConfigManager, ControlRule } from '../config/configManager';
import { Logger } from '../utils/logger';
import { PIDController } from './pidController';
import cron from 'node-cron';

const logger = Logger.getInstance();

export class ControlEngine {
  private modbusManager: ModbusManager;
  private mqttClient: MqttClient;
  private configManager: ConfigManager;
  private pidControllers: Map<string, PIDController> = new Map();
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  constructor(
    modbusManager: ModbusManager,
    mqttClient: MqttClient,
    configManager: ConfigManager
  ) {
    this.modbusManager = modbusManager;
    this.mqttClient = mqttClient;
    this.configManager = configManager;
  }

  async start() {
    logger.info('Starting control engine...');

    // Initialize PID controllers
    this.initializePIDControllers();

    // Initialize scheduled tasks
    this.initializeScheduledTasks();

    // Listen for commands
    this.setupCommandListeners();

    this.isRunning = true;
    logger.info('Control engine started');
  }

  async stop() {
    this.isRunning = false;

    // Stop all scheduled tasks
    this.scheduledTasks.forEach((task) => task.stop());
    this.scheduledTasks.clear();

    logger.info('Control engine stopped');
  }

  private initializePIDControllers() {
    const rules = this.configManager.getControlRules();

    rules
      .filter((rule) => rule.type === 'PID')
      .forEach((rule) => {
        if (rule.pidConfig) {
          const pid = new PIDController(
            rule.pidConfig.kp,
            rule.pidConfig.ki,
            rule.pidConfig.kd,
            rule.pidConfig.setpoint,
            rule.pidConfig.outputMin,
            rule.pidConfig.outputMax
          );

          this.pidControllers.set(rule.id, pid);
          logger.info(`Initialized PID controller for rule: ${rule.name}`);
        }
      });
  }

  private initializeScheduledTasks() {
    const rules = this.configManager.getControlRules();

    rules
      .filter((rule) => rule.type === 'SCHEDULED' && rule.schedule)
      .forEach((rule) => {
        try {
          const task = cron.schedule(rule.schedule!, async () => {
            logger.info(`Executing scheduled rule: ${rule.name}`);
            await this.executeRuleActions(rule);
          });

          this.scheduledTasks.set(rule.id, task);
          logger.info(`Scheduled task created for rule: ${rule.name} (${rule.schedule})`);
        } catch (error) {
          logger.error(`Failed to create scheduled task for rule ${rule.name}:`, error);
        }
      });
  }

  private setupCommandListeners() {
    process.on('actuatorCommand', async (command: any) => {
      await this.handleActuatorCommand(command);
    });

    process.on('emergencyStop', async () => {
      await this.handleEmergencyStop();
    });

    process.on('configReload', async () => {
      await this.handleConfigReload();
    });
  }

  async evaluate(readings: any[]) {
    if (!this.isRunning) return;

    const rules = this.configManager.getControlRules();

    // Sort by priority (higher priority first)
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      try {
        if (rule.type === 'THRESHOLD') {
          await this.evaluateThresholdRule(rule, readings);
        } else if (rule.type === 'PID') {
          await this.evaluatePIDRule(rule, readings);
        }
      } catch (error) {
        logger.error(`Error evaluating rule ${rule.name}:`, error);
      }
    }
  }

  private async evaluateThresholdRule(rule: ControlRule, readings: any[]) {
    const { sensorId, operator, threshold } = rule.conditions;

    const reading = readings.find((r) => r.sensorId === sensorId);
    if (!reading) return;

    let shouldTrigger = false;

    switch (operator) {
      case '>':
        shouldTrigger = reading.value > threshold;
        break;
      case '<':
        shouldTrigger = reading.value < threshold;
        break;
      case '>=':
        shouldTrigger = reading.value >= threshold;
        break;
      case '<=':
        shouldTrigger = reading.value <= threshold;
        break;
      case '==':
        shouldTrigger = reading.value === threshold;
        break;
    }

    if (shouldTrigger) {
      logger.info(`Threshold rule triggered: ${rule.name} (${reading.value} ${operator} ${threshold})`);
      await this.executeRuleActions(rule);
    }
  }

  private async evaluatePIDRule(rule: ControlRule, readings: any[]) {
    const { sensorId } = rule.conditions;
    const pidController = this.pidControllers.get(rule.id);

    if (!pidController) return;

    const reading = readings.find((r) => r.sensorId === sensorId);
    if (!reading) return;

    const output = pidController.update(reading.value);

    // Execute action with PID output
    const { actuatorId } = rule.actions;
    const actuator = this.configManager.getActuatorById(actuatorId);

    if (actuator) {
      await this.modbusManager.writeActuator(actuator, Math.round(output));
      await this.mqttClient.publishActuatorStatus(actuatorId, Math.round(output));

      logger.debug(`PID rule ${rule.name}: input=${reading.value}, output=${output}`);
    }
  }

  private async executeRuleActions(rule: ControlRule) {
    const { actuatorId, targetState } = rule.actions;

    const actuator = this.configManager.getActuatorById(actuatorId);
    if (!actuator) {
      logger.warn(`Actuator ${actuatorId} not found for rule ${rule.name}`);
      return;
    }

    await this.modbusManager.writeActuator(actuator, targetState);
    await this.mqttClient.publishActuatorStatus(actuatorId, targetState);

    logger.info(`Executed action for rule ${rule.name}: ${actuator.name} = ${targetState}`);
  }

  private async handleActuatorCommand(command: any) {
    const { actuatorId, state } = command;

    logger.info(`Received actuator command: ${actuatorId} = ${state}`);

    const actuator = this.configManager.getActuatorById(actuatorId);
    if (!actuator) {
      logger.warn(`Actuator ${actuatorId} not found`);
      return;
    }

    await this.modbusManager.writeActuator(actuator, state);
    await this.mqttClient.publishActuatorStatus(actuatorId, state);
  }

  private async handleEmergencyStop() {
    logger.warn('🚨 Emergency stop command received!');

    await this.modbusManager.triggerEmergencyStop();

    // Turn off all actuators
    const actuators = this.configManager.getActuators();
    for (const actuator of actuators) {
      try {
        await this.modbusManager.writeActuator(actuator, 0);
        await this.mqttClient.publishActuatorStatus(actuator.id, 0);
      } catch (error) {
        logger.error(`Failed to turn off actuator ${actuator.name}:`, error);
      }
    }
  }

  private async handleConfigReload() {
    logger.info('Reloading configuration...');

    await this.configManager.load();

    // Reinitialize PID controllers and scheduled tasks
    this.pidControllers.clear();
    this.scheduledTasks.forEach((task) => task.stop());
    this.scheduledTasks.clear();

    this.initializePIDControllers();
    this.initializeScheduledTasks();

    logger.info('Configuration reloaded successfully');
  }
}
