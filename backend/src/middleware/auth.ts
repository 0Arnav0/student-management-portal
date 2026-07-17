import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../lib/token.js";
import { db } from "../db/db.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { HttpError } from "./errorHandler.js";

// Extend Express Request interface locally to support req.user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.token;
    if (!token) throw new HttpError(401, "Not authenticated");

    const payload = verifyToken(token);
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    if (!user || !user.isActive) {
      throw new HttpError(401, "Not authenticated");
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err) {
    if (err instanceof HttpError) return next(err);
    next(new HttpError(401, "Not authenticated")); // invalid or expired token
  }
}

export function authorize(...roles: Array<"PRINCIPAL" | "ADMIN">) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      next(new HttpError(403, "You do not have permission to do this"));
    }
  };
}
