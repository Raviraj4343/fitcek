import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { notFound, errorHandler } from "./middleware/error.middleware.js";


// ── Route imports ──────────────────────────────────────
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import foodRoutes from "./routes/food.route.js";
import dailyLogRoutes from "./routes/dailyLog.route.js";
import weightLogRoutes from "./routes/weightLog.route.js";



const app = express();

// ── Security middlewares ───────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Rate limiting ──────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many auth attempts. Please wait 15 minutes." },
});

app.use(globalLimiter);

// ── Body / cookie parsers ──────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ── Logging ────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ── Static files ───────────────────────────────────────
app.use(express.static("public"));

// ── Health check ──────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "🏃 Health Tracker is running",
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ─────────────────────────────────────────
const API = "/api/v1";

app.use(`${API}/auth`, authLimiter, authRoutes);
app.use(`${API}/user`, userRoutes);
app.use(`${API}/food`, foodRoutes);
app.use(`${API}/daily-log`, dailyLogRoutes);
app.use(`${API}/weight`, weightLogRoutes);


// ── 404 + error handler ────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;