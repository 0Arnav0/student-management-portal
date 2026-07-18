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

  const passwordHash = await hashPassword(password);

  if (existing) {
    // If the principal exists, update the password hash to sync with env variables
    await db
      .update(users)
      .set({ passwordHash, name: "Principal", role: "PRINCIPAL", isActive: true })
      .where(eq(users.email, email));
    console.log(`Principal credentials verified and updated: ${email}`);
    return;
  }
  
  await db.insert(users).values({
    name: "Principal",
    email,
    passwordHash,
    role: "PRINCIPAL",
    isActive: true,
  });

  console.log(`Seeded initial principal account: ${email}`);
}
