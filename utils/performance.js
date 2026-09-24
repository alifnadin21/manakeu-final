const { performance } = require('perf_hooks');
const { logger } = require('./logger');

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
    }

    // Mulai mengukur performa
    startMeasure(name, metadata = {}) {
        this.metrics.set(name, {
            start: performance.now(),
            metadata
        });
    }

    // Selesai mengukur dan log hasilnya
    endMeasure(name) {
        const metric = this.metrics.get(name);
        if (!metric) {
            logger.warn(`No performance measurement started for: ${name}`);
            return;
        }

        const duration = performance.now() - metric.start;
        this.metrics.delete(name);

        logger.info('Performance Metric', {
            name,
            duration: `${duration.toFixed(2)}ms`,
            ...metric.metadata
        });

        return duration;
    }

    // Middleware untuk mengukur performa API
    static apiMetrics(req, res, next) {
        const startTime = performance.now();
        const url = req.originalUrl;

        // Tambahkan listener untuk response finish
        res.on('finish', () => {
            const duration = performance.now() - startTime;
            logger.info('API Performance', {
                path: url,
                method: req.method,
                status: res.statusCode,
                duration: `${duration.toFixed(2)}ms`,
                userID: req.user ? req.user.ID_User : null
            });
        });

        next();
    }

    // Monitor penggunaan memori
    static logMemoryUsage() {
        const used = process.memoryUsage();
        logger.info('Memory Usage', {
            rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(used.external / 1024 / 1024)}MB`
        });
    }
}

module.exports = PerformanceMonitor;
