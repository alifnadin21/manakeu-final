/**
 * @swagger
 * components:
 *   schemas:
 *     Approval:
 *       type: object
 *       required:
 *         - ID_Nota
 *         - ID_Admin
 *         - Status_Approval
 *         - Tanggal_Approval
 *       properties:
 *         ID_Approval:
 *           type: integer
 *           description: The auto-generated id of the approval
 *         ID_Nota:
 *           type: integer
 *           description: The ID of the associated nota
 *         ID_Admin:
 *           type: integer
 *           description: The ID of the admin who approved/rejected
 *         Status_Approval:
 *           type: string
 *           enum: [Approved, Rejected]
 *           description: The approval status
 *         Tanggal_Approval:
 *           type: string
 *           format: date
 *           description: The date of approval/rejection
 *         Catatan:
 *           type: string
 *           description: Additional notes for the approval
 */
/**
 * @swagger
 * /api/approval:
 *   get:
 *     summary: Returns all approvals
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of approvals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Approval'
 *       500:
 *         description: Database query error
 */
/**
 * @swagger
 * /api/approval/{id}:
 *   get:
 *     summary: Get approval by ID
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Approval ID
 *     responses:
 *       200:
 *         description: Approval details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Approval'
 *       404:
 *         description: Approval not found
 *       500:
 *         description: Database query error
 */
/**
 * @swagger
 * /api/approval/approve:
 *   post:
 *     summary: Create a new approval
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_Nota
 *               - ID_Admin
 *               - Status_Approval
 *               - Tanggal_Approval
 *             properties:
 *               ID_Nota:
 *                 type: integer
 *               ID_Admin:
 *                 type: integer
 *               Status_Approval:
 *                 type: string
 *                 enum: [Approved, Rejected]
 *               Tanggal_Approval:
 *                 type: string
 *                 format: date
 *               Catatan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Nota or Admin not found
 *       500:
 *         description: Database error
 */
/**
 * @swagger
 * /api/approval/{id}:
 *   put:
 *     summary: Update approval by ID
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Approval ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Status_Approval:
 *                 type: string
 *                 enum: [Approved, Rejected]
 *               Catatan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Approval not found
 *       500:
 *         description: Database error
 */
/**
 * @swagger
 * /api/approval/{id}:
 *   delete:
 *     summary: Delete approval by ID
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Approval ID
 *     responses:
 *       200:
 *         description: Approval deleted successfully
 *       404:
 *         description: Approval not found
 *       500:
 *         description: Database deletion error
 */
const router = require('express').Router();
const c = require('../controllers/approvalCrudController');
router.get('/', c.list);
router.get('/:id', c.detail);
router.post('/approve', c.save);
router.put('/:id', c.save);
router.delete('/:id', c.remove);
module.exports = router;
