import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(3000),
  APP_BASE_URL: z.url().optional(),

  DATABASE_URL: z
    .url()
    .refine(
      (url) => url.startsWith('postgres://') || url.startsWith('postgresql://'),
      {
        message: 'DATABASE_URL must be a PostgreSQL connection string',
      },
    ),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  EMAIL_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

export function validate(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return `- ${path}: ${issue.message}`;
      })
      .join('\n');

    throw new Error(`Invalid environment configuration:\n\n${errors}\n`);
  }

  return result.data;
}

export type Env = z.infer<typeof envSchema>;
