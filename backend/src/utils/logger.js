import winston from 'winston';
import path from 'path';

const logsDir = path.resolve('logs'); // Resuelve la ruta absoluta a la carpeta logs

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error'
        }),
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log')
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
