import React, { useState } from 'react';
import { AiSuggestRequest, AiSuggestResponse } from '@/types';
import { aiApi } from '@/services/api';

interface AiSuggestProps {
  onSuggestionAccepted?: (suggestion: AiSuggestResponse & { originalTitle: string }) => void;
  initialTitle?: string;
}

const AiSuggest: React.FC<AiSuggestProps> = ({ onSuggestionAccepted, initialTitle = '' }) => {
  const [title, setTitle] = useState(initialTitle);
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AiSuggestResponse | null>(null);
  const [error, setError] = useState('');

  const handleGetSuggestion = async () => {
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const request: AiSuggestRequest = {
        title: title.trim(),
        context: context.trim() || undefined
      };

      const response = await aiApi.suggestTaskDescription(request);
      
      if (response.success && response.data) {
        setSuggestion(response.data);
      } else {
        setError(response.message || 'Failed to get AI suggestion');
      }
    } catch (err) {
      setError('Failed to get AI suggestion. Please try again.');
      console.error('AI suggestion error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (suggestion && onSuggestionAccepted) {
      onSuggestionAccepted({
        ...suggestion,
        originalTitle: title.trim()
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h3 className="text-lg font-semibold text-gray-800">AI Task Assistant</h3>
      </div>

      {/* Input Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="ai-title" className="block text-sm font-medium text-gray-700 mb-1">
            Task Title *
          </label>
          <input
            id="ai-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Fix login bug, Implement dark mode, Add user search..."
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label htmlFor="ai-context" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Context (Optional)
          </label>
          <textarea
            id="ai-context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Provide any additional details that might help generate better suggestions..."
            rows={2}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          onClick={handleGetSuggestion}
          disabled={isLoading || !title.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Getting AI Suggestions...
            </>
          ) : (
            <>
              <span>✨</span>
              Get AI Suggestions
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* AI Suggestion Results */}
      {suggestion && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">AI Suggestions</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Confidence:</span>
              <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                {getConfidenceText(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Suggested Description:</h5>
              <p className="text-sm text-gray-600 bg-white p-3 rounded border leading-relaxed">
                {suggestion.suggestedDescription}
              </p>
            </div>

            <div className="flex gap-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Estimated Time:</h5>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {suggestion.estimatedMinutes} minutes
                </span>
              </div>

              {suggestion.suggestedTags && suggestion.suggestedTags.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Suggested Tags:</h5>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.suggestedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {onSuggestionAccepted && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={handleAcceptSuggestion}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                >
                  Accept Suggestion
                </button>
                <p className="text-xs text-gray-500 italic">
                  💡 Tip: Not satisfied? Update the title or context above and generate a new suggestion!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiSuggest;
