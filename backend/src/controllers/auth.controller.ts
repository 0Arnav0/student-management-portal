import { Request, Response } from "express";
import { db } from "../db/db.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../lib/password.js";
import { signToken } from "../lib/token.js";
import { logAuthEvent } from "../services/authLog.js";
import { HttpError } from "../middleware/errorHandler.js";
import { loginSchema, formatZodError } from "@student-portal/shared";
import { env } from "../lib/env.js";

const COOKIE_NAME = "token";

function cookieOptions() {
  return {
    httpOnly: true,                                   // JS can't read it (XSS-safe)
    secure: env.NODE_ENV === "production",            // HTTPS-only in prod
    sameSite: "strict" as const,                      // CSRF-safe
    maxAge: 7 * 24 * 60 * 60 * 1000,                  // 7 days, matches token expiry
  };
}

function publicUser(user: any) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = loginSchema.safeParse(req.body);
  
  if (!result.success) {
    throw new HttpError(422, "Validation failed", formatZodError(result.error));
  }

  const { email, password } = result.data;

  // Drizzle equivalent for findUnique
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const ok = user && user.isActive && (await verifyPassword(password, user.passwordHash));

  if (!ok) {
    await logAuthEvent(db, { userId: user?.id, email, event: "LOGIN_FAILED", req });
    throw new HttpError(401, "Invalid email or password");
  }

  // Sign token using verified types
  const token = signToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  res.cookie(COOKIE_NAME, token, cookieOptions());

  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  await logAuthEvent(db, { userId: user.id, email: user.email, event: "LOGIN", req });

  res.json(publicUser(user));
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, "Not authenticated");
  }
  
  res.clearCookie(COOKIE_NAME, cookieOptions());
  
  await logAuthEvent(db, {
    userId: req.user.id,
    email: req.user.email,
    event: "LOGOUT",
    req,
  });
  
  res.json({ message: "Logged out" });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, "Not authenticated");
  }
  res.json(req.user);
}
