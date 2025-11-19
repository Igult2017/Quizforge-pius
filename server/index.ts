// index.ts
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import { startBackgroundGeneration } from "./backgroundGeneration";

// ES-module-safe __dirname (optional, in case you need it later)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const duration = Date.now() - start;
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  next();
});

// Handle favicon requests safely
app.get("/favicon.ico", (_req, res) => {
  res.status(204).end(); // no content
});

(async () => {
  try {
    // Register all routes
    const server = await registerRoutes(app);

    // Global error handler
    app.use(
      (err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        // Only throw in development to prevent crashing in production
        if (app.get("env") === "development") {
          throw err;
        }
      }
    );

    // Frontend setup
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(
      { port, host: "0.0.0.0", reusePort: true },
      () => {
        log(`Serving on port ${port}`);
        
        // Start background question generation
        startBackgroundGeneration().catch((error) => {
          console.error("Failed to start background generation:", error);
        });
      }
    );
  } catch (err) {
    console.error("Server initialization failed:", err);
    process.exit(1); // Exit if server fails to start
  }
})();

