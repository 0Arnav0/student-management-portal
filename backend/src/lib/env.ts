import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL must be provided"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be a strong random string (min 16 chars)"),
  PRINCIPAL_EMAIL: z.string().email("PRINCIPAL_EMAIL must be a valid email"),
  PRINCIPAL_PASSWORD: z.string().min(6, "PRINCIPAL_PASSWORD must be at least 6 characters"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  CLOUDINARY_URL: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
