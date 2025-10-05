import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@ecofarmlogix.com' },
    update: {},
    create: {
      email: 'demo@ecofarmlogix.com',
      mobile: '+919876543210',
      name: 'Demo Manager',
      role: 'FARM_MANAGER',
      passwordHash,
      onboardingCompleted: true,
      emailVerified: true,
      mobileVerified: true,
      locationLat: 19.7515,
      locationLng: 75.7139,
      address: 'Aurangabad, Maharashtra, India',
    },
  });
  console.log('✅ Created demo user:', demoUser.email);

  // Create demo farm
  const demoFarm = await prisma.farm.upsert({
    where: { id: 'demo-farm-1' },
    update: {},
    create: {
      id: 'demo-farm-1',
      name: 'Demo Farm',
      location: 'Maharashtra, India',
      timezone: 'Asia/Kolkata',
      isActive: true,
    },
  });
  console.log('✅ Created demo farm:', demoFarm.name);

  // Grant farm access to demo user
  await prisma.farmAccess.upsert({
    where: {
      userId_farmId: {
        userId: demoUser.id,
        farmId: demoFarm.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      farmId: demoFarm.id,
    },
  });

  // Create 12 polyhouses
  const polyhouses = [];
  for (let i = 1; i <= 12; i++) {
    const polyhouse = await prisma.polyhouse.upsert({
      where: { id: `poly-${i}` },
      update: {},
      create: {
        id: `poly-${i}`,
        name: `Polyhouse ${i}`,
        farmId: demoFarm.id,
        capacity: 500 + i * 50,
        isActive: true,
      },
    });
    polyhouses.push(polyhouse);
  }
  console.log('✅ Created 12 polyhouses');

  // Create 45 zones (3-4 zones per polyhouse)
  const zones = [];
  let zoneCounter = 1;
  for (const polyhouse of polyhouses) {
    const zonesPerPoly = Math.floor(Math.random() * 2) + 3; // 3-4 zones
    for (let j = 1; j <= zonesPerPoly && zoneCounter <= 45; j++) {
      const zone = await prisma.zone.upsert({
        where: { id: `zone-${zoneCounter}` },
        update: {},
        create: {
          id: `zone-${zoneCounter}`,
          name: `Zone ${zoneCounter}`,
          polyhouseId: polyhouse.id,
          capacity: 100 + j * 20,
          isActive: true,
        },
      });
      zones.push(zone);
      zoneCounter++;
    }
  }
  console.log(`✅ Created ${zones.length} zones`);

  // Create sensors for each zone
  const sensorTypes = [
    { type: 'pH', unit: '', min: 5.5, max: 7.5 },
    { type: 'EC', unit: 'mS/cm', min: 0.8, max: 2.0 },
    { type: 'temperature', unit: '°C', min: 20, max: 35 },
    { type: 'humidity', unit: '%', min: 50, max: 85 },
    { type: 'tank_level', unit: '%', min: 20, max: 100 },
    { type: 'valve_state', unit: '', min: 0, max: 1 },
  ];

  for (const zone of zones) {
    for (const sensorType of sensorTypes) {
      const latestValue = sensorType.type === 'valve_state'
        ? Math.random() > 0.5 ? 1 : 0
        : parseFloat((Math.random() * (sensorType.max - sensorType.min) + sensorType.min).toFixed(2));

      await prisma.sensor.create({
        data: {
          zoneId: zone.id,
          type: sensorType.type,
          name: `${zone.name} ${sensorType.type}`,
          unit: sensorType.unit,
          latestValue,
          lastSeen: new Date(),
          isActive: true,
        },
      });
    }
  }
  console.log('✅ Created sensors for all zones');

  // Create sensor readings (telemetry data)
  const sensors = await prisma.sensor.findMany();
  const now = new Date();
  for (const sensor of sensors.slice(0, 50)) { // Add readings for first 50 sensors
    for (let i = 0; i < 10; i++) {
      const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000); // Every 5 minutes
      const sensorConfig = sensorTypes.find(s => s.type === sensor.type);
      if (sensorConfig) {
        const value = sensor.type === 'valve_state'
          ? Math.random() > 0.5 ? 1 : 0
          : parseFloat((Math.random() * (sensorConfig.max - sensorConfig.min) + sensorConfig.min).toFixed(2));

        await prisma.sensorReading.create({
          data: {
            sensorId: sensor.id,
            value,
            timestamp,
          },
        });
      }
    }
  }
  console.log('✅ Created telemetry data');

  // Create 8 reservoirs
  for (let i = 1; i <= 8; i++) {
    await prisma.reservoir.upsert({
      where: { id: `reservoir-${i}` },
      update: {},
      create: {
        id: `reservoir-${i}`,
        name: `Reservoir ${i}`,
        farmId: demoFarm.id,
        capacity: 5000 + i * 1000,
        currentLevel: 3000 + Math.random() * 2000,
        lastRefill: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });
  }
  console.log('✅ Created 8 reservoirs');

  // Create 20 inventory items
  const inventoryCategories = [
    { name: 'Seeds - Tomato', category: 'Seeds', unit: 'kg', stock: 50, cost: 500 },
    { name: 'Seeds - Cucumber', category: 'Seeds', unit: 'kg', stock: 30, cost: 450 },
    { name: 'Seeds - Bell Pepper', category: 'Seeds', unit: 'kg', stock: 25, cost: 600 },
    { name: 'Fertilizer - NPK', category: 'Fertilizer', unit: 'kg', stock: 200, cost: 80 },
    { name: 'Fertilizer - Urea', category: 'Fertilizer', unit: 'kg', stock: 150, cost: 50 },
    { name: 'Pesticide - Organic', category: 'Pesticide', unit: 'L', stock: 40, cost: 300 },
    { name: 'Growth Medium - Coco Peat', category: 'Media', unit: 'kg', stock: 500, cost: 30 },
    { name: 'Grow Bags - Large', category: 'Equipment', unit: 'pcs', stock: 1000, cost: 15 },
    { name: 'Drip Lines', category: 'Equipment', unit: 'm', stock: 2000, cost: 10 },
    { name: 'pH Adjuster - Up', category: 'Chemicals', unit: 'L', stock: 20, cost: 200 },
    { name: 'pH Adjuster - Down', category: 'Chemicals', unit: 'L', stock: 15, cost: 200 },
    { name: 'Calcium Nitrate', category: 'Fertilizer', unit: 'kg', stock: 100, cost: 120 },
    { name: 'Magnesium Sulfate', category: 'Fertilizer', unit: 'kg', stock: 80, cost: 90 },
    { name: 'Micronutrient Mix', category: 'Fertilizer', unit: 'kg', stock: 50, cost: 250 },
    { name: 'Shade Net 50%', category: 'Equipment', unit: 'm²', stock: 500, cost: 50 },
    { name: 'Trellis Net', category: 'Equipment', unit: 'm', stock: 800, cost: 25 },
    { name: 'Pruning Shears', category: 'Tools', unit: 'pcs', stock: 30, cost: 150 },
    { name: 'Spray Bottles', category: 'Tools', unit: 'pcs', stock: 50, cost: 50 },
    { name: 'Harvesting Crates', category: 'Equipment', unit: 'pcs', stock: 200, cost: 100 },
    { name: 'Mulch Film', category: 'Equipment', unit: 'kg', stock: 150, cost: 80 },
  ];

  for (let i = 0; i < inventoryCategories.length; i++) {
    const item = inventoryCategories[i];
    await prisma.inventoryItem.upsert({
      where: { id: `inv-${i + 1}` },
      update: {},
      create: {
        id: `inv-${i + 1}`,
        name: item.name,
        farmId: demoFarm.id,
        category: item.category,
        currentStock: item.stock,
        unit: item.unit,
        costPerUnit: item.cost,
        lowStockAlert: item.stock * 0.2,
        isActive: true,
      },
    });
  }
  console.log('✅ Created 20 inventory items');

  // Create 15 tasks (some overdue)
  const taskTitles = [
    'Check irrigation system in Zone 1',
    'Apply fertilizer to Polyhouse 3',
    'Harvest tomatoes from Zone 12',
    'Clean reservoir filters',
    'Inspect pH levels in all zones',
    'Replace damaged drip lines',
    'Prune cucumber plants',
    'Check for pests in Polyhouse 7',
    'Refill nutrient solution',
    'Calibrate pH sensors',
    'Train new plants on trellis',
    'Monitor temperature in Zone 20',
    'Update inventory records',
    'Sanitize harvesting equipment',
    'Review weekly production report',
  ];

  const now2 = new Date();
  for (let i = 0; i < taskTitles.length; i++) {
    const isOverdue = i < 5; // First 5 tasks are overdue
    const dueDate = isOverdue
      ? new Date(now2.getTime() - (Math.random() * 5 + 1) * 24 * 60 * 60 * 1000)
      : new Date(now2.getTime() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000);

    await prisma.task.create({
      data: {
        title: taskTitles[i],
        description: `Task description for: ${taskTitles[i]}`,
        status: isOverdue ? 'OPEN' : (Math.random() > 0.5 ? 'OPEN' : 'IN_PROGRESS'),
        priority: isOverdue ? 'HIGH' : (Math.random() > 0.5 ? 'MEDIUM' : 'LOW'),
        category: ['Maintenance', 'Harvesting', 'Monitoring', 'Operations'][Math.floor(Math.random() * 4)],
        assigneeId: demoUser.id,
        polyhouseId: polyhouses[Math.floor(Math.random() * polyhouses.length)].id,
        zoneId: zones[Math.floor(Math.random() * zones.length)].id,
        dueDate,
        isRecurring: Math.random() > 0.7,
      },
    });
  }
  console.log('✅ Created 15 tasks');

  // Create 3 active alerts
  const alertMessages = [
    { title: 'High pH Level', message: 'pH level in Zone 5 is above optimal range (7.8)', severity: 'HIGH' as const },
    { title: 'Low Tank Level', message: 'Reservoir 3 tank level below 20%', severity: 'CRITICAL' as const },
    { title: 'Temperature Alert', message: 'Temperature in Polyhouse 8 exceeds 35°C', severity: 'MEDIUM' as const },
  ];

  for (const alert of alertMessages) {
    await prisma.alert.create({
      data: {
        farmId: demoFarm.id,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        source: 'System',
        isAcknowledged: false,
        isResolved: false,
      },
    });
  }
  console.log('✅ Created 3 active alerts');

  // Create some nurseries
  for (let i = 1; i <= 10; i++) {
    await prisma.nursery.create({
      data: {
        name: `Nursery ${i}`,
        zoneId: zones[Math.floor(Math.random() * zones.length)].id,
        capacity: 1000 + i * 100,
        isActive: true,
      },
    });
  }
  console.log('✅ Created 10 nurseries');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });