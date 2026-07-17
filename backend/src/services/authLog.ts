import { authLogs } from "../db/schema.js";
import { Request } from "express";

interface LogAuthEventPayload {
  userId?: number | null;
  email: string;
  event: "LOGIN" | "LOGOUT" | "LOGIN_FAILED";
  req?: Request;
}

export async function logAuthEvent(
  client: any,
  payload: LogAuthEventPayload
): Promise<void> {
  const { userId, email, event, req } = payload;
  
  await client.insert(authLogs).values({
    userId: userId ?? null,
    email,
    event,
    ipAddress: req?.ip ?? null,
    userAgent: req?.headers?.["user-agent"] ?? null,
  });
}
