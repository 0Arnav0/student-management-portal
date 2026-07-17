import { db } from "../db/db.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/password.js";
import { env } from "../lib/env.js";

export async function ensurePrincipal(): Promise<void> {
  const email = env.PRINCIPAL_EMAIL.toLowerCase().trim();
  const password = env.PRINCIPAL_PASSWORD;

  // Drizzle equivalent for findUnique
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) return;

  const passwordHash = await hashPassword(password);
  
  await db.insert(users).values({
    name: "Principal",
    email,
    passwordHash,
    role: "PRINCIPAL",
    isActive: true,
  });

  console.log(`Seeded initial principal account: ${email}`);
}
