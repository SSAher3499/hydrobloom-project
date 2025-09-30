-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FARM_MANAGER',
    "languagePref" TEXT NOT NULL DEFAULT 'en',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "passwordHash" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "locationLat" REAL,
    "locationLng" REAL,
    "locationPlaceId" TEXT,
    "address" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "mobileVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "farm_access" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "farm_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "farm_access_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "polyhouses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "polyhouses_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "polyhouseId" TEXT NOT NULL,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "zones_polyhouseId_fkey" FOREIGN KEY ("polyhouseId") REFERENCES "polyhouses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "nurseries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "nurseries_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cropType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "template_stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "expectedDurationDays" INTEGER NOT NULL,
    "description" TEXT,
    "expectedQuantity" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "template_stages_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lifecycles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "polyhouseId" TEXT,
    "zoneId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "expectedStartDate" DATETIME,
    "actualStartDate" DATETIME,
    "expectedEndDate" DATETIME,
    "actualEndDate" DATETIME,
    "totalQuantity" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lifecycles_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "lifecycles_polyhouseId_fkey" FOREIGN KEY ("polyhouseId") REFERENCES "polyhouses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "lifecycles_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lifecycle_stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lifecycleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "expectedDurationDays" INTEGER NOT NULL,
    "actualStartDate" DATETIME,
    "actualEndDate" DATETIME,
    "expectedQuantity" INTEGER,
    "inboundQuantity" INTEGER NOT NULL DEFAULT 0,
    "outboundQuantity" INTEGER NOT NULL DEFAULT 0,
    "mortalityCount" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "lifecycle_stages_lifecycleId_fkey" FOREIGN KEY ("lifecycleId") REFERENCES "lifecycles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "assigneeId" TEXT,
    "polyhouseId" TEXT,
    "zoneId" TEXT,
    "dueDate" DATETIME,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringType" TEXT,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_polyhouseId_fkey" FOREIGN KEY ("polyhouseId") REFERENCES "polyhouses" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sensors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "zoneId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "latestValue" REAL,
    "unit" TEXT,
    "lastSeen" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sensors_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sensorId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sensor_readings_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "sensors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alert_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "repeatsIn" INTEGER NOT NULL,
    "repeatUnit" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB NOT NULL,
    "channels" TEXT,
    "lastTriggered" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "alert_configs_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alert_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertConfigId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alert_subscriptions_alertConfigId_fkey" FOREIGN KEY ("alertConfigId") REFERENCES "alert_configs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "alert_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reservoirs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "capacity" REAL,
    "currentLevel" REAL,
    "lastRefill" DATETIME,
    "treatHistory" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reservoirs_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "category" TEXT,
    "currentStock" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "costPerUnit" REAL,
    "lowStockAlert" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "inventory_items_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryItemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitCost" REAL,
    "totalCost" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_transactions_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "controllerMacid" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assets_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "mobile" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "languagePref" TEXT NOT NULL DEFAULT 'en',
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invites_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "otp_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contact" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "farm_access_userId_farmId_key" ON "farm_access"("userId", "farmId");

-- CreateIndex
CREATE UNIQUE INDEX "alert_subscriptions_alertConfigId_userId_key" ON "alert_subscriptions"("alertConfigId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "assets_controllerMacid_key" ON "assets"("controllerMacid");

-- CreateIndex
CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");
