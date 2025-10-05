/**
 * IoT Routes - Raspberry Pi, Sensors, Actuators, Control Rules Management
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { MqttIngestionService } from '../services/mqttIngestionService';

const router = Router();

// We'll inject the MQTT service via middleware or singleton
let mqttService: MqttIngestionService;

export function setMqttService(service: MqttIngestionService) {
  mqttService = service;
}

// ============================================================================
// Raspberry Pi Management
// ============================================================================

/**
 * GET /api/iot/pis
 * List all Raspberry Pis
 */
router.get('/pis', async (req: Request, res: Response) => {
  try {
    const { farmId } = req.query;

    const pis = await prisma.raspberryPi.findMany({
      where: farmId ? { farmId: farmId as string } : {},
      include: {
        farm: true,
        polyhouse: true,
        sensors: {
          where: { isActive: true },
          select: { id: true, name: true, type: true }
        },
        actuators: {
          where: { isActive: true },
          select: { id: true, name: true, type: true }
        },
        _count: {
          select: {
            sensors: true,
            actuators: true,
            rules: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ pis });
  } catch (error) {
    console.error('Error fetching Pis:', error);
    res.status(500).json({ error: 'Failed to fetch Raspberry Pis' });
  }
});

/**
 * GET /api/iot/pis/:id
 * Get Pi details
 */
router.get('/pis/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pi = await prisma.raspberryPi.findUnique({
      where: { id },
      include: {
        farm: true,
        polyhouse: true,
        sensors: {
          where: { isActive: true },
          include: {
            zone: true,
            _count: {
              select: { readings: true }
            }
          }
        },
        actuators: {
          where: { isActive: true },
          include: {
            zone: true,
            polyhouse: true
          }
        },
        rules: {
          where: { isActive: true },
          include: {
            actuator: true
          }
        },
      },
    });

    if (!pi) {
      return res.status(404).json({ error: 'Raspberry Pi not found' });
    }

    res.json({ pi });
  } catch (error) {
    console.error('Error fetching Pi:', error);
    res.status(500).json({ error: 'Failed to fetch Raspberry Pi details' });
  }
});

/**
 * POST /api/iot/pis
 * Register new Raspberry Pi
 */
router.post('/pis', async (req: Request, res: Response) => {
  try {
    const {
      name,
      macAddress,
      ipAddress,
      farmId,
      polyhouseId,
      serialPort,
      firmwareVersion
    } = req.body;

    // Validate required fields
    if (!name || !macAddress) {
      return res.status(400).json({ error: 'Name and MAC address are required' });
    }

    // Check if Pi already exists
    const existing = await prisma.raspberryPi.findUnique({
      where: { macAddress },
    });

    if (existing) {
      return res.status(409).json({ error: 'Pi with this MAC address already exists' });
    }

    const pi = await prisma.raspberryPi.create({
      data: {
        name,
        macAddress,
        ipAddress,
        farmId: farmId || null,
        polyhouseId: polyhouseId || null,
        serialPort: serialPort || '/dev/ttyUSB0',
        firmwareVersion,
        status: 'OFFLINE',
      },
      include: {
        farm: true,
        polyhouse: true,
      },
    });

    res.status(201).json({ pi });
  } catch (error) {
    console.error('Error creating Pi:', error);
    res.status(500).json({ error: 'Failed to register Raspberry Pi' });
  }
});

/**
 * PUT /api/iot/pis/:id
 * Update Pi details
 */
router.put('/pis/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, ipAddress, farmId, polyhouseId, serialPort, isActive } = req.body;

    const pi = await prisma.raspberryPi.update({
      where: { id },
      data: {
        name,
        ipAddress,
        farmId: farmId || null,
        polyhouseId: polyhouseId || null,
        serialPort,
        isActive,
      },
      include: {
        farm: true,
        polyhouse: true,
      },
    });

    res.json({ pi });
  } catch (error) {
    console.error('Error updating Pi:', error);
    res.status(500).json({ error: 'Failed to update Raspberry Pi' });
  }
});

/**
 * DELETE /api/iot/pis/:id
 * Delete Pi (soft delete by setting isActive = false)
 */
router.delete('/pis/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.raspberryPi.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Raspberry Pi deleted successfully' });
  } catch (error) {
    console.error('Error deleting Pi:', error);
    res.status(500).json({ error: 'Failed to delete Raspberry Pi' });
  }
});

// ============================================================================
// Sensor Management (Modbus Sensors on Pi)
// ============================================================================

/**
 * POST /api/iot/pis/:piId/sensors
 * Add sensor to Pi
 */
