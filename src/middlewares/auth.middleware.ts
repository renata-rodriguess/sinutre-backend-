import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.sinutre_token;

  if (!token) {
    return res.status(401).json({ error: 'Sessão não autenticada.' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (typeof payload === 'string' || !payload.sub) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }

    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    }

    req.userId = userId;
    return next();
  } catch {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
}
