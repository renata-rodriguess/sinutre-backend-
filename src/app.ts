import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { authRoutes } from './routes/auth.routes';
import { mealsRoutes } from './routes/meals.routes';
import { foodRouter } from './routes/food.routes';
import { healthRoutes } from './routes/health.routes';
import { metricsRoutes } from './routes/metrics.routes';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware';
import { waterRouter } from './routes/water.routes';
import { workoutRouter } from './routes/workout.routes';
import { csrfProtection } from './middlewares/csrf.middleware';
import { apiRateLimit, authRateLimit } from './middlewares/rateLimit.middleware';

export const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [
    env.frontendUrl,
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177'
  ],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(csrfProtection);
app.use(apiRateLimit);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth', authRateLimit, authRoutes);
app.use('/meals', mealsRoutes);
app.use('/foods', foodRouter);
app.use('/health-data', healthRoutes);
app.use('/metrics', metricsRoutes);
app.use('/water', waterRouter);
app.use('/workouts', workoutRouter);

app.use(notFoundHandler);
app.use(errorHandler);
