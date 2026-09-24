/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - Nama
 *         - Email
 *         - Role
 *       properties:
 *         ID_User:
 *           type: integer
 *           description: The auto-generated id of the user
 *         Nama:
 *           type: string
 *           description: The name of the user
 *         Email:
 *           type: string
 *           description: The email of the user
 *         Role:
 *           type: string
 *           enum: [Admin, User]
 *           description: The role of the user
 */
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Returns all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Database query error
 */
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Database query error
 */
/**
 * @swagger
 * /api/users/{id}:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Nama
 *               - Email
 *               - Role
 *             properties:
 *               Nama:
 *                 type: string
 *               Email:
 *                 type: string
 *               Role:
 *                 type: string
 *                 enum: [Admin, User]
 *     responses:
 *       200:
 *         description: User created successfully
 *       400:
 *         description: Invalid input or email already exists
 *       500:
 *         description: Database insertion error
 */
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Nama:
 *                 type: string
 *               Email:
 *                 type: string
 *               Role:
 *                 type: string
 *                 enum: [Admin, User]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input or email already exists
 *       404:
 *         description: User not found
 *       500:
 *         description: Database update error
 */
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Database deletion error
 */
const router = require('express').Router();
const c = require('../controllers/crudController');
router.get('/', c.list('user'));
router.get('/:id', c.detail('user'));
router.post('/', c.saveUser);
router.post('/:id', c.saveUser);
router.put('/:id', c.saveUser);
router.delete('/:id', c.remove('user'));
module.exports = router;
