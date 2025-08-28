import express from 'express';
import { UserController } from '../controllers';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User's unique identifier
 *         username:
 *           type: string
 *           description: User's username
 *         isAdmin:
 *           type: boolean
 *           description: Whether the user has admin privileges
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *     UserUpdate:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           description: New username for the user
 *         isAdmin:
 *           type: boolean
 *           description: Whether the user should have admin privileges
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         isAdmin:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     UserList:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/User'
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [todo, in_progress, done]
 *         totalMinutes:
 *           type: integer
 *         userId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserTaskList:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Task'
 *     DeleteUserResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User deleted successfully"
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserList'
 *       403:
 *         description: Admin access required
 */
router.get('/', authenticateToken, requireAdmin, UserController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (admin or own profile)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       403:
 *         description: Access denied
 */
router.get('/:id', authenticateToken, UserController.getUserById);

/**
 * @swagger
 * /api/users/{id}/tasks:
 *   get:
 *     summary: Get tasks for a specific user (admin or own tasks)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of user tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserTaskList'
 *       403:
 *         description: Access denied
 */
router.get('/:id/tasks', authenticateToken, UserController.getUserTasks);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin access required
 */
router.put('/:id', authenticateToken, requireAdmin, UserController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteUserResponse'
 *       404:
 *         description: User not found
 *       403:
 *         description: Admin access required
 */
router.delete('/:id', authenticateToken, requireAdmin, UserController.deleteUser);

export default router;
