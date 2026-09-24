const express = require('express');
const router = express.Router();
const db = require('../config/database');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const PerformanceMonitor = require('../utils/performance');

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check the health status of the API and its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     redis:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *       500:
 *         description: One or more services are unhealthy
 */

// Fungsi untuk cek koneksi database
const checkDatabase = async () => {
    try {
        await db.promise().query('SELECT 1');
        return { status: 'up', responseTime: null };
    } catch (error) {
        logger.error('Database health check failed', {
            error: 'Service unavailable'
        });
        return { status: 'down', error: error.message };
    }
};

// Fungsi untuk cek koneksi Redis
const checkRedis = async () => {
    try {
        if (process.env.REDIS_ENABLED === 'false')
            return { status: 'disabled' };
        const startTime = performance.now();
        await redis.ping();
        const responseTime = performance.now() - startTime;
        return { status: 'up', responseTime: `${responseTime.toFixed(2)}ms` };
    } catch (error) {
        logger.error('Redis health check failed', { error: error.message });
        return { status: 'down', error: error.message };
    }
};

// Health check endpoint
router.get('/', async (req, res) => {
    const monitor = new PerformanceMonitor();
    monitor.startMeasure('health-check');

    const [dbStatus, redisStatus] = await Promise.all([
        checkDatabase(),
        checkRedis()
    ]);

    // Cek penggunaan memori
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const duration = monitor.endMeasure('health-check');

    const healthStatus = {
        status:
            dbStatus.status === 'up'
                ? redisStatus.status === 'down'
                    ? 'degraded'
                    : 'healthy'
                : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        services: {
            database: dbStatus,
            redis: redisStatus
        },
        system: {
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
            },
            responseTime: `${duration.toFixed(2)}ms`
        }
    };

    // Log health check result
    logger.info('Health Check Result', healthStatus);

    res.status(healthStatus.status !== 'unhealthy' ? 200 : 503).json(
        healthStatus
    );
});

module.exports = router;
