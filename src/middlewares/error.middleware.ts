import { Request, Response, NextFunction } from 'express';

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  return res.status(404).json({
    error: 'Rota não encontrada.',
    path: req.originalUrl,
  });
}

export function errorHandler(
  err: Error & {
    status?: number;
    statusCode?: number;
    type?: string;
  },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('ERRO INTERNO SI NUTRE:', err);

  if (res.headersSent) {
    return;
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'O formato do JSON enviado é inválido.',
    });
  }

  const status = err.statusCode ?? err.status ?? 500;

  if (status >= 400 && status < 500) {
    return res.status(status).json({
      error: 'Não foi possível processar a solicitação.',
    });
  }

  return res.status(500).json({
    error: 'Ocorreu um erro interno no servidor.',
  });
}
