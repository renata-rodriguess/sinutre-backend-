import { Router } from 'express';
import { WaterController } from '../controllers/WaterController';
import { requireAuth } from '../middlewares/auth.middleware';

const waterRouter = Router();
const waterController = new WaterController();

waterRouter.use(requireAuth);

waterRouter.post('/', waterController.create);
waterRouter.get('/', waterController.getToday);

export { waterRouter };