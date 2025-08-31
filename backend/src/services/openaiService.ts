import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client lazily
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

interface AiSuggestResponse {
  suggestedDescription: string;
  estimatedMinutes: number;
  suggestedTags?: string[];
  confidence: number;
  recommendedUserId?: number;
  recommendedUser?: string;
  matchingReason?: string;
}

/**
 * OpenAI service for generating task suggestions
 */
export class OpenAIService {
  /**
   * Generate task description and estimate using OpenAI
   */
  static async generateTaskSuggestion(
    title: string, 
    context?: string,
    availableUsers?: any[]
  ): Promise<AiSuggestResponse> {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.warn('OpenAI API key not configured, falling back to stub response');
        return this.generateStubSuggestion(title, context, availableUsers);
      }

      const prompt = this.buildPrompt(title, context, availableUsers);
      
      const openaiClient = getOpenAI();
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert software development task planning assistant. You help break down tasks, estimate time, and provide actionable descriptions. Always respond with valid JSON in the exact format requested."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const parsedResponse = JSON.parse(responseText);
      
      // Validate and normalize the response
      return this.validateAndNormalizeResponse(parsedResponse);

    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Fallback to stub response on any error
      console.warn('Falling back to stub response due to OpenAI error');
      return this.generateStubSuggestion(title, context, availableUsers);
    }
  }

  /**
   * Build the prompt for OpenAI
   */
  private static buildPrompt(title: string, context?: string, availableUsers?: any[]): string {
    const contextText = context ? `\nAdditional context: ${context}` : '';
    
    let userSection = '';
    if (availableUsers && availableUsers.length > 0) {
      userSection = `

Available Users for Assignment:
${availableUsers.map(user => 
  `- ${user.username} (ID: ${user.id}): Skills: ${user.skills || 'No skills specified'}`
).join('\n')}`;
    }
    
    const responseFormat = availableUsers && availableUsers.length > 0 ? `
{
  "suggestedDescription": "Detailed step-by-step description of how to complete this task",
  "estimatedMinutes": 120,
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85,
  "recommendedUserId": 123,
  "recommendedUser": "actual_username_from_available_users_list",
  "matchingReason": "Has experience with React and JavaScript which matches this frontend task"
}` : `
{
  "suggestedDescription": "Detailed step-by-step description of how to complete this task",
  "estimatedMinutes": 120,
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85
}`;
    
    return `
Task Title: "${title}" ${contextText}${userSection}

Please analyze this task and provide a structured response in the following JSON format:
${responseFormat}

Guidelines:
- suggestedDescription: Provide a clear, actionable description with 3-5 numbered steps
- estimatedMinutes: Realistic time estimate in minutes (15-480 range typical)
- suggestedTags: 2-4 relevant tags for categorization (lowercase, hyphenated)
- confidence: Your confidence in the suggestion (0.0-1.0, where 1.0 is highest confidence)${availableUsers && availableUsers.length > 0 ? `
- recommendedUserId: ID of the most suitable user for this task (MUST be exactly one of the user IDs from the available users list above)
- recommendedUser: Username of the recommended user (MUST be exactly one of the usernames from the available users list above)
- matchingReason: Brief explanation of why this user is the best match for the task based on their listed skills` : ''}

IMPORTANT: ${availableUsers && availableUsers.length > 0 ? 'You MUST only recommend users from the "Available Users for Assignment" list above. Do not create fictional users like "John Doe". Use the exact usernames and IDs provided.' : 'Focus on providing accurate task analysis.'}

Consider the type of task (bug fix, feature, refactoring, testing, documentation, etc.) and provide appropriate guidance.${availableUsers && availableUsers.length > 0 ? ' When recommending a user, carefully match their listed skills to the task requirements.' : ''}
    `.trim();
  }

  /**
   * Validate and normalize the OpenAI response
   */
  private static validateAndNormalizeResponse(response: any): AiSuggestResponse {
    // Ensure required fields exist with defaults
    const normalized: AiSuggestResponse = {
      suggestedDescription: response.suggestedDescription || 'Complete the specified task following software development best practices.',
      estimatedMinutes: Math.max(15, Math.min(480, response.estimatedMinutes || 120)),
      suggestedTags: Array.isArray(response.suggestedTags) ? response.suggestedTags.slice(0, 5) : ['general'],
      confidence: Math.max(0, Math.min(1, response.confidence || 0.7))
    };

    // Add user recommendation fields if present
    if (response.recommendedUserId) {
      normalized.recommendedUserId = response.recommendedUserId;
    }
    if (response.recommendedUser) {
      normalized.recommendedUser = response.recommendedUser;
    }
    if (response.matchingReason) {
      normalized.matchingReason = response.matchingReason;
    }

    return normalized;
  }

  /**
   * Fallback stub suggestion when OpenAI is not available
   */
  private static generateStubSuggestion(title: string, context?: string, availableUsers?: any[]): AiSuggestResponse {
    const titleLower = title.toLowerCase();
    
    // Helper function to pick a user recommendation
    const pickUserRecommendation = (taskType: string) => {
      if (!availableUsers || availableUsers.length === 0) {
        return {};
      }
      
      // Simple skill matching logic for stub suggestions
      let bestUser = availableUsers[0]; // Default to first user
      let reason = "Available team member";
      
      // Try to find a user with relevant skills
      for (const user of availableUsers) {
        const skills = (user.skills || '').toLowerCase();
        
        if (taskType === 'frontend' && (skills.includes('react') || skills.includes('javascript') || skills.includes('frontend'))) {
          bestUser = user;
          reason = "Has frontend development experience";
          break;
        } else if (taskType === 'backend' && (skills.includes('node') || skills.includes('express') || skills.includes('backend') || skills.includes('api'))) {
          bestUser = user;
          reason = "Has backend development experience";
          break;
        } else if (taskType === 'database' && (skills.includes('sql') || skills.includes('database') || skills.includes('postgres'))) {
          bestUser = user;
          reason = "Has database experience";
          break;
        } else if (taskType === 'testing' && (skills.includes('test') || skills.includes('jest') || skills.includes('cypress'))) {
          bestUser = user;
          reason = "Has testing experience";
          break;
        }
      }
      
      return {
        recommendedUserId: bestUser.id,
        recommendedUser: bestUser.name,
        matchingReason: reason
      };
    };
    
    // Keyword-based suggestion logic (same as before)
    if (titleLower.includes('bug') || titleLower.includes('fix') || titleLower.includes('error')) {
      return {
        suggestedDescription: `Investigate and resolve the issue: "${title}". Steps: 1) Reproduce the bug, 2) Identify root cause, 3) Implement fix, 4) Test thoroughly, 5) Document the solution.`,
        estimatedMinutes: 120,
        suggestedTags: ['bug', 'urgent', 'debugging'],
        confidence: 0.85,
        ...pickUserRecommendation('general')
      };
    }
    
    if (titleLower.includes('feature') || titleLower.includes('implement') || titleLower.includes('add')) {
      const taskType = titleLower.includes('frontend') || titleLower.includes('ui') || titleLower.includes('react') ? 'frontend' : 
                      titleLower.includes('backend') || titleLower.includes('api') || titleLower.includes('server') ? 'backend' : 'general';
      
      return {
        suggestedDescription: `Develop new feature: "${title}". Requirements: 1) Analyze requirements, 2) Design architecture, 3) Implement core functionality, 4) Add tests, 5) Update documentation.`,
        estimatedMinutes: 240,
        suggestedTags: ['feature', 'development', 'enhancement'],
        confidence: 0.8,
        ...pickUserRecommendation(taskType)
      };
    }
    
    if (titleLower.includes('test') || titleLower.includes('testing')) {
      return {
        suggestedDescription: `Create comprehensive tests for: "${title}". Include: 1) Unit tests, 2) Integration tests, 3) Edge cases, 4) Performance validation, 5) Documentation updates.`,
        estimatedMinutes: 90,
        suggestedTags: ['testing', 'quality-assurance', 'automation'],
        confidence: 0.9,
        ...pickUserRecommendation('testing')
      };
    }
    
    if (titleLower.includes('refactor') || titleLower.includes('optimize') || titleLower.includes('improve')) {
      return {
        suggestedDescription: `Refactor and optimize: "${title}". Process: 1) Analyze current implementation, 2) Identify improvement opportunities, 3) Refactor code, 4) Validate performance gains, 5) Update tests.`,
        estimatedMinutes: 180,
        suggestedTags: ['refactoring', 'optimization', 'code-quality'],
        confidence: 0.75,
        ...pickUserRecommendation('general')
      };
    }
    
    if (titleLower.includes('doc') || titleLower.includes('documentation')) {
      return {
        suggestedDescription: `Create or update documentation for: "${title}". Include: 1) Technical specifications, 2) Usage examples, 3) API documentation, 4) Best practices, 5) Troubleshooting guide.`,
        estimatedMinutes: 60,
        suggestedTags: ['documentation', 'knowledge-sharing'],
        confidence: 0.9,
        ...pickUserRecommendation('general')
      };
    }
    
    // Default fallback suggestion
    return {
      suggestedDescription: `Complete task: "${title}". ${context ? `Context: ${context}. ` : ''}Recommended approach: 1) Break down into smaller subtasks, 2) Research requirements, 3) Plan implementation, 4) Execute step by step, 5) Review and validate results.`,
      estimatedMinutes: 120,
      suggestedTags: ['general', 'planning'],
      confidence: 0.6,
      ...pickUserRecommendation('general')
    };
  }
}
