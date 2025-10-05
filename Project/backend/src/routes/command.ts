import { Router } from 'express';
import * as farmController from '../controllers/farmController';

const router = Router();

router.post('/', farmController.createCommand);
router.get('/', farmController.getCommands);

export default router;