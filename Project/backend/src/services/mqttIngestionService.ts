/**
 * MQTT Ingestion Service
 * Subscribes to MQTT topics from Pi controllers and processes incoming data
 */

import mqtt, { MqttClient } from 'mqtt';
import prisma from '../lib/prisma';
import { Server as SocketIOServer } from 'socket.io';

export class MqttIngestionService {
  private client?: MqttClient;
  private io: SocketIOServer;
  private readonly topicPrefix: string;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.topicPrefix = process.env.MQTT_TOPIC_PREFIX || 'growloc';
  }

  async start() {
    try {
      const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
      const username = process.env.MQTT_USERNAME;
      const password = process.env.MQTT_PASSWORD;
      const clientId = process.env.MQTT_CLIENT_ID || 'growloc-backend';

      console.log(`📡 Connecting to MQTT broker: ${brokerUrl}`);

      this.client = mqtt.connect(brokerUrl, {
        clientId,
        username,
        password,
        clean: false,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
      });

      this.client.on('connect', () => {
        console.log('✅ MQTT Ingestion Service connected to broker');
        this.subscribeToTopics();
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error);
      });

      this.client.on('offline', () => {
        console.warn('⚠️  MQTT client offline');
      });

      this.client.on('reconnect', () => {
        console.log('🔄 Reconnecting to MQTT broker...');
      });

      this.client.on('message', async (topic, payload) => {
        await this.handleMessage(topic, payload);
      });
    } catch (error) {
      console.error('Failed to start MQTT ingestion service:', error);
      throw error;
    }
  }

  private subscribeToTopics() {
    if (!this.client) return;

    const topics = [
      `${this.topicPrefix}/+/sensors/data`,
      `${this.topicPrefix}/+/actuators/+/status`,
      `${this.topicPrefix}/+/status`,
    ];

    topics.forEach((topic) => {
      this.client!.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          console.error(`Failed to subscribe to ${topic}:`, error);
        } else {
          console.log(`📥 Subscribed to: ${topic}`);
        }
      });
    });
  }

  private async handleMessage(topic: string, payload: Buffer) {
    try {
      const message = JSON.parse(payload.toString());

      if (topic.includes('/sensors/data')) {
        await this.handleSensorData(message);
      } else if (topic.includes('/actuators/') && topic.includes('/status')) {
        await this.handleActuatorStatus(topic, message);
      } else if (topic.endsWith('/status')) {
        await this.handlePiStatus(message);
      }
    } catch (error) {
      console.error('Error handling MQTT message:', error);
    }
  }

  private async handleSensorData(data: any) {
    try {
      const { piId, readings, timestamp } = data;

      // Update Pi last seen
      await prisma.raspberryPi.updateMany({
        where: { macAddress: piId },
        data: {
          lastSeen: new Date(timestamp),
          status: 'ONLINE'
        },
      });

      // Save sensor readings
      if (readings && Array.isArray(readings)) {
        for (const reading of readings) {
          try {
            // Find sensor by ID
            const sensor = await prisma.sensor.findFirst({
              where: {
                id: reading.sensorId,
                raspberryPiId: { not: null }
              },
              include: {
                raspberryPi: true,
                zone: {
                  include: {
                    polyhouse: {
                      include: {
                        farm: true
                      }
                    }
                  }
                }
              }
            });

            if (sensor) {
              // Update sensor latest value and last seen
              await prisma.sensor.update({
                where: { id: sensor.id },
                data: {
                  latestValue: reading.value,
                  lastSeen: new Date(reading.timestamp || timestamp),
                },
              });

              // Save reading to sensor_readings table
              await prisma.sensorReading.create({
                data: {
                  sensorId: sensor.id,
                  value: reading.value,
                  timestamp: new Date(reading.timestamp || timestamp),
                },
              });

              // Broadcast to Socket.io clients subscribed to this farm
              if (sensor.zone?.polyhouse?.farm) {
                this.io.to(`farm-${sensor.zone.polyhouse.farm.id}`).emit('sensor-update', {
                  sensorId: sensor.id,
                  value: reading.value,
                  timestamp: reading.timestamp || timestamp,
                  type: sensor.type,
                  unit: sensor.unit,
                  zoneId: sensor.zoneId,
                });
              }
            }
          } catch (error) {
            console.error('Error saving sensor reading:', error);
          }
        }

        console.log(`📊 Saved ${readings.length} sensor readings from Pi: ${piId}`);
      }
    } catch (error) {
      console.error('Error handling sensor data:', error);
    }
  }

  private async handleActuatorStatus(topic: string, data: any) {
    try {
      const { actuatorId, state, timestamp } = data;

      // Update actuator state
      await prisma.modbusActuator.updateMany({
        where: { id: actuatorId },
        data: {
          currentState: state,
          lastToggled: new Date(timestamp),
        },
      });

      // Get actuator with relations for broadcasting
      const actuator = await prisma.modbusActuator.findUnique({
        where: { id: actuatorId },
        include: {
          raspberryPi: {
            include: {
              farm: true,
              polyhouse: true
            }
          },
          zone: {
            include: {
              polyhouse: {
                include: {
                  farm: true
                }
              }
            }
          }
        },
      });

      if (actuator) {
        // Broadcast to Socket.io clients
        const farmId = actuator.raspberryPi?.farmId || actuator.zone?.polyhouse?.farmId;
        if (farmId) {
          this.io.to(`farm-${farmId}`).emit('actuator-update', {
            actuatorId: actuator.id,
            name: actuator.name,
            type: actuator.type,
            state,
            timestamp,
          });
        }

        console.log(`🔧 Actuator ${actuator.name} state updated: ${state}`);
      }
    } catch (error) {
      console.error('Error handling actuator status:', error);
    }
  }

  private async handlePiStatus(data: any) {
    try {
      const { piId, name, status, timestamp, farmId, polyhouseId } = data;

      // Update or create Pi record
      await prisma.raspberryPi.upsert({
        where: { macAddress: piId },
        update: {
          status: status === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
          lastSeen: new Date(timestamp),
        },
        create: {
          name: name || piId,
          macAddress: piId,
          farmId: farmId || null,
          polyhouseId: polyhouseId || null,
          status: status === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
          lastSeen: new Date(timestamp),
        },
      });

      // Broadcast to Socket.io clients
      if (farmId) {
        this.io.to(`farm-${farmId}`).emit('pi-status-update', {
          piId,
          name,
          status,
          timestamp,
        });
      }

      console.log(`📡 Pi ${name} status: ${status}`);
    } catch (error) {
      console.error('Error handling Pi status:', error);
    }
  }

  /**
   * Publish a command to a specific Pi
   */
  async publishCommand(piId: string, command: string, payload: any) {
    if (!this.client) {
      throw new Error('MQTT client not connected');
    }

    const topic = `${this.topicPrefix}/${piId}/commands/${command}`;
    const message = JSON.stringify(payload);

    return new Promise<void>((resolve, reject) => {
      this.client!.publish(topic, message, { qos: 1 }, (error) => {
        if (error) {
          console.error(`Failed to publish command to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`📤 Published command to ${topic}`);
          resolve();
        }
      });
    });
  }

  async stop() {
    if (this.client) {
      await new Promise<void>((resolve) => {
        this.client!.end(false, {}, () => {
          console.log('MQTT Ingestion Service disconnected');
          resolve();
        });
      });
    }
  }
}
