import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { logger } from "../lib/logger.js";

export class HttpError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

// Express 4 does not forward rejected promises from async handlers, so every
// async route is wrapped to funnel errors into the error middleware below.
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

// Express identifies error handlers by arity (4 args)
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
      ...(err.fieldErrors ? { errors: err.fieldErrors } : {}),
    });
  }

  if (err instanceof multer.MulterError || err.message?.includes("images are allowed")) {
    return res.status(400).json({ message: err.message });
  }

  // Postgres-js unique constraint error code is "23505"
  if (err.code === "23505") {
    return res.status(409).json({ message: "A record with this value already exists" });
  }

  // Log raw unexpected errors
  logger.error(err);

  res.status(500).json({ message: "Internal server error" });
}
