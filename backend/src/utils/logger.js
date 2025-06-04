import winston from 'winston';
import path from 'path'; // <-- Añade esta importación
import { PATHS } from '../config/constants.js';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(PATHS.LOGS_DIR, 'error.log'),
            level: 'error'
        }),
        new winston.transports.File({
            filename: path.join(PATHS.LOGS_DIR, 'combined.log')
        }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Opcional: Stream para morgan (si lo necesitas)
logger.stream = {
    write: (message) => logger.info(message.trim())
};

export { logger };