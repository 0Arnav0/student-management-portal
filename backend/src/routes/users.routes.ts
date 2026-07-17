import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { listUsers, createUser, setUserActive } from "../controllers/users.controller.js";
import { apiRateLimiter } from "../middleware/rateLimiter.js";

export const usersRouter = Router();

// Only the PRINCIPAL may manage staff accounts
usersRouter.use(authenticate, authorize("PRINCIPAL"), apiRateLimiter);

usersRouter.get("/", asyncHandler(listUsers));
usersRouter.post("/", asyncHandler(createUser));
usersRouter.patch("/:id/active", asyncHandler(setUserActive));
