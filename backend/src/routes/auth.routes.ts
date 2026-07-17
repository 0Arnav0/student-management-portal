import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import { login, logout, me } from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

export const authRouter = Router();

// Apply strict rate limiting to login route
authRouter.post("/login", authRateLimiter, asyncHandler(login));
authRouter.post("/logout", authenticate, asyncHandler(logout));
authRouter.get("/me", authenticate, asyncHandler(me));
