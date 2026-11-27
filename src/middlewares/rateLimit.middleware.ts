import rateLimit from 'express-rate-limit';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
  },
});

export const authRateLimit = rateLimit({
  windowMs: isDevelopment ? 60 * 1000 : 15 * 60 * 1000,
  limit: isDevelopment ? 100 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Muitas tentativas de autenticação. Tente novamente em alguns minutos.',
  },
});