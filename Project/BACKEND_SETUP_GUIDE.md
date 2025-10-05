# Backend Setup Guide - Growloc IoT Integration

## 🎉 What's New in the Backend

The backend has been fully upgraded with IoT industrial automation capabilities:

### ✅ New Features Added

1. **MQTT Ingestion Service** (`src/services/mqttIngestionService.ts`)
   - Subscribes to Pi sensor data, actuator status, and heartbeats
   - Saves sensor readings to PostgreSQL database
   - Updates Pi status (online/offline)
   - Broadcasts real-time updates via Socket.io

2. **Complete IoT REST API** (`src/routes/iot.ts`)
   - Raspberry Pi management (CRUD)
   - Sensor management with Modbus configuration
   - Actuator management and manual control
   - Control rules (threshold, PID, scheduled)
   - Emergency stop endpoint
   - Historical sensor data queries

3. **Enhanced Socket.io**
   - Real-time sensor updates
   - Real-time actuator state changes
   - Pi status updates (online/offline)
   - Initial IoT data on subscribe

4. **Database Schema**
   - PostgreSQL with TimescaleDB for time-series optimization
   - New models: RaspberryPi, ModbusActuator, ControlRule
   - Extended Sensor model with Modbus fields
   - Indexed queries for performance

---

## 📦 Setup Steps

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install the new MQTT dependencies:
- `mqtt` (v5.3.5) - MQTT client
- `node-cron` (v3.0.3) - For scheduled tasks

### 2. Update Environment Variables

Update your `.env` file with MQTT configuration:

```bash
# Copy example if you haven't already
cp .env.example .env

# Edit .env and add MQTT settings:
nano .env
```

