import { Router } from "express";
import { COURSES, GENDERS, YEARS } from "@student-portal/shared";
import { isCloudinaryConfigured } from "../lib/cloudinary.js";

export const metaRouter = Router();

metaRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

metaRouter.get("/meta", (_req, res) => {
  res.json({
    courses: COURSES,
    genders: GENDERS,
    years: YEARS,
    photoUploadEnabled: isCloudinaryConfigured(),
  });
});
