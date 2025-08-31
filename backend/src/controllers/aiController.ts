import { Request, Response } from 'express';
import { OpenAIService } from '../services/openaiService';
import { db } from '../db';
import { users } from '../models/schema';

interface AiSuggestRequest {
  title: string;
  context?: string;
}

export class AiController {
  /**
   * AI Suggest endpoint - using OpenAI with fallback to deterministic responses
   */
  static async suggestTaskDescription(req: Request, res: Response) {
    try {
      const { title, context }: AiSuggestRequest = req.body;

      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Title is required for AI suggestions'
        });
      }

      // Fetch all users with their skills for user recommendation
      let availableUsers: any[] = [];
      try {
        availableUsers = await db.select({
          id: users.id,
          username: users.username,
          skills: users.skills,
          isAdmin: users.isAdmin
        }).from(users);
      } catch (error) {
        console.warn('Could not fetch users for recommendation:', error);
        // Continue without user recommendation if database query fails
      }

      const suggestion = await OpenAIService.generateTaskSuggestion(
        title.trim(), 
        context?.trim(),
        availableUsers
      );

      return res.json({
        success: true,
        data: suggestion
      });

    } catch (error) {
      console.error('Error in AI suggest endpoint:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get AI service status - checks whether using OpenAI or fallback mode based on API key availability
   */
  static async getAiStatus(_req: Request, res: Response) {
    try {
      const hasApiKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here');
      
      return res.json({
        success: true,
        data: {
          mode: hasApiKey ? 'openai' : 'fallback',
          description: hasApiKey 
            ? 'Using OpenAI GPT-3.5-turbo for AI suggestions'
            : 'Using intelligent fallback responses (OpenAI API key not configured)'
        }
      });
    } catch (error) {
      console.error('Error getting AI status:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
