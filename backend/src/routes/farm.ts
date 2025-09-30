import { Router } from 'express';
import * as farmController from '../controllers/farmController';

const router = Router();

// Farm summary and data endpoints
router.get('/:id/summary', farmController.getFarmSummary);
router.get('/:id/latest-telemetry', farmController.getLatestTelemetry);
router.get('/:id/weather', farmController.getWeather);
router.get('/:id/inventory/summary', farmController.getInventorySummary);
router.get('/:id/tasks/summary', farmController.getTasksSummary);
router.get('/:id/alerts/summary', farmController.getAlertsSummary);
router.get('/:id/polyhouses', farmController.getPolyhouses);
router.get('/:id/reservoirs', farmController.getReservoirs);
router.get('/:id/zones', farmController.getZones);
router.get('/:id/zones/:zoneId', farmController.getZoneDetail);
router.get('/:id/users', farmController.getFarmUsers);

export default router;