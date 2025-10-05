import Database from 'better-sqlite3';
import { Logger } from '../utils/logger';
import path from 'path';

const logger = Logger.getInstance();

export class QueueManager {
  private db?: Database.Database;

  async initialize() {
    try {
      const dbPath = process.env.DATABASE_PATH || './data/queue.db';
      logger.info(`Initializing queue database: ${dbPath}`);

      this.db = new Database(dbPath);

      // Create tables
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sensor_readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sensor_id TEXT NOT NULL,
          value REAL NOT NULL,
          timestamp TEXT NOT NULL,
          pi_id TEXT NOT NULL,
          sent INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS mqtt_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          topic TEXT NOT NULL,
          payload TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          sent INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_sensor_readings_sent
          ON sensor_readings(sent, created_at);
        CREATE INDEX IF NOT EXISTS idx_mqtt_queue_sent
          ON mqtt_queue(sent, created_at);
      `);

      logger.info('Queue database initialized');
    } catch (error) {
      logger.error('Failed to initialize queue database:', error);
      throw error;
    }
  }

  async addSensorReading(reading: any) {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO sensor_readings (sensor_id, value, timestamp, pi_id)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run(
        reading.sensorId,
        reading.value,
        reading.timestamp,
        reading.piId
      );
    } catch (error) {
      logger.error('Failed to add sensor reading to queue:', error);
    }
  }

  async getQueuedMessages(): Promise<any[]> {
    if (!this.db) return [];

    try {
      const rows = this.db
        .prepare('SELECT * FROM mqtt_queue WHERE sent = 0 ORDER BY created_at LIMIT 100')
        .all();

      return rows;
    } catch (error) {
      logger.error('Failed to get queued messages:', error);
      return [];
    }
  }

  async markMessageSent(id: number) {
    if (!this.db) return;

    try {
      this.db.prepare('UPDATE mqtt_queue SET sent = 1 WHERE id = ?').run(id);
    } catch (error) {
      logger.error('Failed to mark message as sent:', error);
    }
  }

  async cleanOldRecords(daysToKeep = 7) {
    if (!this.db) return;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      this.db
        .prepare(
          "DELETE FROM sensor_readings WHERE sent = 1 AND created_at < ?"
        )
        .run(cutoffDate.toISOString());

      this.db
        .prepare(
          "DELETE FROM mqtt_queue WHERE sent = 1 AND created_at < ?"
        )
        .run(cutoffDate.toISOString());

      logger.info('Old records cleaned from queue');
    } catch (error) {
      logger.error('Failed to clean old records:', error);
    }
  }

  async close() {
    if (this.db) {
      this.db.close();
    }
  }
}
