import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes/index.js";
import { env } from "./config/env.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(morgan("dev"));
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(express.json());

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/auth"),
});
app.use(globalLimiter);

const handLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 300,
  legacyHeaders: false,
});

registerRoutes(app, { handLimiter });

app.get("/health", (_, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

export default app;
