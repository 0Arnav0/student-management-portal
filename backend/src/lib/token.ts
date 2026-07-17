import jwt from "jsonwebtoken";
import { env } from "./env.js";

const EXPIRES_IN = "7d";

export interface TokenPayload {
  id: number;
  name: string;
  email: string;
  role: "PRINCIPAL" | "ADMIN";
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
