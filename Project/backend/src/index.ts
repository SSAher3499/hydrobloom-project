import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import onboardingRoutes from './routes/onboarding';
import farmRoutes from './routes/farm';
import commandRoutes from './routes/command';
import otpRoutes from './routes/auth.otp.routes';
import iotRoutes, { setMqttService } from './routes/iot';
import prisma from './lib/prisma';
import { MqttIngestionService } from './services/mqttIngestionService';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many OTP requests from this IP, please try again later.'
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EcoFarmLogix API is running' });
});

// Email OTP routes
app.use('/api', otpRoutes);

// Auth routes with rate limiting for OTP
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Farm and command routes
app.use('/api/farms', farmRoutes);
app.use('/api/commands', commandRoutes);

// IoT routes
app.use('/api/iot', iotRoutes);

// Global rate limiting for all other routes
app.use('/api', limiter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Socket.IO real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', async (data: { farmId: string }) => {
    const { farmId } = data;
    socket.join(`farm-${farmId}`);
    console.log(`Client ${socket.id} subscribed to farm-${farmId}`);

    // Send initial telemetry (sensors, actuators, Pis)
    try {
      // Get sensors
      const sensors = await prisma.sensor.findMany({
        where: {
          zone: { polyhouse: { farmId } },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
          latestValue: true,
          unit: true,
          lastSeen: true,
          zoneId: true,
        },
      });

      // Get actuators
      const actuators = await prisma.modbusActuator.findMany({
        where: {
          OR: [
            { raspberryPi: { farmId } },
            { polyhouse: { farmId } }
          ],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
          currentState: true,
          lastToggled: true,
          zoneId: true,
          polyhouseId: true,
        },
      });

      // Get Raspberry Pis
      const pis = await prisma.raspberryPi.findMany({
        where: { farmId, isActive: true },
        select: {
          id: true,
          name: true,
          status: true,
          lastSeen: true,
          polyhouseId: true,
        },
      });

      socket.emit('initial-iot-data', {
        sensors,
        actuators,
        pis,
        timestamp: new Date(),
      });

      // Backward compatibility - also emit telemetry
      socket.emit('telemetry', { sensors, timestamp: new Date() });
    } catch (error) {
      console.error('Error sending initial telemetry:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Simulate live telemetry updates every 10 seconds (reduced frequency to avoid SQLite timeouts)
// NOTE: Commented out to avoid SQLite locking issues. Frontend will still show initial telemetry data.
// For production, use PostgreSQL which handles concurrent writes much better.
/*
setInterval(async () => {
  try {
    const farms = await prisma.farm.findMany({ where: { isActive: true } });

    for (const farm of farms) {
      const sensors = await prisma.sensor.findMany({
        where: {
          zone: { polyhouse: { farmId: farm.id } },
          isActive: true,
        },
      });

      // Update sensor values with small random changes in memory first
      const updates: Array<{ id: string; newValue: number }> = [];

      for (const sensor of sensors) {
        if (sensor.latestValue !== null) {
          let newValue = sensor.latestValue;

          if (sensor.type === 'valve_state') {
            // Valve state stays mostly the same
            newValue = Math.random() > 0.95 ? (sensor.latestValue === 0 ? 1 : 0) : sensor.latestValue;
          } else {
            // Add small random variation (-0.05 to +0.05) - smaller changes
            const variation = (Math.random() - 0.5) * 0.1;
            newValue = parseFloat((sensor.latestValue + variation).toFixed(2));

            // Keep within reasonable bounds
            if (sensor.type === 'pH') {
              newValue = Math.max(5.5, Math.min(7.5, newValue));
            } else if (sensor.type === 'EC') {
              newValue = Math.max(0.8, Math.min(2.0, newValue));
            } else if (sensor.type === 'temperature') {
              newValue = Math.max(20, Math.min(35, newValue));
            } else if (sensor.type === 'humidity') {
              newValue = Math.max(50, Math.min(85, newValue));
            } else if (sensor.type === 'tank_level') {
              newValue = Math.max(0, Math.min(100, newValue));
            }
          }

          updates.push({ id: sensor.id, newValue });
        }
      }

      // Batch update sensors (limit to 20 at a time to avoid SQLite lock issues)
      const batchSize = 20;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        await Promise.all(
          batch.map((update) =>
            prisma.sensor.update({
              where: { id: update.id },
              data: { latestValue: update.newValue, lastSeen: new Date() },
            }).catch((err) => {
              // Silently skip failed updates to avoid crashing
              console.error(`Failed to update sensor ${update.id}:`, err.message);
            })
          )
        );
        // Small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Emit updated sensors to subscribed clients
      const updatedSensors = await prisma.sensor.findMany({
        where: {
          zone: { polyhouse: { farmId: farm.id } },
          isActive: true,
        },
        select: {
          id: true,
          type: true,
          latestValue: true,
          unit: true,
          zoneId: true,
        },
      });

      io.to(`farm-${farm.id}`).emit('telemetry', {
        sensors: updatedSensors,
        timestamp: new Date(),
      });
    }
  } catch (error) {
    console.error('Error in telemetry update loop:', error);
  }
}, 10000); // Changed from 5s to 10s
*/

// Initialize MQTT Ingestion Service
let mqttService: MqttIngestionService | null = null;

async function startServices() {
  try {
    // Start MQTT ingestion service
    mqttService = new MqttIngestionService(io);
    await mqttService.start();
    setMqttService(mqttService);
    console.log('✅ MQTT Ingestion Service started');
  } catch (error) {
    console.error('⚠️  Failed to start MQTT service:', error);
    console.log('⚠️  Continuing without MQTT (IoT features disabled)');
  }
}

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  try {
    // Stop MQTT service
    if (mqttService) {
      await mqttService.stop();
      console.log('✅ MQTT service stopped');
    }

    // Close database connections
    await prisma.$disconnect();
    console.log('✅ Database connections closed');

    // Close HTTP server
    httpServer.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

httpServer.listen(PORT, async () => {
  console.log(`🌱 Growloc API server running on port ${PORT}`);
  console.log(`📊 Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`🔌 Socket.IO server ready for connections`);

  // Start background services
  await startServices();
});