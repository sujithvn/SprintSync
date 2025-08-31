import { Router } from 'express';
import { StatsController } from '../controllers';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/stats/top-users:
 *   get:
 *     summary: Get top users by time logged (Admin only)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     topUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           isAdmin:
 *                             type: boolean
 *                           totalMinutes:
 *                             type: number
 *                           totalHours:
 *                             type: number
 *                           taskCount:
 *                             type: number
 *                           completedTasks:
 *                             type: number
 *                           inProgressTasks:
 *                             type: number
 *                           todoTasks:
 *                             type: number
 *                           completionRate:
 *                             type: number
 *                     totalUsers:
 *                       type: number
 *                     generatedAt:
 *                       type: string
 *       403:
 *         description: Access denied - Admin privileges required
 *       401:
 *         description: Unauthorized
 */
router.get('/top-users', authenticateToken, StatsController.getTopUsers);

/**
 * @swagger
 * /api/stats/platform:
 *   get:
 *     summary: Get platform-wide statistics (Admin only)
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: number
 *                         adminUsers:
 *                           type: number
 *                     tasks:
 *                       type: object
 *                       properties:
 *                         totalTasks:
 *                           type: number
 *                         completedTasks:
 *                           type: number
 *                         inProgressTasks:
 *                           type: number
 *                         todoTasks:
 *                           type: number
 *                         totalMinutes:
 *                           type: number
 *                         totalHours:
 *                           type: number
 *                         completionRate:
 *                           type: number
 *                     generatedAt:
 *                       type: string
 *       403:
 *         description: Access denied - Admin privileges required
 *       401:
 *         description: Unauthorized
 */
router.get('/platform', authenticateToken, StatsController.getPlatformStats);

export default router;
