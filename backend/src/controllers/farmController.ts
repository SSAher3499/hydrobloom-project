import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// GET /api/farms/:id/summary
export const getFarmSummary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Count polyhouses
    const polyhousesCount = await prisma.polyhouse.count({
      where: { farmId: id, isActive: true },
    });

    // Count reservoirs
    const reservoirsCount = await prisma.reservoir.count({
      where: { farmId: id, isActive: true },
    });

    // Count zones
    const zonesCount = await prisma.zone.count({
      where: {
        polyhouse: { farmId: id },
        isActive: true,
      },
    });

    // Count nurseries
    const nurseriesCount = await prisma.nursery.count({
      where: {
        zone: { polyhouse: { farmId: id } },
        isActive: true,
      },
    });

    // Get inventory metrics
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { farmId: id, isActive: true },
    });

    const totalInventoryValue = inventoryItems.reduce(
      (sum, item) => sum + (item.currentStock * (item.costPerUnit || 0)),
      0
    );

    const inventoryInStock = inventoryItems.filter(
      (item) => item.lowStockAlert && item.currentStock > item.lowStockAlert
    ).length;

    const inventoryAvailablePercent = inventoryItems.length > 0
      ? Math.round((inventoryInStock / inventoryItems.length) * 100)
      : 0;

    // Count active alerts
    const activeAlertsCount = await prisma.alert.count({
      where: {
        farmId: id,
        isAcknowledged: false,
        isResolved: false,
      },
    });

    // Count overdue tasks
    const now = new Date();
    const overdueTasksCount = await prisma.task.count({
      where: {
        polyhouse: { farmId: id },
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        dueDate: { lt: now },
      },
    });

    // Calculate utilization (zones with active lifecycles / total zones)
    const activeLifecyclesCount = await prisma.lifecycle.count({
      where: {
        status: 'ACTIVE',
        zone: { polyhouse: { farmId: id } },
      },
    });

    const utilizationPercent = zonesCount > 0
      ? Math.round((activeLifecyclesCount / zonesCount) * 100)
      : 0;

    // Calculate expected harvest revenue (dummy calculation based on active lifecycles)
    const expectedHarvestRevenue = activeLifecyclesCount * 15000 + Math.random() * 50000;

    // Calculate sales revenue from inventory transactions
    const outboundTransactions = await prisma.inventoryTransaction.findMany({
      where: {
        inventoryItem: { farmId: id },
        type: 'OUTBOUND',
      },
    });

    const salesRevenue = outboundTransactions.reduce(
      (sum, txn) => sum + (txn.totalCost || 0),
      0
    );

    res.json({
      polyhouses: polyhousesCount,
      reservoirs: reservoirsCount,
      zones: zonesCount,
      nurseries: nurseriesCount,
      inventoryAvailablePercent,
      inventoryCost: totalInventoryValue,
      activeAlerts: activeAlertsCount,
      overdueTasks: overdueTasksCount,
      utilizationPercent,
      expectedHarvestRevenue,
      salesRevenue,
    });
  } catch (error) {
    console.error('Error fetching farm summary:', error);
    res.status(500).json({ error: 'Failed to fetch farm summary' });
  }
};

// GET /api/farms/:id/latest-telemetry
export const getLatestTelemetry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get all sensors for this farm
    const sensors = await prisma.sensor.findMany({
      where: {
        zone: {
          polyhouse: {
            farmId: id,
          },
        },
        isActive: true,
      },
      select: {
        type: true,
        latestValue: true,
        unit: true,
      },
    });

    // Aggregate by sensor type
    const telemetryMap: Record<string, { values: number[], unit: string }> = {};

    sensors.forEach((sensor) => {
      if (sensor.latestValue !== null) {
        if (!telemetryMap[sensor.type]) {
          telemetryMap[sensor.type] = { values: [], unit: sensor.unit || '' };
        }
        telemetryMap[sensor.type].values.push(sensor.latestValue);
      }
    });

    // Calculate averages
    const telemetry: Record<string, { value: number, unit: string }> = {};
    Object.keys(telemetryMap).forEach((type) => {
      const values = telemetryMap[type].values;
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      telemetry[type] = {
        value: parseFloat(avg.toFixed(2)),
        unit: telemetryMap[type].unit,
      };
    });

    res.json(telemetry);
  } catch (error) {
    console.error('Error fetching latest telemetry:', error);
    res.status(500).json({ error: 'Failed to fetch telemetry data' });
  }
};

