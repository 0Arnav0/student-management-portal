import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import "dotenv/config";

import path from "node:path";
import { fileURLToPath } from "node:url";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The compiled script is in backend/dist/db/migrate.js
// The migrations are in backend/drizzle/
const migrationsFolder = path.join(__dirname, "..", "..", "drizzle");

const migrationClient = postgres(databaseUrl, { max: 1 });

async function main() {
  console.log("Running migrations...");
  const db = drizzle(migrationClient);
  
  await migrate(db, { migrationsFolder });
  
  console.log("Migrations applied successfully!");
  await migrationClient.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
