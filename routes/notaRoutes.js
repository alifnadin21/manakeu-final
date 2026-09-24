/**
 * @swagger
 * components:
 *   schemas:
 *     Nota:
 *       type: object
 *       required:
 *         - ID_Transaksi
 *         - File_Nota
 *         - Tanggal_Unggah
 *       properties:
 *         ID_Nota:
 *           type: integer
 *           description: The auto-generated id of the nota
 *         ID_Transaksi:
 *           type: integer
 *           description: The ID of the associated transaction
 *         File_Nota:
 *           type: string
 *           description: The file path or URL of the nota document
 *         Status_Verifikasi:
 *           type: string
 *           enum: [Pending, Approved, Rejected]
 *           description: The verification status of the nota
 *         Tanggal_Unggah:
 *           type: string
 *           format: date
 *           description: The upload date of the nota
 *         Tanggal_Verifikasi:
 *           type: string
 *           format: date
 *           description: The verification date of the nota
 */
/**
 * @swagger
 * /api/nota:
 *   get:
 *     summary: Returns all notas
 *     tags: [Nota]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of notas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Nota'
 *       500:
 *         description: Database query error
 */
/**
 * @swagger
 * /api/nota/{id}:
 *   get:
 *     summary: Get nota by ID
 *     tags: [Nota]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Nota ID
 *     responses:
 *       200:
 *         description: Nota details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Nota'
 *       404:
 *         description: Nota not found
 *       500:
 *         description: Database query error
 */
/**
 * @swagger
 * /api/nota:
 *   post:
 *     summary: Create a new nota
 *     tags: [Nota]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_Transaksi
 *               - File_Nota
 *               - Tanggal_Unggah
 *             properties:
 *               ID_Transaksi:
 *                 type: integer
 *               File_Nota:
 *                 type: string
 *               Status_Verifikasi:
 *                 type: string
 *                 enum: [Pending, Approved, Rejected]
 *               Tanggal_Unggah:
 *                 type: string
 *                 format: date
 *               Tanggal_Verifikasi:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Nota created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Database insertion error
 */
/**
 * @swagger
 * /api/nota/{id}:
 *   put:
 *     summary: Update nota by ID
 *     tags: [Nota]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Nota ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ID_Transaksi:
 *                 type: integer
 *               File_Nota:
 *                 type: string
 *               Status_Verifikasi:
 *                 type: string
 *                 enum: [Pending, Approved, Rejected]
 *               Tanggal_Unggah:
 *                 type: string
 *                 format: date
 *               Tanggal_Verifikasi:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Nota updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Nota or Transaction not found
 *       500:
 *         description: Database update error
 */
/**
 * @swagger
 * /api/nota/{id}:
 *   delete:
 *     summary: Delete nota by ID
 *     tags: [Nota]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Nota ID
 *     responses:
 *       200:
 *         description: Nota deleted successfully
 *       404:
 *         description: Nota not found
 *       500:
 *         description: Database deletion error
 */
const router = require('express').Router();
const c = require('../controllers/crudController');
router.get('/', c.list('nota'));
router.get('/:id', c.detail('nota'));
router.post('/', c.saveNota);

router.put('/:id', c.saveNota);
router.delete('/:id', c.remove('nota'));
module.exports = router;
