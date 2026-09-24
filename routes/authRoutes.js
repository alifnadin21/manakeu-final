/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - Nama
 *         - Email
 *         - Password
 *         - Role
 *       properties:
 *         ID_User:
 *           type: integer
 *           description: The auto-generated id of the user
 *         Nama:
 *           type: string
 *           description: User's full name (minimum 2 words)
 *         Email:
 *           type: string
 *           description: User's email address from allowed domains
 *         Password:
 *           type: string
 *           description: User's password (8-50 characters, must include uppercase, lowercase, and number)
 *         Role:
 *           type: string
 *           enum: [Admin, User]
 *           description: User's role in the system
 *         API_Key:
 *           type: string
 *           description: User's API key for authentication
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Nama
 *               - Email
 *               - Password
 *               - Role
 *             properties:
 *               Nama:
 *                 type: string
 *                 description: User's full name (minimum 2 words)
 *               Email:
 *                 type: string
 *                 description: User's email from allowed domains
 *               Password:
 *                 type: string
 *                 description: Password (8-50 chars, must include uppercase, lowercase, and number)
 *               Role:
 *                 type: string
 *                 enum: [Admin, User]
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to the system
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Email
 *               - Password
 *             properties:
 *               Email:
 *                 type: string
 *               Password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth2 login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google login page
 */
/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth2 callback URL
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Authentication failed
 */
/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid or expired token
 */
/**
 * @swagger
 * /api/auth/api-key:
 *   post:
 *     summary: Generate new API key
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New API key generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *                   description: The new API key
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
const router = require('express').Router();
const passport = require('../config/passport');
const auth = require('../middleware/auth');
const controller = require('../controllers/authController');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { wrap } = require('../utils/http');
router.post('/register', registerLimiter, controller.register);
router.post('/login', loginLimiter, controller.login);
router.get('/me', auth, controller.getProfile);
router.put('/update-profile', auth, controller.updateProfile);
router.get('/verify', auth, (req, res) => res.json({ user: req.user }));
const googleEnabled = (req, res, next) =>
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? next()
        : res.status(503).json({ error: 'Google OAuth belum dikonfigurasi' });
router.get(
    '/google',
    googleEnabled,
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: true
    })
);
router.get(
    '/google/callback',
    googleEnabled,
    passport.authenticate('google', { session: false }),
    controller.handleGoogleCallback
);
router.post(
    '/api-key',
    auth,
    wrap(async (req, res) =>
        res.json({
            apiKey: await require('../utils/apiKeyService').generateApiKey(
                req.user.ID_User
            )
        })
    )
);
module.exports = router;
