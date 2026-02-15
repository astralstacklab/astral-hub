import 'dotenv/config'
import { z } from 'zod/v4'

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  API_PORT: z.coerce.number().default(3000),
  API_HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ECPAY_HASH_KEY: z.string().default('5294y06JbISpM5x9'),
  ECPAY_HASH_IV: z.string().default('v77hoKGq4kWxNNIS'),
})

export type Config = z.infer<typeof configSchema>

export const config: Config = configSchema.parse(process.env)