router.post('/pis/:piId/sensors', async (req: Request, res: Response) => {
  try {
    const { piId } = req.params;
    const {
      name,
      type,
      zoneId,
      unit,
      modbusSlaveId,
      modbusRegisterAddr,
      modbusRegisterType,
      modbusFunctionCode,
      baudRate,
      scalingFactor,
      scalingOffset
    } = req.body;

    // Validate Pi exists
    const pi = await prisma.raspberryPi.findUnique({ where: { id: piId } });
    if (!pi) {
      return res.status(404).json({ error: 'Raspberry Pi not found' });
    }

    const sensor = await prisma.sensor.create({
      data: {
        name,
        type,
        zoneId,
        unit,
        raspberryPiId: piId,
        modbusSlaveId,
        modbusRegisterAddr,
        modbusRegisterType,
        modbusFunctionCode,
        baudRate: baudRate || 9600,
        scalingFactor,
        scalingOffset,
        isActive: true,
      },
      include: {
        zone: true,
        raspberryPi: true,
      },
    });

    // Send config reload command to Pi
    if (mqttService) {
      await mqttService.publishCommand(pi.macAddress, 'config-reload', {});
    }

    res.status(201).json({ sensor });
  } catch (error) {
    console.error('Error adding sensor:', error);
    res.status(500).json({ error: 'Failed to add sensor' });
  }
});

/**
 * PUT /api/iot/sensors/:id
 * Update sensor configuration
 */
router.put('/sensors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const sensor = await prisma.sensor.update({
      where: { id },
      data: updateData,
      include: {
        zone: true,
        raspberryPi: true,
      },
    });

    // Send config reload command to Pi
    if (sensor.raspberryPi && mqttService) {
      await mqttService.publishCommand(sensor.raspberryPi.macAddress, 'config-reload', {});
    }

    res.json({ sensor });
  } catch (error) {
    console.error('Error updating sensor:', error);
    res.status(500).json({ error: 'Failed to update sensor' });
  }
});

/**
 * DELETE /api/iot/sensors/:id
 * Delete sensor
 */
router.delete('/sensors/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sensor = await prisma.sensor.update({
      where: { id },
      data: { isActive: false },
      include: { raspberryPi: true },
    });

    // Send config reload command to Pi
    if (sensor.raspberryPi && mqttService) {
      await mqttService.publishCommand(sensor.raspberryPi.macAddress, 'config-reload', {});
    }

    res.json({ message: 'Sensor deleted successfully' });
  } catch (error) {
    console.error('Error deleting sensor:', error);
    res.status(500).json({ error: 'Failed to delete sensor' });
  }
});

/**
 * GET /api/iot/sensors/:id/readings
 * Get sensor readings (historical data)
 */
router.get('/sensors/:id/readings', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit = '1000' } = req.query;

    const where: any = { sensorId: id };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const readings = await prisma.sensorReading.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({ readings });
  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    res.status(500).json({ error: 'Failed to fetch sensor readings' });
  }
});

// ============================================================================
// Actuator Management
// ============================================================================

/**
 * POST /api/iot/pis/:piId/actuators
 * Add actuator to Pi
 */
router.post('/pis/:piId/actuators', async (req: Request, res: Response) => {
  try {
    const { piId } = req.params;
    const {
      name,
      type,
      zoneId,
      polyhouseId,
      modbusSlaveId,
      modbusRegisterAddr,
      modbusRegisterType,
      modbusFunctionCode
    } = req.body;

    // Validate Pi exists
    const pi = await prisma.raspberryPi.findUnique({ where: { id: piId } });
    if (!pi) {
      return res.status(404).json({ error: 'Raspberry Pi not found' });
    }

    const actuator = await prisma.modbusActuator.create({
      data: {
        name,
        type,
        raspberryPiId: piId,
        zoneId: zoneId || null,
        polyhouseId: polyhouseId || null,
        modbusSlaveId,
        modbusRegisterAddr,
        modbusRegisterType: modbusRegisterType || 'coil',
        modbusFunctionCode: modbusFunctionCode || 5,
        currentState: 0,
        isActive: true,
      },
      include: {
        raspberryPi: true,
        zone: true,
        polyhouse: true,
      },
    });

    // Send config reload command to Pi
    if (mqttService) {
      await mqttService.publishCommand(pi.macAddress, 'config-reload', {});
    }

    res.status(201).json({ actuator });
  } catch (error) {
    console.error('Error adding actuator:', error);
    res.status(500).json({ error: 'Failed to add actuator' });
  }
});

/**
 * PUT /api/iot/actuators/:id
 * Update actuator configuration
 */
router.put('/actuators/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const actuator = await prisma.modbusActuator.update({
      where: { id },
      data: updateData,
      include: {
        raspberryPi: true,
        zone: true,
        polyhouse: true,
      },
    });

    // Send config reload command to Pi
    if (actuator.raspberryPi && mqttService) {
      await mqttService.publishCommand(actuator.raspberryPi.macAddress, 'config-reload', {});
    }

    res.json({ actuator });
  } catch (error) {
    console.error('Error updating actuator:', error);
    res.status(500).json({ error: 'Failed to update actuator' });
  }
});

/**
 * DELETE /api/iot/actuators/:id
 * Delete actuator
 */
router.delete('/actuators/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const actuator = await prisma.modbusActuator.update({
      where: { id },
      data: { isActive: false },
      include: { raspberryPi: true },
    });

    // Send config reload command to Pi
    if (actuator.raspberryPi && mqttService) {
      await mqttService.publishCommand(actuator.raspberryPi.macAddress, 'config-reload', {});
    }

    res.json({ message: 'Actuator deleted successfully' });
  } catch (error) {
    console.error('Error deleting actuator:', error);
    res.status(500).json({ error: 'Failed to delete actuator' });
  }
});

