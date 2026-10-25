import { z } from 'zod';

const optionalUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.url().optional(),
);

export const configSchema = z.object({
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: optionalUrl,
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
});

export interface AppConfig {
  port: number;
  jwtSecret: string;
  databaseUrl?: string;
  corsOrigin: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = configSchema.parse(env);

  return {
    port: parsed.PORT,
    jwtSecret: parsed.JWT_SECRET,
    ...(parsed.DATABASE_URL ? { databaseUrl: parsed.DATABASE_URL } : {}),
    corsOrigin: parsed.CORS_ORIGIN,
  };
}
