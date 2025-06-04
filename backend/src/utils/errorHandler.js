// utils/errorHandler.js
import { logger } from './logger.js';

/**
 * Manejador centralizado de errores HTTP
 * @param {Response} res - Objeto response de Express
 * @param {string} errorCode - Código de error personalizado
 * @param {Error} error - Objeto Error
 * @param {number} [statusCode=500] - Código HTTP (opcional)
 */
export const handleHttpError = (res, errorCode, error, statusCode = 500) => {
    // Mapeo de códigos de error a mensajes y códigos HTTP
    const errorMap = {
        // Errores de productos
        PRODUCT_NOT_FOUND: {
            message: 'Producto no encontrado',
            status: 404
        },
        INVALID_PRODUCT_DATA: {
            message: 'Datos de producto inválidos',
            status: 400
        },
        
        // Errores de archivos
        INVALID_FILE_TYPE: {
            message: 'Solo se permiten archivos Excel (.xlsx)',
            status: 400
        },
        FILE_PROCESSING_ERROR: {
            message: 'Error al procesar el archivo',
            status: 422
        },
        
        // Errores de autenticación
        UNAUTHORIZED: {
            message: 'Acceso no autorizado',
            status: 401
        },
        
        // Errores generales
        INTERNAL_SERVER_ERROR: {
            message: 'Error interno del servidor',
            status: 500
        },
        NOT_FOUND: {
            message: 'Recurso no encontrado',
            status: 404
        },
        TOO_MANY_REQUESTS: {
            message: 'Límite de solicitudes excedido',
            status: 429
        }
    };

    // Obtener detalles del error
    const errorInfo = errorMap[errorCode] || {
        message: error.message || 'Error desconocido',
        status: statusCode
    };

    // Loggear el error
    logger.error(`[${errorCode}] ${errorInfo.message}`, {
        code: errorCode,
        stack: error.stack,
        originalError: error.message
    });

    // Enviar respuesta al cliente
    res.status(errorInfo.status).json({
        success: false,
        error: errorInfo.message,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? {
            stack: error.stack,
            originalError: error.message
        } : undefined
    });
};

/**
 * Middleware para manejar errores 404
 */
export const notFoundHandler = (req, res) => {
    handleHttpError(
        res,
        'NOT_FOUND',
        new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`),
        404
    );
};

/**
 * Wrapper para controladores async/await
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        handleHttpError(
            res,
            'INTERNAL_SERVER_ERROR',
            error
        );
    });
};

// Opcional: Exportar todos los códigos de error como enum
export const ErrorCodes = {
    PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    // ...otros códigos
};