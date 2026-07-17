import { Router } from "express";
import { uploadPhoto } from "../middleware/upload.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authenticate } from "../middleware/auth.js";
import {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats,
} from "../controllers/students.controller.js";
import { apiRateLimiter } from "../middleware/rateLimiter.js";

export const studentsRouter = Router();

// Require auth and moderate rate limit for all student endpoints
studentsRouter.use(authenticate, apiRateLimiter);

studentsRouter.get("/", asyncHandler(listStudents));
studentsRouter.get("/stats", asyncHandler(getStudentStats));
studentsRouter.get("/:id", asyncHandler(getStudent));
studentsRouter.post("/", uploadPhoto, asyncHandler(createStudent));
studentsRouter.put("/:id", uploadPhoto, asyncHandler(updateStudent));
studentsRouter.delete("/:id", asyncHandler(deleteStudent));