Add these lines (they're already in `.env.example`):

```env
# MQTT Broker Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_BROKER_URL_TLS=mqtts://myfarm.com:8883
MQTT_USERNAME=growloc_mqtt
MQTT_PASSWORD=change_this_in_production
MQTT_CLIENT_ID=growloc-backend

# MQTT Topics
MQTT_TOPIC_SENSOR_DATA=growloc/+/sensors/+/data
MQTT_TOPIC_ACTUATOR_COMMAND=growloc/+/actuators/+/command
MQTT_TOPIC_ACTUATOR_STATUS=growloc/+/actuators/+/status
MQTT_TOPIC_PI_STATUS=growloc/+/status

# Data Retention (days)
SENSOR_DATA_RETENTION_DAYS=30
AGGREGATED_DATA_RETENTION_DAYS=365
```

**Important**: Update your `DATABASE_URL` to use PostgreSQL:

```env
# Local development
DATABASE_URL="postgresql://growloc_user:growloc_password@localhost:5432/growloc_db?schema=public"

# Docker
DATABASE_URL="postgresql://growloc_user:growloc_password@postgres:5432/growloc_db?schema=public"
```

### 3. Start Docker Services (Local Development)

```bash
# From Project directory
docker-compose up -d
```

This starts:
- PostgreSQL 15 + TimescaleDB
- Mosquitto MQTT Broker
- Redis
- MailHog (for email testing)

Verify services are running:

```bash
docker-compose ps
```

### 4. Run Prisma Migrations

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Create and run migration
npx prisma migrate dev --name add_iot_models

# This will:
# - Switch from SQLite to PostgreSQL
# - Add RaspberryPi, ModbusActuator, ControlRule models
# - Add Modbus fields to Sensor model
# - Create indexes for time-series queries
```

### 5. Enable TimescaleDB Hypertable (IMPORTANT!)

After migrations, run these SQL commands to enable TimescaleDB features:

```bash
# Connect to database
psql postgresql://growloc_user:growloc_password@localhost:5432/growloc_db

# Or via Docker:
docker exec -it project-postgres-1 psql -U growloc_user -d growloc_db
```

Run this SQL:

```sql
-- Enable TimescaleDB extension (if not already done)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert sensor_readings to hypertable
SELECT create_hypertable('sensor_readings', 'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS sensor_readings_sensor_timestamp_idx
    ON sensor_readings ("sensorId", timestamp DESC);

-- Add retention policy (30 days for raw data)
SELECT add_retention_policy('sensor_readings', INTERVAL '30 days', if_not_exists => TRUE);

-- Create continuous aggregates for hourly data
CREATE MATERIALIZED VIEW IF NOT EXISTS sensor_readings_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', timestamp) AS hour,
    "sensorId",
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    COUNT(*) AS num_readings
FROM sensor_readings
GROUP BY hour, "sensorId"
WITH NO DATA;

-- Refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('sensor_readings_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Retention for aggregated data (1 year)
SELECT add_retention_policy('sensor_readings_hourly', INTERVAL '365 days', if_not_exists => TRUE);

\q
```

### 6. Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

You should see:

```
🌱 Growloc API server running on port 5000
📊 Health check available at: http://localhost:5000/api/health
🔌 Socket.IO server ready for connections
📡 Connecting to MQTT broker: mqtt://localhost:1883
✅ MQTT Ingestion Service connected to broker
📥 Subscribed to: growloc/+/sensors/data
📥 Subscribed to: growloc/+/actuators/+/status
📥 Subscribed to: growloc/+/status
✅ MQTT Ingestion Service started
```

---

## 🧪 Testing the Backend

### 1. Health Check

```bash
curl http://localhost:5000/api/health
```

### 2. Test MQTT Connection

```bash
# Publish test message (simulating a Pi)
docker exec -it project-mosquitto-1 \
  mosquitto_pub -t "growloc/test_pi/status" \
  -m '{"piId":"test_pi","name":"Test Pi","status":"ONLINE","timestamp":"2025-01-04T12:00:00Z"}'

# Check backend logs - you should see:
# 📡 Pi Test Pi status: ONLINE
```

### 3. Test API Endpoints

#### Register a Raspberry Pi

```bash
curl -X POST http://localhost:5000/api/iot/pis \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Polyhouse-1-Controller",
    "macAddress": "b8:27:eb:12:34:56",
    "ipAddress": "192.168.1.100",
    "farmId": "your_farm_id_here"
  }'
```

#### List All Pis

```bash
curl http://localhost:5000/api/iot/pis
```

#### Add a Sensor to Pi

```bash
curl -X POST http://localhost:5000/api/iot/pis/PI_ID_HERE/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Temperature Sensor 1",
    "type": "temperature",
    "zoneId": "your_zone_id",
    "unit": "°C",
    "modbusSlaveId": 1,
    "modbusRegisterAddr": 0,
    "modbusRegisterType": "holding",
    "modbusFunctionCode": 3,
    "scalingFactor": 0.1
  }'
```

#### Control an Actuator

```bash
curl -X POST http://localhost:5000/api/iot/actuators/ACTUATOR_ID/command \
  -H "Content-Type: application/json" \
  -d '{"state": 1}'

# This sends MQTT command to the Pi
```

#### Emergency Stop

```bash
curl -X POST http://localhost:5000/api/iot/pis/PI_ID/emergency-stop
```

### 4. Test Socket.io Real-Time Updates

Create a test file `test-socket.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Socket.io Test</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Socket.io IoT Test</h1>
  <div id="status">Connecting...</div>
  <div id="data"></div>

  <script>
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      document.getElementById('status').innerText = 'Connected!';

      // Subscribe to farm updates
      socket.emit('subscribe', { farmId: 'your_farm_id_here' });
    });

    socket.on('initial-iot-data', (data) => {
      console.log('Initial IoT data:', data);
      document.getElementById('data').innerHTML =
        '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    });

    socket.on('sensor-update', (data) => {
      console.log('Sensor update:', data);
    });

    socket.on('actuator-update', (data) => {
      console.log('Actuator update:', data);
    });

    socket.on('pi-status-update', (data) => {
      console.log('Pi status update:', data);
    });
  </script>
</body>
</html>
```

Open in browser and check console.

---

## 🔌 API Endpoints Reference

### Raspberry Pi Management

- `GET /api/iot/pis` - List all Pis (optionally filter by farmId)
- `GET /api/iot/pis/:id` - Get Pi details with sensors, actuators, rules
- `POST /api/iot/pis` - Register new Pi
- `PUT /api/iot/pis/:id` - Update Pi configuration
- `DELETE /api/iot/pis/:id` - Delete Pi (soft delete)

### Sensor Management

- `POST /api/iot/pis/:piId/sensors` - Add sensor to Pi
- `PUT /api/iot/sensors/:id` - Update sensor configuration
- `DELETE /api/iot/sensors/:id` - Delete sensor
- `GET /api/iot/sensors/:id/readings` - Get historical readings
  - Query params: `startDate`, `endDate`, `limit` (default 1000)

### Actuator Management

- `POST /api/iot/pis/:piId/actuators` - Add actuator to Pi
- `PUT /api/iot/actuators/:id` - Update actuator configuration
- `DELETE /api/iot/actuators/:id` - Delete actuator
- `POST /api/iot/actuators/:id/command` - Send manual control command
  - Body: `{ "state": 0 | 1 | 0-100 }`

### Control Rules

- `GET /api/iot/pis/:piId/rules` - Get all rules for Pi
- `POST /api/iot/pis/:piId/rules` - Create control rule
- `PUT /api/iot/rules/:id` - Update rule
- `DELETE /api/iot/rules/:id` - Delete rule

### Emergency Control

- `POST /api/iot/pis/:piId/emergency-stop` - Trigger emergency stop

---

## 📊 Socket.io Events

### Client → Server

- `subscribe` - Subscribe to farm updates
  ```javascript
  socket.emit('subscribe', { farmId: 'farm_id' });
  ```

### Server → Client

- `initial-iot-data` - Sent on subscribe (sensors, actuators, Pis)
- `sensor-update` - Real-time sensor value update
  ```javascript
  { sensorId, value, timestamp, type, unit, zoneId }
  ```
- `actuator-update` - Actuator state change
  ```javascript
  { actuatorId, name, type, state, timestamp }
  ```
- `pi-status-update` - Pi online/offline status
  ```javascript
  { piId, name, status, timestamp }
  ```

---

## 🐛 Troubleshooting

### MQTT Service Won't Start

**Error**: `Failed to start MQTT service`

**Solutions**:
1. Check Mosquitto is running:
   ```bash
   docker-compose ps mosquitto
   ```

2. Test MQTT broker:
   ```bash
   mosquitto_sub -h localhost -p 1883 -t "test" -v
   ```

3. Check `MQTT_BROKER_URL` in `.env`

### Database Connection Failed

**Error**: `Can't reach database server`

**Solutions**:
1. Check PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   ```

2. Verify `DATABASE_URL` in `.env`

3. Test connection:
   ```bash
   psql postgresql://growloc_user:growloc_password@localhost:5432/growloc_db
   ```

### Prisma Migration Fails

**Error**: `P3009: Failed to create database`

**Solution**:
1. Manually create database:
   ```bash
   docker exec -it project-postgres-1 psql -U postgres
   CREATE DATABASE growloc_db;
   CREATE USER growloc_user WITH PASSWORD 'growloc_password';
   GRANT ALL PRIVILEGES ON DATABASE growloc_db TO growloc_user;
   \q
   ```

2. Re-run migrations:
   ```bash
   npx prisma migrate dev
   ```

---

## 🚀 Production Deployment

### 1. Environment Variables

Update for production:

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@your-db-host:5432/growloc_db"
MQTT_BROKER_URL=mqtts://myfarm.com:8883
MQTT_USERNAME=production_user
MQTT_PASSWORD=strong_random_password_here
JWT_SECRET=your_production_jwt_secret
```

### 2. Enable MQTT TLS

Edit `backend/mosquitto/mosquitto.conf`:

```conf
# Uncomment TLS listener
listener 8883
protocol mqtt
cafile /mosquitto/certs/ca.crt
certfile /mosquitto/certs/server.crt
keyfile /mosquitto/certs/server.key
require_certificate false

# Enable authentication
allow_anonymous false
password_file /mosquitto/config/passwd
```

Generate MQTT password:

```bash
mosquitto_passwd -c backend/mosquitto/passwd growloc_mqtt
```

### 3. Deploy with PM2

```bash
npm run build
pm2 start dist/index.js --name growloc-backend
pm2 save
pm2 startup
```

---

## 📖 Next Steps

1. **Run migrations** and enable TimescaleDB
2. **Start backend** and verify MQTT connection
3. **Test API endpoints** with curl or Postman
4. **Connect your first Pi** using the pi-controller
5. **Build frontend IoT pages** (monitoring, Pi management, rules)

---

## 🎓 Example: Complete Pi Setup Flow

```bash
# 1. Register Pi
PI_ID=$(curl -s -X POST http://localhost:5000/api/iot/pis \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Polyhouse-1",
    "macAddress": "b8:27:eb:11:22:33",
    "farmId": "'"$FARM_ID"'"
  }' | jq -r '.pi.id')

# 2. Add temperature sensor
SENSOR_ID=$(curl -s -X POST http://localhost:5000/api/iot/pis/$PI_ID/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Temp Sensor 1",
    "type": "temperature",
    "zoneId": "'"$ZONE_ID"'",
    "unit": "°C",
    "modbusSlaveId": 1,
    "modbusRegisterAddr": 0,
    "modbusRegisterType": "holding",
    "modbusFunctionCode": 3,
    "scalingFactor": 0.1
  }' | jq -r '.sensor.id')

# 3. Add fan actuator
ACTUATOR_ID=$(curl -s -X POST http://localhost:5000/api/iot/pis/$PI_ID/actuators \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Exhaust Fan",
    "type": "FAN",
    "zoneId": "'"$ZONE_ID"'",
    "modbusSlaveId": 1,
    "modbusRegisterAddr": 0,
    "modbusRegisterType": "coil",
    "modbusFunctionCode": 5
  }' | jq -r '.actuator.id')

# 4. Create threshold rule (turn on fan if temp > 30°C)
curl -X POST http://localhost:5000/api/iot/pis/$PI_ID/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Temp Fan Control",
    "ruleType": "THRESHOLD",
    "priority": 80,
    "conditions": {
      "sensorId": "'"$SENSOR_ID"'",
      "operator": ">",
      "threshold": 30
    },
    "actions": {
      "actuatorId": "'"$ACTUATOR_ID"'",
      "targetState": 1
    },
    "actuatorId": "'"$ACTUATOR_ID"'"
  }'

echo "Setup complete! Pi ID: $PI_ID"
```

---

**Backend is now fully operational! 🎉**

Continue with frontend development or deploy your first Raspberry Pi controller.
