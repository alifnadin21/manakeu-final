const rateLimit = require('express-rate-limit');

// API Redis
const redisApiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 50,
    message: {
        status: 'error',
        message: 'Rate limit untuk Redis API tercapai'
    }
});

// API secara umum
const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: Math.max(100, Number(process.env.API_RATE_LIMIT) || 300),
    message: {
        error: 'Terlalu banyak request dari IP ini, silakan coba lagi setelah 5 menit'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Login
const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: {
        error: 'Terlalu banyak percobaan login, silakan coba lagi setelah 5 menit'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false,
    skipSuccessfulRequests: true
});

// Register
const registerLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
        error: 'Terlalu banyak percobaan registrasi, silakan coba lagi setelah 10 menit'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false,
    skipSuccessfulRequests: true
});

// Endpoint sensitif (seperti reset password, verifikasi email, dll)
const sensitiveRouteLimiter = rateLimit({
    windowMs: 20 * 60 * 1000,
    max: 3,
    message: {
        error: 'Terlalu banyak request untuk operasi sensitif, silakan coba lagi setelah 20 Menit'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: false,
    skipSuccessfulRequests: true
});

module.exports = {
    apiLimiter,
    loginLimiter,
    registerLimiter,
    sensitiveRouteLimiter,
    redisApiLimiter
};
