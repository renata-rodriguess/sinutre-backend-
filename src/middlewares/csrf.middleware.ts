import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

const allowedOrigins = new Set([
  env.frontendUrl,
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
]);

export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.get('origin');
  const referer = req.get('referer');

  let requestOrigin = origin;

  if (!requestOrigin && referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch {
      return res.status(403).json({
        error: 'Requisição bloqueada por proteção CSRF.',
      });
    }
  }

  if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
    return res.status(403).json({
      error: 'Requisição bloqueada por proteção CSRF.',
    });
  }

  return next();
}
