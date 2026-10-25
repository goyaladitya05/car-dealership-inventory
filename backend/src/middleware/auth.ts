import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import type { AppConfig } from '../config.js';
import { AppError } from '../errors/app-error.js';

type Role = 'user' | 'admin';

function isRole(value: unknown): value is Role {
  return value === 'user' || value === 'admin';
}

export const authenticate: RequestHandler = (request, _response, next) => {
  const match = /^Bearer (.+)$/.exec(request.header('Authorization') ?? '');

  if (!match?.[1]) {
    next(new AppError(401, 'Unauthorized'));
    return;
  }

  try {
    const config = request.app.locals.config as AppConfig;
    const payload = jwt.verify(match[1], config.jwtSecret);

    if (
      typeof payload === 'string' ||
      typeof payload.sub !== 'string' ||
      !isRole(payload.role)
    ) {
      throw new Error('Invalid token payload');
    }

    request.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'Unauthorized'));
  }
};

export function requireRole(role: Role): RequestHandler {
  return (request, _response, next) => {
    if (request.user?.role !== role) {
      next(new AppError(403, 'Forbidden'));
      return;
    }

    next();
  };
}
