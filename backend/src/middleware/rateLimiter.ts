import { rateLimit } from "express-rate-limit";
import { HttpError } from "./errorHandler.js";

// Rate limiter for authentication attempts (Brute-force protection)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(new HttpError(429, "Too many login attempts. Please try again after 15 minutes."));
  },
});

// General API rate limiter for standard CRUD endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new HttpError(429, "Too many requests. Please slow down."));
  },
});
