import { config } from 'dotenv';
import { z } from 'zod';
import pc from 'picocolors';

// Load .env file
config({ debug: false });

// Define Zod schema for required variables
const requiredEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  API_PORT: z.string().regex(/^\d+$/),
  API_HOST: z.string().min(1),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  REDIS_URL: z.string().startsWith('redis://'),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().min(1),
});

// Define Zod schema for optional variables
const optionalEnvSchema = z.object({
  BUYER_WEB_URL: z.string().optional().or(z.literal('')),
  ADMIN_WEB_URL: z.string().optional().or(z.literal('')),
  POS_WEB_URL: z.string().optional().or(z.literal('')),
  GCS_PROJECT_ID: z.string().optional().or(z.literal('')),
  GCS_BUCKET_NAME: z.string().optional().or(z.literal('')),
  GCS_KEY_FILE: z.string().optional().or(z.literal('')),
  GOOGLE_CLIENT_ID: z.string().optional().or(z.literal('')),
  GOOGLE_CLIENT_SECRET: z.string().optional().or(z.literal('')),
  FACEBOOK_APP_ID: z.string().optional().or(z.literal('')),
  FACEBOOK_APP_SECRET: z.string().optional().or(z.literal('')),
  ECPAY_MERCHANT_ID: z.string().optional().or(z.literal('')),
  ECPAY_HASH_KEY: z.string().optional().or(z.literal('')),
  ECPAY_HASH_IV: z.string().optional().or(z.literal('')),
  ECPAY_API_URL: z.string().optional().or(z.literal('')),
  SEVEN_ELEVEN_API_KEY: z.string().optional().or(z.literal('')),
  FAMILY_MART_API_KEY: z.string().optional().or(z.literal('')),
  SMTP_HOST: z.string().optional().or(z.literal('')),
  SMTP_PORT: z.string().optional().or(z.literal('')),
  SMTP_USER: z.string().optional().or(z.literal('')),
  SMTP_PASSWORD: z.string().optional().or(z.literal('')),
  SENTRY_DSN: z.string().optional().or(z.literal('')),
  LOG_LEVEL: z.string().optional().or(z.literal('')),
});

// Merge schemas for full validation
const envSchema = requiredEnvSchema.merge(optionalEnvSchema);

type Env = z.infer<typeof envSchema>;

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(pc.red('❌ 環境變數驗證失敗:'));
  for (const issue of parsedEnv.error.issues) {
    console.error(pc.red(`  - 變數 ${issue.path.join('.')} 錯誤: ${issue.message}`));
  }
  process.exit(1);
}

console.log(pc.green('✅ 環境變數驗證成功！'));
console.log(pc.cyan('已驗證的變數摘要:'));

const validatedEnv: Env = parsedEnv.data;

// Function to mask sensitive values for display
const maskValue = (key: string, value: string | undefined): string => {
  if (value === undefined || value === '') return pc.gray('(未設定)');
  const sensitiveKeys = ['SECRET', 'PASSWORD', 'KEY', 'DSN'];
  if (sensitiveKeys.some(sk => key.includes(sk)) || key === 'DATABASE_URL' || key === 'REDIS_URL') {
    return pc.yellow('********'); // Mask sensitive info
  }
  return pc.green(value);
};

for (const key of Object.keys(validatedEnv)) {
  const value = validatedEnv[key as keyof Env];
  console.log(`  - ${key}: ${maskValue(key, value)}`);
}