// GET /api/farms/:id/weather
export const getWeather = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get farm location
    const farm = await prisma.farm.findUnique({
      where: { id },
    });

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    // Check if OpenWeather API key is available
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (apiKey && farm.location) {
      // TODO: Implement actual OpenWeather API call
      // For now, return mock data
    }

    // Return mock weather data
    res.json({
      current: `${Math.round(25 + Math.random() * 8)}°C`,
      feelsLike: `${Math.round(28 + Math.random() * 8)}°C`,
      humidity: `${Math.round(60 + Math.random() * 20)}%`,
      wind: `${Math.round(10 + Math.random() * 10)} km/h`,
      pressure: `${Math.round(1010 + Math.random() * 10)} hPa`,
      condition: ['Clear', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)],
    });
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
};

// GET /api/farms/:id/inventory/summary
export const getInventorySummary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const items = await prisma.inventoryItem.findMany({
      where: { farmId: id, isActive: true },
      orderBy: { name: 'asc' },
    });

    const totalValue = items.reduce(
      (sum, item) => sum + item.currentStock * (item.costPerUnit || 0),
      0
    );

    const lowStockItems = items.filter(
      (item) => item.lowStockAlert && item.currentStock <= item.lowStockAlert
    ).length;

    res.json({
      totalItems: items.length,
      totalValue,
      lowStockItems,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        unit: item.unit,
        costPerUnit: item.costPerUnit,
        totalValue: item.currentStock * (item.costPerUnit || 0),
        isLowStock: item.lowStockAlert ? item.currentStock <= item.lowStockAlert : false,
      })),
    });
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({ error: 'Failed to fetch inventory summary' });
  }
};

// GET /api/farms/:id/tasks/summary
export const getTasksSummary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tasks = await prisma.task.findMany({
      where: {
        polyhouse: { farmId: id },
      },
      include: {
        assignee: {
          select: { name: true, email: true },
        },
        polyhouse: {
          select: { name: true },
        },
        zone: {
          select: { name: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    const overdue = tasks.filter(
      (t) => t.dueDate && t.dueDate < now && t.status !== 'CLOSED'
    ).length;

    const open = tasks.filter((t) => t.status === 'OPEN').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;

    res.json({
      total: tasks.length,
      overdue,
      open,
      inProgress,
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        category: task.category,
        assignee: task.assignee?.name || 'Unassigned',
        polyhouse: task.polyhouse?.name,
        zone: task.zone?.name,
        dueDate: task.dueDate,
        isOverdue: task.dueDate ? task.dueDate < now && task.status !== 'CLOSED' : false,
      })),
    });
  } catch (error) {
    console.error('Error fetching tasks summary:', error);
    res.status(500).json({ error: 'Failed to fetch tasks summary' });
  }
};

