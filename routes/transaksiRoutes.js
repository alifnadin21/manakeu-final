/**
 * @swagger
 * components:
 *   schemas:
 *     Transaksi:
 *       type: object
 *       required:
 *         - ID_Project
 *         - Jenis_Transaksi
 *         - Jumlah
 *         - Tanggal_Transaksi
 *       properties:
 *         ID_Transaksi:
 *           type: integer
 *           description: The auto-generated id of the transaction
 *         ID_Project:
 *           type: integer
 *           description: The ID of the associated project
 *         Jenis_Transaksi:
 *           type: string
 *           enum: [Pemasukan, Pengeluaran]
 *           description: The type of transaction
 *         Jumlah:
 *           type: number
 *           description: The amount of the transaction
 *         Tanggal_Transaksi:
 *           type: string
 *           format: date
 *           description: The date of the transaction
 *         Keterangan:
 *           type: string
 *           description: Additional notes about the transaction
 */
/**
 * @swagger
 * /api/transaksi:
 *   get:
 *     summary: Returns all transactions
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaksi'
 *       500:
 *         description: Database query error
 */
/**
 * @swagger
 * /api/transaksi/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaksi'
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Database query error
 */
/**
 * @swagger
 * /api/transaksi:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_Project
 *               - Jenis_Transaksi
 *               - Jumlah
 *               - Tanggal_Transaksi
 *             properties:
 *               ID_Project:
 *                 type: integer
 *               Jenis_Transaksi:
 *                 type: string
 *                 enum: [Pemasukan, Pengeluaran]
 *               Jumlah:
 *                 type: number
 *               Tanggal_Transaksi:
 *                 type: string
 *                 format: date
 *               Keterangan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project not found
 *       500:
 *         description: Database insertion error
 */
/**
 * @swagger
 * /api/transaksi/{id}:
 *   put:
 *     summary: Update transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ID_Project:
 *                 type: integer
 *               Jenis_Transaksi:
 *                 type: string
 *                 enum: [Pemasukan, Pengeluaran]
 *               Jumlah:
 *                 type: number
 *               Tanggal_Transaksi:
 *                 type: string
 *                 format: date
 *               Keterangan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Transaction or Project not found
 *       500:
 *         description: Database update error
 */
/**
 * @swagger
 * /api/transaksi/{id}:
 *   delete:
 *     summary: Delete transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Database deletion error
 */
const router = require('express').Router();
const c = require('../controllers/crudController');
router.get('/', c.list('transaksi'));
router.get('/:id', c.detail('transaksi'));
router.post('/', c.saveTransaction);

router.put('/:id', c.saveTransaction);
router.delete('/:id', c.remove('transaksi'));
module.exports = router;
