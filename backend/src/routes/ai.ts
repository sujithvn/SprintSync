import express from 'express';
import { AiController } from '../controllers';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AiSuggestRequest:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           description: The task title to generate suggestions for
 *         context:
 *           type: string
 *           description: Optional additional context for better suggestions
 *     AiSuggestResponse:
 *       type: object
 *       properties:
 *         suggestedDescription:
 *           type: string
 *           description: AI-generated task description
 *         estimatedMinutes:
 *           type: integer
 *           description: Estimated time to complete in minutes
 *         suggestedTags:
 *           type: array
 *           items:
 *             type: string
 *           description: Suggested tags for categorization
 *         confidence:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *           description: Confidence score of the suggestion
 */

/**
 * @swagger
 * /api/ai/suggest:
 *   post:
 *     summary: Get AI suggestions for task description and time estimate
 *     tags: [AI Assistant]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AiSuggestRequest'
 *     responses:
 *       200:
 *         description: AI suggestions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AiSuggestResponse'
 *       400:
 *         description: Bad request - missing title
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/suggest', authenticateToken, AiController.suggestTaskDescription);

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     summary: Get AI service status
 *     tags: [AI Assistant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI service status retrieved successfully
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
 *                     mode:
 *                       type: string
 *                       enum: [openai, fallback]
 *                     description:
 *                       type: string
 */
router.get('/status', authenticateToken, AiController.getAiStatus);

export default router;