// GET /api/farms/:id/alerts/summary
export const getAlertsSummary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const alerts = await prisma.alert.findMany({
      where: { farmId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const active = alerts.filter((a) => !a.isAcknowledged && !a.isResolved);
    const acknowledged = alerts.filter((a) => a.isAcknowledged && !a.isResolved);

    const bySeverity = {
      CRITICAL: alerts.filter((a) => a.severity === 'CRITICAL' && !a.isResolved).length,
      HIGH: alerts.filter((a) => a.severity === 'HIGH' && !a.isResolved).length,
      MEDIUM: alerts.filter((a) => a.severity === 'MEDIUM' && !a.isResolved).length,
      LOW: alerts.filter((a) => a.severity === 'LOW' && !a.isResolved).length,
    };

    res.json({
      total: alerts.length,
      active: active.length,
      acknowledged: acknowledged.length,
      bySeverity,
      alerts: alerts.map((alert) => ({
        id: alert.id,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        source: alert.source,
        isAcknowledged: alert.isAcknowledged,
        isResolved: alert.isResolved,
        createdAt: alert.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching alerts summary:', error);
    res.status(500).json({ error: 'Failed to fetch alerts summary' });
  }
};

// GET /api/farms/:id/polyhouses
export const getPolyhouses = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const polyhouses = await prisma.polyhouse.findMany({
      where: { farmId: id, isActive: true },
      include: {
        zones: {
          where: { isActive: true },
          select: { id: true },
        },
        _count: {
          select: { zones: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      polyhouses: polyhouses.map((ph) => ({
        id: ph.id,
        name: ph.name,
        capacity: ph.capacity,
        zonesCount: ph.zones.length,
        isActive: ph.isActive,
      })),
    });
  } catch (error) {
    console.error('Error fetching polyhouses:', error);
    res.status(500).json({ error: 'Failed to fetch polyhouses' });
  }
};

// GET /api/farms/:id/reservoirs
export const getReservoirs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reservoirs = await prisma.reservoir.findMany({
      where: { farmId: id, isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({
      reservoirs: reservoirs.map((r) => ({
        id: r.id,
        name: r.name,
        capacity: r.capacity,
        currentLevel: r.currentLevel,
        levelPercent: r.capacity ? Math.round((r.currentLevel || 0) / r.capacity * 100) : 0,
        lastRefill: r.lastRefill,
        isActive: r.isActive,
      })),
    });
  } catch (error) {
    console.error('Error fetching reservoirs:', error);
    res.status(500).json({ error: 'Failed to fetch reservoirs' });
  }
};

// GET /api/farms/:id/zones
export const getZones = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const zones = await prisma.zone.findMany({
      where: {
        polyhouse: { farmId: id },
        isActive: true,
      },
      include: {
        polyhouse: {
          select: { name: true },
        },
        sensors: {
          where: { isActive: true },
          select: {
            id: true,
            type: true,
            latestValue: true,
            unit: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      zones: zones.map((z) => ({
        id: z.id,
        name: z.name,
        polyhouse: z.polyhouse.name,
        capacity: z.capacity,
        sensors: z.sensors,
        isActive: z.isActive,
      })),
    });
  } catch (error) {
    console.error('Error fetching zones:', error);
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
};

// GET /api/farms/:id/zones/:zoneId
export const getZoneDetail = async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;

    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        polyhouse: {
          select: { name: true },
        },
        sensors: {
          where: { isActive: true },
        },
        nurseries: {
          where: { isActive: true },
        },
      },
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json(zone);
  } catch (error) {
    console.error('Error fetching zone detail:', error);
    res.status(500).json({ error: 'Failed to fetch zone detail' });
  }
};

// GET /api/farms/:id/users
export const getFarmUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const farmAccess = await prisma.farmAccess.findMany({
      where: { farmId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    res.json({
      users: farmAccess.map((fa) => fa.user),
    });
  } catch (error) {
    console.error('Error fetching farm users:', error);
    res.status(500).json({ error: 'Failed to fetch farm users' });
  }
};

// POST /api/commands
export const createCommand = async (req: Request, res: Response) => {
  try {
    const { farmId, targetType, targetId, action, parameters, requestedBy } = req.body;

    if (!farmId || !targetType || !targetId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const command = await prisma.command.create({
      data: {
        farmId,
        targetType,
        targetId,
        action,
        parameters: parameters || {},
        requestedBy,
        status: 'PENDING',
      },
    });

    // Simulate command execution
    setTimeout(async () => {
      await prisma.command.update({
        where: { id: command.id },
        data: {
          status: 'EXECUTED',
          executedAt: new Date(),
          result: `${action} executed successfully on ${targetType} ${targetId}`,
        },
      });
    }, 1000);

    res.json({
      success: true,
      command,
    });
  } catch (error) {
    console.error('Error creating command:', error);
    res.status(500).json({ error: 'Failed to create command' });
  }
};

// GET /api/commands
export const getCommands = async (req: Request, res: Response) => {
  try {
    const { farmId } = req.query;

    const commands = await prisma.command.findMany({
      where: farmId ? { farmId: farmId as string } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ commands });
  } catch (error) {
    console.error('Error fetching commands:', error);
    res.status(500).json({ error: 'Failed to fetch commands' });
  }
};