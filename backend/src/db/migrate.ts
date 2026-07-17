import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

const migrationClient = postgres(databaseUrl, { max: 1 });

async function main() {
  console.log("Running migrations...");
  const db = drizzle(migrationClient);
  
  await migrate(db, { migrationsFolder: "./drizzle" });
  
  console.log("Migrations applied successfully!");
  await migrationClient.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
