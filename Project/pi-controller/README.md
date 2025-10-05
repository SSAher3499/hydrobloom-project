# Growloc Pi Controller

Edge computing controller for Raspberry Pi with industrial automation capabilities using Modbus RTU and MQTT.

## Features

- **Modbus RTU Communication**: Read sensors and control actuators via RS485
- **Offline-First Operation**: Autonomous control logic even when internet is down
- **MQTT Cloud Sync**: Publish data to cloud with TLS support
- **Store-and-Forward Queue**: SQLite queue for offline data buffering
- **Multiple Control Strategies**:
  - Threshold-based ON/OFF control
  - PID control loops
  - Scheduled operations (cron)
  - Emergency stop functionality
- **Dynamic Configuration**: JSON-based device and rule configuration
- **Robust Logging**: Winston-based structured logging

## Hardware Requirements

- Raspberry Pi 4B (4GB RAM minimum)
- Waveshare 8-Channel RS485 Relay Module (or compatible Modbus RTU device)
- CH340 USB to RS485 adapter
- Modbus RTU sensors (temperature, humidity, pH, EC, etc.)

## Software Requirements

- Raspberry Pi OS (64-bit recommended)
- Node.js 18+ and npm
- Serial port access (`/dev/ttyUSB0`)

## Installation

### 1. Clone and Install Dependencies

```bash
cd /home/pi
git clone <your-repo-url>
cd growloc-pi-controller
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

Update the following critical values:
- `PI_ID`: Your Raspberry Pi's MAC address or unique ID
- `PI_NAME`: Descriptive name (e.g., "Polyhouse-1-Controller")
- `FARM_ID` and `POLYHOUSE_ID`: IDs from your cloud backend
- `MQTT_BROKER_URL`: Your cloud MQTT broker URL (mqtts://myfarm.com:8883)
- `MQTT_USERNAME` and `MQTT_PASSWORD`: MQTT credentials
- `SERIAL_PORT`: Serial port path (default: /dev/ttyUSB0)

### 3. Configure Devices

Edit `config/devices.json` to match your hardware setup:
- Add your Modbus sensors with correct slave IDs and register addresses
- Add your actuators (relays, motors, valves)

### 4. Configure Control Rules

Edit `config/control-rules.json` to define your automation logic:
- Threshold rules (e.g., turn on fan if temp > 30°C)
- PID rules (e.g., maintain humidity at 80%)
- Scheduled rules (e.g., irrigation at 6 AM)

### 5. Build and Run

```bash
# Build TypeScript
npm run build

# Run in development mode (with auto-reload)
npm run dev

# Run in production mode
npm start
```

## Running as System Service

Use the provided systemd service file to run the controller automatically on boot:

```bash
# Copy service file
sudo cp systemd/growloc-pi-controller.service /etc/systemd/system/

# Edit service file to match your paths
sudo nano /etc/systemd/system/growloc-pi-controller.service

# Enable and start service
sudo systemctl enable growloc-pi-controller
sudo systemctl start growloc-pi-controller

# Check status
sudo systemctl status growloc-pi-controller

# View logs
sudo journalctl -u growloc-pi-controller -f
```

## Configuration Files

### devices.json

Defines your Modbus sensors and actuators:

```json
{
  "sensors": [
    {
      "id": "temp_sensor_1",
      "name": "Zone 1 Temperature",
      "slaveId": 1,
      "registerAddr": 0,
      "registerType": "holding",
      "functionCode": 3,
      "scalingFactor": 0.1,
      "unit": "°C"
    }
  ],
  "actuators": [
    {
      "id": "fan_1",
      "name": "Exhaust Fan 1",
      "slaveId": 1,
      "registerAddr": 0,
      "registerType": "coil",
      "functionCode": 5
    }
  ]
}
```

### control-rules.json

Defines your automation rules:

```json
{
  "rules": [
    {
      "id": "temp_threshold_1",
      "name": "High Temperature Fan Control",
      "type": "THRESHOLD",
      "isActive": true,
      "priority": 80,
      "conditions": {
        "sensorId": "temp_sensor_1",
        "operator": ">",
        "threshold": 30
      },
      "actions": {
        "actuatorId": "fan_1",
        "targetState": 1
      }
    }
  ]
}
```

## MQTT Topics

The controller publishes/subscribes to the following topics:

### Published by Pi:
- `growloc/{PI_ID}/sensors/data` - Sensor readings
- `growloc/{PI_ID}/actuators/{ACTUATOR_ID}/status` - Actuator state changes
- `growloc/{PI_ID}/status` - Heartbeat/status updates

### Subscribed by Pi:
- `growloc/{PI_ID}/commands/#` - All commands
  - `growloc/{PI_ID}/commands/actuator` - Manual actuator control
  - `growloc/{PI_ID}/commands/emergency-stop` - Emergency stop trigger
  - `growloc/{PI_ID}/commands/config-reload` - Reload configuration

## Emergency Stop

Trigger emergency stop by:
1. **MQTT Command**: Publish to `growloc/{PI_ID}/commands/emergency-stop`
2. **Modbus Register**: Write 1 to coil #100 (configurable via `EMERGENCY_STOP_REGISTER`)

Emergency stop will:
- Cut power to all actuators
- Stop all control loops
- Require manual reset via web UI

## Troubleshooting

### Serial Port Permission Denied

```bash
sudo usermod -a -G dialout $USER
# Logout and login again
```

### Check Serial Port

```bash
ls -l /dev/ttyUSB*
# Should show crw-rw---- 1 root dialout ...
```

### Test Modbus Communication

```bash
# Install modbus tools
sudo apt-get install python3-serial
pip3 install pymodbus

# Test read holding register
python3 -c "from pymodbus.client.sync import ModbusSerialClient; client = ModbusSerialClient(method='rtu', port='/dev/ttyUSB0', baudrate=9600); client.connect(); print(client.read_holding_registers(0, 1, unit=1))"
```

## License

MIT
