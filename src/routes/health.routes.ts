import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const healthRoutes = Router();
const healthController = new HealthController();

healthRoutes.get('/health', (req, res) => healthController.getHealth(req, res));
healthRoutes.post('/health', (req, res) => healthController.saveHealthData(req, res));

export { healthRoutes };
export default healthRoutes;