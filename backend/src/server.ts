import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Importar rutas
import ticketRoutes from "./routes/tickets";
import { ApiResponse } from "./types";

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Configurar CORS para API pública
const corsOptions = {
  origin: true, 
  credentials: false,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Middleware de compresión
app.use(compression());

// Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rutas de salud
app.get("/health", (req: Request, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    message: "Server is healthy",
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    },
  });
});

// Rutas principales
app.use("/api/tickets", ticketRoutes);

// Ruta raíz
app.get("/", (req: Request, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    message: "Boletera Backend API",
    data: {
      version: "1.0.0",
      endpoints: {
        health: "/health",
        tickets: "/api/tickets",
      },
    },
  });
});

// Middleware de manejo de errores 404
app.use("*", (req: Request, res: Response<ApiResponse>) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Middleware de manejo de errores global
app.use((
  error: Error,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  console.error("Global error handler:", error);

  // Error de validación
  if (error.name === "ValidationError") {
    res.status(400).json({
      success: false,
      message: "Validation error",
      error: error.message,
    });
    return;
  }

  // Error de Firebase
  if (error.message.includes("Firebase")) {
    res.status(500).json({
      success: false,
      message: "Database error",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
    return;
  }

  // Error genérico
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
  });
});

// Manejo de señales para graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎫 API docs: http://localhost:${PORT}/api/tickets`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Configurar timeout del servidor
server.timeout = 30000; // 30 segundos

export default app; 