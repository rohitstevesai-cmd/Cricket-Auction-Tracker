import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import path from "path";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const isProd = process.env.NODE_ENV === "production";

// Trust Replit's reverse proxy so secure cookies work over HTTPS
if (isProd) app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "spl-betting-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProd ? "none" : "lax",
    },
  }),
);

app.use("/api", router);

// In production: serve the built React frontend
if (isProd) {
  const frontendDist = path.join(process.cwd(), "artifacts/cricket-auction/dist/public");
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // SPA fallback: all non-API routes return index.html
    app.get("*", (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
    logger.info({ frontendDist }, "Serving frontend static files");
  } else {
    logger.warn({ frontendDist }, "Frontend dist not found — API-only mode");
  }
}

export default app;
