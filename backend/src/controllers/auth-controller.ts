import type { RequestHandler } from 'express';
import { z } from 'zod';

import type { AuthService } from '../services/auth-service.js';

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register: RequestHandler = async (request, response, next) => {
    try {
      const credentials = credentialsSchema.parse(request.body);
      const result = await this.authService.register(
        credentials.email,
        credentials.password,
      );

      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };
}
