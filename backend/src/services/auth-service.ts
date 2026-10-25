import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import type { AppConfig } from '../config.js';
import { AppError } from '../errors/app-error.js';
import type { User, UserRepository } from '../repositories/user-repository.js';

export interface AuthResult {
  token: string;
  user: Pick<User, 'id' | 'email' | 'role'>;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly config: AppConfig,
  ) {}

  async register(email: string, password: string): Promise<AuthResult> {
    if (await this.users.findByEmail(email)) {
      throw new AppError(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.users.create(email, passwordHash);

    return this.createAuthResult(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, 'Invalid email or password');
    }

    return this.createAuthResult(user);
  }

  private createAuthResult(user: User): AuthResult {
    const token = jwt.sign(
      { role: user.role },
      this.config.jwtSecret,
      { subject: user.id, expiresIn: '1d' },
    );

    return {
      token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
