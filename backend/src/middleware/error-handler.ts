import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../errors/app-error.js';

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  void _next;

  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Validation failed',
      details: error.issues,
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.status).json({
      error: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    });
    return;
  }

  response.status(500).json({ error: 'Internal Server Error' });
};
