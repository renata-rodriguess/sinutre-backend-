import { Router } from 'express';
import { WorkoutController } from '../controllers/WorkoutController';
import { requireAuth } from '../middlewares/auth.middleware';

const workoutRouter = Router();
const workoutController = new WorkoutController();

workoutRouter.use(requireAuth);

workoutRouter.get('/', workoutController.getToday);
workoutRouter.post('/', workoutController.toggle);

export { workoutRouter };