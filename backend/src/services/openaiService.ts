import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AiSuggestResponse {
  suggestedDescription: string;
  estimatedMinutes: number;
  suggestedTags?: string[];
  confidence: number;
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
    context?: string
  ): Promise<AiSuggestResponse> {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.warn('OpenAI API key not configured, falling back to stub response');
        return this.generateStubSuggestion(title, context);
      }

      const prompt = this.buildPrompt(title, context);
      
      const completion = await openai.chat.completions.create({
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
      return this.generateStubSuggestion(title, context);
    }
  }

  /**
   * Build the prompt for OpenAI
   */
  private static buildPrompt(title: string, context?: string): string {
    const contextText = context ? `\nAdditional context: ${context}` : '';
    
    return `
Task Title: "${title}" ${contextText}

Please analyze this task and provide a structured response in the following JSON format:

{
  "suggestedDescription": "Detailed step-by-step description of how to complete this task",
  "estimatedMinutes": 120,
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85
}

Guidelines:
- suggestedDescription: Provide a clear, actionable description with 3-5 numbered steps
- estimatedMinutes: Realistic time estimate in minutes (15-480 range typical)
- suggestedTags: 2-4 relevant tags for categorization (lowercase, hyphenated)
- confidence: Your confidence in the suggestion (0.0-1.0, where 1.0 is highest confidence)

Consider the type of task (bug fix, feature, refactoring, testing, documentation, etc.) and provide appropriate guidance.
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

    return normalized;
  }

  /**
   * Fallback stub suggestion when OpenAI is not available
   */
  private static generateStubSuggestion(title: string, context?: string): AiSuggestResponse {
    const titleLower = title.toLowerCase();
    
    // Keyword-based suggestion logic (same as before)
    if (titleLower.includes('bug') || titleLower.includes('fix') || titleLower.includes('error')) {
      return {
        suggestedDescription: `Investigate and resolve the issue: "${title}". Steps: 1) Reproduce the bug, 2) Identify root cause, 3) Implement fix, 4) Test thoroughly, 5) Document the solution.`,
        estimatedMinutes: 120,
        suggestedTags: ['bug', 'urgent', 'debugging'],
        confidence: 0.85
      };
    }
    
    if (titleLower.includes('feature') || titleLower.includes('implement') || titleLower.includes('add')) {
      return {
        suggestedDescription: `Develop new feature: "${title}". Requirements: 1) Analyze requirements, 2) Design architecture, 3) Implement core functionality, 4) Add tests, 5) Update documentation.`,
        estimatedMinutes: 240,
        suggestedTags: ['feature', 'development', 'enhancement'],
        confidence: 0.8
      };
    }
    
    if (titleLower.includes('test') || titleLower.includes('testing')) {
      return {
        suggestedDescription: `Create comprehensive tests for: "${title}". Include: 1) Unit tests, 2) Integration tests, 3) Edge cases, 4) Performance validation, 5) Documentation updates.`,
        estimatedMinutes: 90,
        suggestedTags: ['testing', 'quality-assurance', 'automation'],
        confidence: 0.9
      };
    }
    
    if (titleLower.includes('refactor') || titleLower.includes('optimize') || titleLower.includes('improve')) {
      return {
        suggestedDescription: `Refactor and optimize: "${title}". Process: 1) Analyze current implementation, 2) Identify improvement opportunities, 3) Refactor code, 4) Validate performance gains, 5) Update tests.`,
        estimatedMinutes: 180,
        suggestedTags: ['refactoring', 'optimization', 'code-quality'],
        confidence: 0.75
      };
    }
    
    if (titleLower.includes('doc') || titleLower.includes('documentation')) {
      return {
        suggestedDescription: `Create or update documentation for: "${title}". Include: 1) Technical specifications, 2) Usage examples, 3) API documentation, 4) Best practices, 5) Troubleshooting guide.`,
        estimatedMinutes: 60,
        suggestedTags: ['documentation', 'knowledge-sharing'],
        confidence: 0.9
      };
    }
    
    // Default fallback suggestion
    return {
      suggestedDescription: `Complete task: "${title}". ${context ? `Context: ${context}. ` : ''}Recommended approach: 1) Break down into smaller subtasks, 2) Research requirements, 3) Plan implementation, 4) Execute step by step, 5) Review and validate results.`,
      estimatedMinutes: 120,
      suggestedTags: ['general', 'planning'],
      confidence: 0.6
    };
  }
}
