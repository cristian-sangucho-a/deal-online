import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './src/utils/logger.js';
import authRoutes from './src/routes/auth.routes.js';
import auctionRoutes from './src/routes/auction.routes.js';
import setupAssociations from './src/models/associations.js';
import verifyToken from './src/middlewares/auth.middleware.js';
import sequelize from './src/config/db.js';

// Configuración del puerto
const PORT = process.env.PORT || 3500;

const app = express();

// 1. Configuración de Seguridad
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));


// 3. Middlewares básicos
app.use(morgan('combined', { stream: logger.stream }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Conexión a la base de datos
sequelize.sync({ alter: true })
    .then(() => {
        console.log('✅ Base de datos conectada y sincronizada');
        setupAssociations(); // ¡Aquí!
    })
    .catch(err => console.error('❌ Error de conexión a la DB:', err));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api', auctionRoutes);


app.get('/api/protected', verifyToken, (req, res) => {
    res.json({ message: 'Ruta protegida', user: req.user });
});

// Health check mejorado
const healthResponse = async (req, res) => {
    const dbStatus = await sequelize.authenticate()
        .then(() => 'connected')
        .catch(() => 'disconnected');
    res.status(200).json({
        status: "OK",
        dbStatus,
        timestamp: new Date().toISOString(),
        service: "Inventory Prediction API",
        version: process.env.npm_package_version,
        environment: process.env.NODE_ENV || 'development',
        port: PORT
    });
};

app.get('/health', healthResponse);
app.get('/api/health', healthResponse);

// Manejo de errores
app.use((req, res) => {
    handleHttpError(res, 'NOT_FOUND', new Error(`Ruta no encontrada: ${req.originalUrl}`), 404);
});

app.use((err, req, res, next) => {
    logger.error(`Error no manejado: ${err.stack}`);
    handleHttpError(res, 'INTERNAL_SERVER_ERROR', err, 500);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

export default app;
