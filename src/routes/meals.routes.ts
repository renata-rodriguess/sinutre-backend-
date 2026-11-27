import { Router } from 'express';
import {
  createMeal,
  meals,
  dailySummary,
  deleteMeal,
} from '../controllers/meals.controller';
import { requireAuth } from '../middlewares/auth.middleware';

export const mealsRoutes = Router();

mealsRoutes.get('/daily-summary', requireAuth, dailySummary);
mealsRoutes.post('/', requireAuth, createMeal);
mealsRoutes.get('/', requireAuth, meals);
mealsRoutes.delete('/:id', requireAuth, deleteMeal);