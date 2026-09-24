/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - Nama_Project
 *         - Status
 *       properties:
 *         ID_Project:
 *           type: integer
 *           description: The auto-generated id of the project
 *         Nama_Project:
 *           type: string
 *           description: The name of the project
 *         Deskripsi:
 *           type: string
 *           description: Project description
 *         Tanggal_Mulai:
 *           type: string
 *           format: date
 *           description: Project start date
 *         Tanggal_Selesai:
 *           type: string
 *           format: date
 *           description: Project end date
 *         Status:
 *           type: string
 *           description: Current status of the project
 */
/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Returns all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       500:
 *         description: Database query error
 */
/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *       500:
 *         description: Database query error
 */
/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Nama_Project
 *               - Status
 *             properties:
 *               Nama_Project:
 *                 type: string
 *               Deskripsi:
 *                 type: string
 *               Tanggal_Mulai:
 *                 type: string
 *                 format: date
 *               Tanggal_Selesai:
 *                 type: string
 *                 format: date
 *               Status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Database insertion error
 */
/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Nama_Project:
 *                 type: string
 *               Deskripsi:
 *                 type: string
 *               Tanggal_Mulai:
 *                 type: string
 *                 format: date
 *               Tanggal_Selesai:
 *                 type: string
 *                 format: date
 *               Status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Database update error
 */
/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Database deletion error
 */
const router = require('express').Router();
const c = require('../controllers/crudController');
router.get('/', c.list('project'));
router.get('/:id', c.detail('project'));
router.post('/', c.saveProject);

router.put('/:id', c.saveProject);
router.delete('/:id', c.remove('project'));
module.exports = router;
