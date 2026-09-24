/**
 * @swagger
 * components:
 *   schemas:
 *     LogAktivitas:
 *       type: object
 *       required:
 *         - ID_User
 *         - Aksi
 *       properties:
 *         ID_Log:
 *           type: integer
 *           description: The auto-generated id of the activity log
 *         ID_User:
 *           type: integer
 *           description: The ID of the user who performed the action
 *         Aksi:
 *           type: string
 *           description: Description of the action performed
 *         Tanggal_Aksi:
 *           type: string
 *           format: date-time
 *           description: The timestamp of when the action was performed
 */
/**
 * @swagger
 * tags:
 *   name: Activity Logs
 *   description: User activity logging and tracking
 */
/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Returns all activity logs
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LogAktivitas'
 *       500:
 *         description: Database query error
 */
/**
 * @swagger
 * /api/logs/{id}:
 *   get:
 *     summary: Get activity log by ID
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Activity log ID
 *     responses:
 *       200:
 *         description: Activity log details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogAktivitas'
 *       404:
 *         description: Activity log not found
 *       500:
 *         description: Database query error
 */
/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: Create a new activity log
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_User
 *               - Aksi
 *             properties:
 *               ID_User:
 *                 type: integer
 *                 description: The ID of the user performing the action
 *               Aksi:
 *                 type: string
 *                 description: Description of the action performed
 *     responses:
 *       200:
 *         description: Activity log created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Database error
 */
/**
 * @swagger
 * /api/logs/{id}:
 *   delete:
 *     summary: Delete an activity log
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Activity log ID
 *     responses:
 *       200:
 *         description: Activity log deleted successfully
 *       404:
 *         description: Activity log not found
 *       500:
 *         description: Database deletion error
 */
const router = require('express').Router();
const c = require('../controllers/crudController');
router.get('/', c.list('log_aktivitas'));
router.get('/:id', c.detail('log_aktivitas'));
router.post('/', c.createLog);

router.delete(
    '/:id',
    require('../middleware/roleMiddleware').isAdmin,
    c.remove('log_aktivitas')
);
module.exports = router;
