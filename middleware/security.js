// middleware/security.js
const helmet = require('helmet');
const cors = require('cors');

const securityMiddleware = {
    helmet: helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:']
            }
        },
        xssFilter: true,
        noSniff: true,
        referrerPolicy: { policy: 'same-origin' }
    }),

    cors: cors({
        origin:
            process.env.NODE_ENV === 'production'
                ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
                : '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400
    }),

    additionalHeaders: (req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    }
};

module.exports = securityMiddleware;
