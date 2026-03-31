import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";


// ── Route imports ──────────────────────────────────────
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import foodRoutes from "./routes/food.route.js";
import dailyLogRoutes from "./routes/dailyLog.route.js";
import weightLogRoutes from "./routes/weightLog.route.js";
import insightRoutes from "./routes/insight.route.js";


const app = express();

// ── Security middlewares ───────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: (origin, cb) => {
      // In development allow any origin to avoid preflight blocking for local dev
      if (process.env.NODE_ENV !== 'production') return cb(null, true)
      // Allow requests with no origin (curl, mobile)
      if (!origin) return cb(null, true)
      const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s=>s.trim()).filter(Boolean)
      const ok = allowed.includes(origin)
      return cb(ok ? null : new Error('Not allowed by CORS'), ok)
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin","Content-Type", "Authorization", "X-Requested-With", "Accept"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Ensure preflight OPTIONS requests are handled
app.options('*', cors())

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
// Backwards-compatible alias used by the frontend (camelCase)
app.use(`${API}/dailyLog`, dailyLogRoutes);
app.use(`${API}/weight`, weightLogRoutes);
// Backwards-compatible alias used by the frontend (camelCase)
app.use(`${API}/weightLog`, weightLogRoutes);
app.use(`${API}/insight`, insightRoutes);

// ── 404 + error handler ────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;