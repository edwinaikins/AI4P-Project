import { Router } from 'express';
import { analyseCreativity } from '../controllers/analyse.controller.js';

const router = Router();

router.post('/analysecreativity', analyseCreativity);

export default router;
