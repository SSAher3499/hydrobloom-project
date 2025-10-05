import mqtt, { MqttClient as MQTTClient } from 'mqtt';
import { Logger } from '../utils/logger';
import { QueueManager } from '../queue/queueManager';

const logger = Logger.getInstance();

export class MqttClient {
  private client?: MQTTClient;
  private isConnected = false;
  private queueManager: QueueManager;
  private readonly topicPrefix: string;

  constructor(queueManager: QueueManager) {
    this.queueManager = queueManager;
    this.topicPrefix = process.env.MQTT_TOPIC_PREFIX || 'growloc';
  }

  async connect() {
    try {
      const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
      const username = process.env.MQTT_USERNAME;
      const password = process.env.MQTT_PASSWORD;
      const clientId =
        process.env.MQTT_CLIENT_ID || `pi_${process.env.PI_ID || 'unknown'}`;

      logger.info(`Connecting to MQTT broker: ${brokerUrl}`);

      this.client = mqtt.connect(brokerUrl, {
        clientId,
        username,
        password,
        clean: false, // Persist session
        reconnectPeriod: parseInt(process.env.MQTT_RECONNECT_PERIOD || '5000', 10),
        connectTimeout: 30000,
        rejectUnauthorized: false, // For self-signed certs in dev
      });

      return new Promise<void>((resolve, reject) => {
        this.client!.on('connect', async () => {
          logger.info('✅ Connected to MQTT broker');
          this.isConnected = true;

          // Subscribe to command topics
          await this.subscribeToCommands();

          // Flush queued messages
          await this.flushQueue();

          resolve();
        });

        this.client!.on('error', (error) => {
          logger.error('MQTT connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.client!.on('offline', () => {
          logger.warn('MQTT client offline');
          this.isConnected = false;
        });

        this.client!.on('reconnect', () => {
          logger.info('Reconnecting to MQTT broker...');
        });

        this.client!.on('message', (topic, payload) => {
          this.handleIncomingMessage(topic, payload);
        });
      });
    } catch (error) {
      logger.error('Failed to connect to MQTT:', error);
      throw error;
    }
  }

  private async subscribeToCommands() {
    const piId = process.env.PI_ID;
    const commandTopic = `${this.topicPrefix}/${piId}/commands/#`;

    this.client!.subscribe(commandTopic, (error) => {
      if (error) {
        logger.error('Failed to subscribe to command topic:', error);
      } else {
        logger.info(`Subscribed to: ${commandTopic}`);
      }
    });
  }

  private handleIncomingMessage(topic: string, payload: Buffer) {
    try {
      const message = JSON.parse(payload.toString());
      logger.info(`Received message on ${topic}:`, message);

      if (topic.includes('/commands/actuator')) {
        // Handle actuator command
        this.handleActuatorCommand(message);
      } else if (topic.includes('/commands/emergency-stop')) {
        // Handle emergency stop
        this.handleEmergencyStop(message);
      } else if (topic.includes('/commands/config-reload')) {
        // Handle config reload
        this.handleConfigReload();
      }
    } catch (error) {
      logger.error('Error handling incoming message:', error);
    }
  }

  private handleActuatorCommand(message: any) {
    // Emit event for control engine to handle
    process.emit('actuatorCommand', message);
  }

  private handleEmergencyStop(message: any) {
    process.emit('emergencyStop', message);
  }

  private handleConfigReload() {
    process.emit('configReload');
  }

  async publishSensorData(readings: any[]) {
    const topic = `${this.topicPrefix}/${process.env.PI_ID}/sensors/data`;
    const payload = JSON.stringify({
      piId: process.env.PI_ID,
      readings,
      timestamp: new Date().toISOString(),
    });

    if (this.isConnected && this.client) {
      this.client.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) {
          logger.error('Failed to publish sensor data:', error);
        } else {
          logger.debug('Published sensor data');
        }
      });
    } else {
      // Queue for later if offline
      await this.queueManager.addSensorReading({
        topic,
        payload,
        timestamp: new Date().toISOString(),
      });
      logger.debug('Queued sensor data for later publishing');
    }
  }

  async publishHeartbeat(status: any) {
    const topic = `${this.topicPrefix}/${process.env.PI_ID}/status`;
    const payload = JSON.stringify(status);

    if (this.isConnected && this.client) {
      this.client.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) {
          logger.error('Failed to publish heartbeat:', error);
        }
      });
    }
  }

  async publishActuatorStatus(actuatorId: string, state: number) {
    const topic = `${this.topicPrefix}/${process.env.PI_ID}/actuators/${actuatorId}/status`;
    const payload = JSON.stringify({
      actuatorId,
      state,
      timestamp: new Date().toISOString(),
    });

    if (this.isConnected && this.client) {
      this.client.publish(topic, payload, { qos: 1 });
    }
  }

  private async flushQueue() {
    try {
      const queuedMessages = await this.queueManager.getQueuedMessages();

      if (queuedMessages.length > 0) {
        logger.info(`Flushing ${queuedMessages.length} queued messages...`);

        for (const msg of queuedMessages) {
          if (this.isConnected && this.client) {
            this.client.publish(msg.topic, msg.payload, { qos: 1 }, async (error) => {
              if (!error) {
                await this.queueManager.markMessageSent(msg.id);
              }
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error flushing queue:', error);
    }
  }

  async disconnect() {
    if (this.client) {
      await new Promise<void>((resolve) => {
        this.client!.end(false, {}, () => {
          logger.info('MQTT client disconnected');
          resolve();
        });
      });
    }
  }
}
