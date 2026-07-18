import { env } from "./lib/env.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cookieParser from "cookie-parser";
import { logger } from "./lib/logger.js";

import { studentsRouter } from "./routes/students.routes.js";
import { metaRouter } from "./routes/meta.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { ensurePrincipal } from "./bootstrap/seedPrincipal.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// The compiled React build will go to frontend/dist which we will copy or serve.
// We serve from a public/ folder relative to backend root, which copies the React build.
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const app = express();

app.set("trust proxy", 1); // Trust first hop (Railway load balancer)

app.use(express.json());
app.use(cookieParser()); // Parses incoming JWT auth cookie

// API Routes
app.use("/api", metaRouter);
app.use("/api/auth", authRouter);
app.use("/api/students", studentsRouter);
app.use("/api/users", usersRouter);

// Serve Static Frontend Assets
app.use(express.static(PUBLIC_DIR));

// SPA Routing Fallback
app.get(/^(?!\/api).*/, (_req, res, next) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"), (err) => {
    if (err) next();
  });
});

// Fallback for API routes (404)
app.use("/api/*", notFound);

// Global Error Handler
app.use(errorHandler);

// Idempotently seed principal, then start HTTP server
ensurePrincipal()
  .catch((err) => logger.error("Principal seed failed:", err))
  .finally(() => {
    app.listen(env.PORT, () => {
      logger.info(`Server successfully listening on port ${env.PORT}`);
    });
  });

// Rebuild trigger: sidebar layout and placeholders update
export default app;
