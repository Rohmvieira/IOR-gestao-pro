import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import router from "./routes";

const app: Express = express();

/* ══════════════════════════════════════════════════
   SEGURANÇA — Headers HTTP
══════════════════════════════════════════════════ */
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});

/* ══════════════════════════════════════════════════
   SEGURANÇA — CORS restrito
   Defina ALLOWED_ORIGINS no .env:
   ALLOWED_ORIGINS=https://seudominio.com,https://app.seudominio.com
══════════════════════════════════════════════════ */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:8081")
  .split(",")
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin }, "CORS: origem bloqueada");
      callback(new Error(`Origem não autorizada: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,
}));

/* ══════════════════════════════════════════════════
   SEGURANÇA — Rate limiting em memória
   Em produção com múltiplos pods: use ioredis + sliding window
══════════════════════════════════════════════════ */
const rlMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req.ip || "unknown") + req.path.split("/").slice(0, 3).join("/");
    const now = Date.now();
    const e = rlMap.get(key);
    if (!e || now > e.resetAt) { rlMap.set(key, { count: 1, resetAt: now + windowMs }); return next(); }
    e.count++;
    if (e.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((e.resetAt - now) / 1000)));
      return res.status(429).json({ error: "Muitas requisições. Tente novamente em instantes." });
    }
    next();
  };
}
setInterval(() => { const n = Date.now(); for (const [k, v] of rlMap) if (n > v.resetAt) rlMap.delete(k); }, 60_000);

app.use("/api", rateLimit(300, 60_000));         // 300 req/min global
app.use("/api/auth", rateLimit(10, 60_000));      // 10 req/min em rotas de auth

/* ══════════════════════════════════════════════════
   LOGGING
══════════════════════════════════════════════════ */
app.use(pinoHttp({
  logger,
  serializers: {
    req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
    res(res) { return { statusCode: res.statusCode }; },
  },
}));

/* ══════════════════════════════════════════════════
   BODY PARSING — limites para prevenir ataques
══════════════════════════════════════════════════ */
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));

/* ══════════════════════════════════════════════════
   ROTAS
══════════════════════════════════════════════════ */
app.use("/api", router);

/* ══════════════════════════════════════════════════
   ERROR HANDLER — nunca expõe stack em produção
══════════════════════════════════════════════════ */
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, url: req.url }, "Erro não tratado");
  const isProd = process.env.NODE_ENV === "production";
  res.status(500).json({
    error: isProd ? "Erro interno do servidor" : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
});

export default app;
