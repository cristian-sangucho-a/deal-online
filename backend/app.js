import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { logger } from "./src/utils/logger.js";
import { handleHttpError } from "./src/utils/errorHandler.js";
import authRoutes from "./src/routes/auth.routes.js";
import auctionRoutes from "./src/routes/auction.routes.js";
import setupAssociations from "./src/models/associations.js";
import verifyToken from "./src/middlewares/auth.middleware.js";
import sequelize from "./src/config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupSocketHandlers } from "./src/socket/socketHandlers.js";

// Configuración del puerto
const PORT = process.env.PORT || 3500;
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 3501;

const app = express();

// 1. Configuración de Seguridad
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);

// 3. Middlewares básicos
app.use(morgan("combined", { stream: logger.stream }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Conexión a la base de datos
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("✅ Base de datos conectada y sincronizada");
    setupAssociations();
  })
  .catch((err) => console.error("❌ Error de conexión a la DB:", err));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api", auctionRoutes);

app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "Ruta protegida", user: req.user });
});

// Health check mejorado
const healthResponse = async (req, res) => {
  const dbStatus = await sequelize
    .authenticate()
    .then(() => "connected")
    .catch(() => "disconnected");

  res.status(200).json({
    status: "OK",
    dbStatus,
    websocketStatus: "active",
    timestamp: new Date().toISOString(),
    service: "Deal Online API",
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV || "development",
    port: PORT,
    websocketPort: WEBSOCKET_PORT,
  });
};

app.get("/health", healthResponse);
app.get("/api/health", healthResponse);

// Manejo de errores
app.use((req, res) => {
  handleHttpError(
    res,
    "NOT_FOUND",
    new Error(`Ruta no encontrada: ${req.originalUrl}`),
    404
  );
});

app.use((err, req, res, next) => {
  logger.error(`Error no manejado: ${err.stack}`);
  handleHttpError(res, "INTERNAL_SERVER_ERROR", err, 500);
});

// ===== SERVIDOR API REST (solo HTTP) =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor API REST corriendo en http://localhost:${PORT}`);
});

// ===== SERVIDOR WEBSOCKET SEPARADO =====
// Crear un servidor HTTP minimalista solo para WebSocket
const wsApp = express();
wsApp.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Opcional: endpoint de salud para WebSocket
wsApp.get("/ws-health", (req, res) => {
  res.json({
    status: "WebSocket server OK",
    port: WEBSOCKET_PORT,
    timestamp: new Date().toISOString(),
  });
});

const wsServer = createServer(wsApp);
const io = new Server(wsServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Configurar manejadores de Socket.IO
setupSocketHandlers(io);

wsServer.listen(WEBSOCKET_PORT, () => {
  console.log(
    `🔌 Servidor WebSocket corriendo en ws://localhost:${WEBSOCKET_PORT}`
  );
});

export default app;
