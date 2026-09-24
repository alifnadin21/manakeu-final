const winston = require('winston');
const { format } = winston;
const path = require('path');

// Format custom
const customFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
);

// Konfigurasi logger
const logger = winston.createLogger({
    level: 'info',
    format: customFormat,
    defaultMeta: { service: 'manakeu-api' },
    transports: [
        // Log error ke file terpisah
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            silent: process.env.NODE_ENV === 'test' // Tidak log saat testing
        }),
        // Log semua level ke file terpisah
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            silent: process.env.NODE_ENV === 'test' // Tidak log saat testing
        })
    ]
});

// Middleware untuk logging HTTP requests
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;

        // Hanya log ke file untuk request penting
        if (res.statusCode >= 400 || req.method !== 'GET') {
            logger.info('HTTP Request', {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration: `${duration}ms`,
                userIP: req.ip,
                userAgent: req.get('user-agent')
            });
        }
    });
    next();
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    // Log error ke file
    logger.error('Uncaught Exception', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,

        params: req.params,
        query: req.query,
        user: req.user ? req.user.ID_User : null
    });

    const status =
        err.status ||
        (['ER_DUP_ENTRY', 'ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(
            err.code
        )
            ? 409
            : err.code === 'ER_ROW_IS_REFERENCED_2'
              ? 409
              : 500);
    res.status(status).json({
        status: 'error',
        message:
            status < 500
                ? err.status
                    ? err.message
                    : 'Data terkait atau duplikat'
                : 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

module.exports = {
    logger,
    requestLogger,
    errorHandler
};
