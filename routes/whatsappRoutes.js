const express = require('express');
const router = express.Router();
const { sendMessage } = require('../config/whatsapp');

/**
 * @swagger
 * tags:
 *   name: WhatsApp
 *   description: WhatsApp messaging integration endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WhatsAppMessage:
 *       type: object
 *       required:
 *         - number
 *         - message
 *       properties:
 *         number:
 *           type: string
 *           description: The recipient's WhatsApp number (with country code)
 *         message:
 *           type: string
 *           description: The message to be sent
 */

/**
 * @swagger
 * /api/whatsapp/send:
 *   post:
 *     summary: Send a WhatsApp message
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WhatsAppMessage'
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Pesan WhatsApp berhasil dikirim
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid input - missing number or message
 *       500:
 *         description: Server error or WhatsApp sending failed
 */
// Rute untuk mengirim pesan WhatsApp
router.post('/send', async (req, res) => {
    try {
        const { number, message } = req.body;

        // Validasi input
        if (!number || !message) {
            return res.status(400).json({
                success: false,
                message: 'Nomor dan pesan diperlukan'
            });
        }

        if (process.env.WHATSAPP_ENABLED !== 'true')
            return res.status(503).json({ error: 'WhatsApp belum diaktifkan' });
        // Kirim pesan WhatsApp
        const result = await sendMessage(number, message);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Pesan WhatsApp berhasil dikirim',
                data: result.response
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengirim pesan WhatsApp',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error in WhatsApp send route:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error internal server',
            error: 'Layanan tidak tersedia'
        });
    }
});

/**
 * @swagger
 * /api/whatsapp/status:
 *   get:
 *     summary: Check WhatsApp connection status
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 connected:
 *                   type: boolean
 *                   description: Whether WhatsApp is connected
 *                 info:
 *                   type: object
 *                   description: Connection information (null if not connected)
 *       500:
 *         description: Server error while checking status
 */
// Rute untuk cek status koneksi WhatsApp
router.get('/status', (req, res) => {
    try {
        const { client } = require('../config/whatsapp');
        const isConnected = client.info ? true : false;

        res.status(200).json({
            success: true,
            connected: isConnected,
            info: isConnected ? client.info : null
        });
    } catch (error) {
        console.error('Error in WhatsApp status route:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error internal server',
            error: 'Layanan tidak tersedia'
        });
    }
});

module.exports = router;
