import { Request, Response } from "express";
import { db } from "../db/db.js";
import { users } from "../db/schema.js";
import { eq, asc } from "drizzle-orm";
import { hashPassword } from "../lib/password.js";
import { logActivity } from "../services/activityLog.js";
import { createUserSchema, formatZodError } from "@student-portal/shared";
import { HttpError } from "../middleware/errorHandler.js";

function publicUser(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  };
}

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const allUsers = await db
    .select()
    .from(users)
    .orderBy(asc(users.id));

  res.json(allUsers.map(publicUser));
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(422, "Validation failed", formatZodError(parsed.error));
  }
  const { name, email, password, role } = parsed.data;

  const [exists] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (exists) {
    throw new HttpError(409, "A user with this email already exists");
  }

  const passwordHash = await hashPassword(password); // hash before the transaction

  const user = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role,
        isActive: true,
      })
      .returning();

    await logActivity(tx, {
      entityType: "User",
      action: "CREATE",
      entityId: created.id,
      details: { email, role },
      actor: req.user,
    });

    return created;
  });

  res.status(201).json(publicUser(user));
}

export async function setUserActive(req: Request, res: Response): Promise<void> {
  const id = Number.parseInt(req.params.id, 10);
  const isActive = Boolean(req.body?.isActive);

  if (Number.isNaN(id)) {
    throw new HttpError(400, "Invalid user ID");
  }

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!target) throw new HttpError(404, "User not found");
  
  if (!req.user) {
    throw new HttpError(401, "Not authenticated");
  }

  // Guard against a principal accidentally locking themselves out.
  if (target.id === req.user.id) {
    throw new HttpError(400, "You cannot change your own status");
  }

  const user = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    await logActivity(tx, {
      entityType: "User",
      action: "UPDATE",
      entityId: id,
      details: { isActive },
      actor: req.user,
    });

    return updated;
  });

  res.json(publicUser(user));
}
