require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const security = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');
const { requestLogger, errorHandler } = require('./utils/logger');
const auth = require('./middleware/auth');
const { isAdmin } = require('./middleware/roleMiddleware');
const app = express();
app.disable('x-powered-by');
app.use(security.helmet, security.cors, security.additionalHeaders);
app.use(express.json({ limit: '128kb' }));
app.use(express.urlencoded({ extended: false, limit: '128kb' }));
app.use(
    session({
        secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 600000
        }
    })
);
app.use(passport.initialize());
app.use(requestLogger);
app.use(require('./utils/performance').apiMetrics);
app.use('/api', apiLimiter);
app.use('/api/health', require('./routes/healthCheck'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', auth, require('./routes/projectRoutes'));
app.use('/api/transaksi', auth, require('./routes/transaksiRoutes'));
app.use('/api/nota', auth, require('./routes/notaRoutes'));
app.use('/api/approval', auth, isAdmin, require('./routes/approvalRoutes'));
app.use('/api/users', auth, isAdmin, require('./routes/userRoutes'));
app.use('/api/logs', auth, require('./routes/logAktivitasRoutes'));
app.use('/api/complex', require('./routes/complexTransactionRoutes'));
app.use('/api/redis', auth, require('./routes/redisRoutes'));
app.use('/api/whatsapp', auth, isAdmin, require('./routes/whatsappRoutes'));
app.use('/api/twilio', auth, isAdmin, require('./routes/twilioRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.get('/api-docs.json', (req, res) => res.json(require('./config/swagger')));
app.use(
    '/api-docs',
    require('swagger-ui-express').serve,
    require('swagger-ui-express').setup(require('./config/swagger'))
);
app.get('/', (req, res) =>
    res.json({ status: 'success', message: 'Manakeu API', version: '1.0.0' })
);
app.use((req, res) => res.status(404).json({ error: 'Route tidak ditemukan' }));
app.use(errorHandler);
if (require.main === module) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
        throw new Error('JWT_SECRET must contain at least 32 characters');
    const timer = setInterval(
        () => require('./utils/performance').logMemoryUsage(),
        3600000
    );
    timer.unref();
    require('./utils/patchManagement').scheduleChecks();
    const server = app.listen(process.env.PORT || 3000, () =>
        console.log('Manakeu API ready')
    );
    const shutdown = () =>
        server.close(async () => {
            await require('./config/database').promise().end();
            require('./config/redis').disconnect();
            process.exit(0);
        });
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
}
module.exports = app;
