const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { apiLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentRequest:
 *       type: object
 *       required:
 *         - orderId
 *         - amount
 *         - itemDetails
 *       properties:
 *         orderId:
 *           type: string
 *           description: Unique identifier for the order
 *         amount:
 *           type: number
 *           description: Total payment amount
 *         itemDetails:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Item ID
 *               name:
 *                 type: string
 *                 description: Item name
 *               price:
 *                 type: number
 *                 description: Item price
 *               quantity:
 *                 type: integer
 *                 description: Item quantity
 *     PaymentStatus:
 *       type: object
 *       properties:
 *         status_code:
 *           type: string
 *           description: Status code of the payment
 *         transaction_status:
 *           type: string
 *           description: Current transaction status
 *         order_id:
 *           type: string
 *           description: Order ID reference
 *         payment_type:
 *           type: string
 *           description: Payment method used
 */

/**
 * @swagger
 * /api/payment/create:
 *   post:
 *     tags: [Payments]
 *     summary: Create a new payment
 *     description: Create a new payment transaction using Midtrans
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       200:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Payment token
 *                 redirect_url:
 *                   type: string
 *                   description: Payment page URL
 *       400:
 *         description: Invalid input data
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Server error
 */
router.post(
    '/create',
    require('../middleware/auth'),
    apiLimiter,
    paymentController.createPayment
);

/**
 * @swagger
 * /api/payment/status/{orderId}:
 *   get:
 *     tags: [Payments]
 *     summary: Check payment status
 *     description: Get the current status of a payment by order ID
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to check
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentStatus'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get(
    '/status/:orderId',
    require('../middleware/auth'),
    paymentController.checkStatus
);

/**
 * @swagger
 * /api/payment/notification:
 *   post:
 *     tags: [Payments]
 *     summary: Handle payment notification
 *     description: Handle payment status notification from Midtrans
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transaction_status:
 *                 type: string
 *                 description: Updated transaction status
 *               order_id:
 *                 type: string
 *                 description: Order ID reference
 *               signature_key:
 *                 type: string
 *                 description: Signature for verification
 *     responses:
 *       200:
 *         description: Notification processed successfully
 *       400:
 *         description: Invalid notification data
 *       401:
 *         description: Invalid signature
 *       500:
 *         description: Server error
 */
router.post('/notification', paymentController.handleNotification);

module.exports = router;
