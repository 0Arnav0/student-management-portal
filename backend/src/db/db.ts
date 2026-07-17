import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// For connection pooling in production, postgres package handles it automatically
export const client = postgres(databaseUrl, {
  max: process.env.NODE_ENV === "production" ? 10 : 2, // limit connections in dev
});

export const db = drizzle(client, { schema });