/**
 * POST /api/iot/actuators/:id/command
 * Send manual control command to actuator
 */
router.post('/actuators/:id/command', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { state } = req.body;

    if (state === undefined) {
      return res.status(400).json({ error: 'State is required' });
    }

    const actuator = await prisma.modbusActuator.findUnique({
      where: { id },
      include: { raspberryPi: true },
    });

    if (!actuator) {
      return res.status(404).json({ error: 'Actuator not found' });
    }

    if (!actuator.raspberryPi) {
      return res.status(400).json({ error: 'Actuator is not associated with a Pi' });
    }

    // Send command via MQTT
    if (mqttService) {
      await mqttService.publishCommand(actuator.raspberryPi.macAddress, 'actuator', {
        actuatorId: actuator.id,
        state,
      });

      res.json({ message: 'Command sent successfully', actuatorId: id, state });
    } else {
      res.status(503).json({ error: 'MQTT service not available' });
    }
  } catch (error) {
    console.error('Error sending actuator command:', error);
    res.status(500).json({ error: 'Failed to send actuator command' });
  }
});

// ============================================================================
// Control Rules Management
// ============================================================================

/**
 * GET /api/iot/pis/:piId/rules
 * Get control rules for a Pi
 */
router.get('/pis/:piId/rules', async (req: Request, res: Response) => {
  try {
    const { piId } = req.params;

    const rules = await prisma.controlRule.findMany({
      where: { raspberryPiId: piId },
      include: {
        actuator: true,
      },
      orderBy: { priority: 'desc' },
    });

    res.json({ rules });
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Failed to fetch control rules' });
  }
});

/**
 * POST /api/iot/pis/:piId/rules
 * Create control rule
 */
router.post('/pis/:piId/rules', async (req: Request, res: Response) => {
  try {
    const { piId } = req.params;
    const {
      name,
      ruleType,
      isActive,
      priority,
      conditions,
      actions,
      schedule,
      pidConfig,
      actuatorId
    } = req.body;

    // Validate Pi exists
    const pi = await prisma.raspberryPi.findUnique({ where: { id: piId } });
    if (!pi) {
      return res.status(404).json({ error: 'Raspberry Pi not found' });
    }

    const rule = await prisma.controlRule.create({
      data: {
        name,
        raspberryPiId: piId,
        ruleType,
        isActive: isActive !== undefined ? isActive : true,
        priority: priority || 0,
        conditions,
        actions,
        schedule,
        pidConfig,
        actuatorId: actuatorId || null,
      },
      include: {
        actuator: true,
      },
    });

    // Send config reload command to Pi
    if (mqttService) {
      await mqttService.publishCommand(pi.macAddress, 'config-reload', {});
    }

    res.status(201).json({ rule });
  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ error: 'Failed to create control rule' });
  }
});

/**
 * PUT /api/iot/rules/:id
 * Update control rule
 */
router.put('/rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const rule = await prisma.controlRule.update({
      where: { id },
      data: updateData,
      include: {
        actuator: true,
        raspberryPi: true,
      },
    });

    // Send config reload command to Pi
    if (rule.raspberryPi && mqttService) {
      await mqttService.publishCommand(rule.raspberryPi.macAddress, 'config-reload', {});
    }

    res.json({ rule });
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Failed to update control rule' });
  }
});

/**
 * DELETE /api/iot/rules/:id
 * Delete control rule
 */
router.delete('/rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rule = await prisma.controlRule.update({
      where: { id },
      data: { isActive: false },
      include: { raspberryPi: true },
    });

    // Send config reload command to Pi
    if (rule.raspberryPi && mqttService) {
      await mqttService.publishCommand(rule.raspberryPi.macAddress, 'config-reload', {});
    }

    res.json({ message: 'Control rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting rule:', error);
    res.status(500).json({ error: 'Failed to delete control rule' });
  }
});

// ============================================================================
// Emergency Stop
// ============================================================================

/**
 * POST /api/iot/pis/:piId/emergency-stop
 * Trigger emergency stop on Pi
 */
router.post('/pis/:piId/emergency-stop', async (req: Request, res: Response) => {
  try {
    const { piId } = req.params;

    const pi = await prisma.raspberryPi.findUnique({ where: { id: piId } });
    if (!pi) {
      return res.status(404).json({ error: 'Raspberry Pi not found' });
    }

    // Send emergency stop command via MQTT
    if (mqttService) {
      await mqttService.publishCommand(pi.macAddress, 'emergency-stop', {
        timestamp: new Date().toISOString(),
      });

      res.json({ message: 'Emergency stop triggered successfully' });
    } else {
      res.status(503).json({ error: 'MQTT service not available' });
    }
  } catch (error) {
    console.error('Error triggering emergency stop:', error);
    res.status(500).json({ error: 'Failed to trigger emergency stop' });
  }
});

export default router;
