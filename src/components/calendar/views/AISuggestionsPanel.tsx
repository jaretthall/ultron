import React, { useState, useMemo } from 'react';
import { AIScheduleSuggestion } from '../../../services/calendarIntegrationService';

interface AISuggestionsPanelProps {
  suggestions: AIScheduleSuggestion[];
  onApprove: (suggestion: AIScheduleSuggestion) => void;
  onDeny: (suggestionId: string) => void;
  onClose: () => void;
}

const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  suggestions,
  onApprove,
  onDeny,
  onClose
}) => {
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());

  // Filter and sort suggestions
  const pendingSuggestions = useMemo(() => {
    return suggestions
      .filter(s => s.status === 'pending')
      .sort((a, b) => {
        // Sort by confidence (high to low), then by suggested start time
        if (a.confidence !== b.confidence) {
          return b.confidence - a.confidence;
        }
        return a.suggestedStart.getTime() - b.suggestedStart.getTime();
      });
  }, [suggestions]);

  const approvedSuggestions = useMemo(() => {
    return suggestions.filter(s => s.status === 'approved');
  }, [suggestions]);

  // const deniedSuggestions = useMemo(() => {
  //   return suggestions.filter(s => s.status === 'denied');
  // }, [suggestions]);

  // Toggle expanded state for suggestion details
  const toggleExpanded = (suggestionId: string) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(suggestionId)) {
      newExpanded.delete(suggestionId);
    } else {
      newExpanded.add(suggestionId);
    }
    setExpandedSuggestions(newExpanded);
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-700 bg-green-200 dark:text-green-300 dark:bg-green-800';
    if (confidence >= 0.6) return 'text-yellow-700 bg-yellow-200 dark:text-yellow-300 dark:bg-yellow-800';
    return 'text-red-700 bg-red-200 dark:text-red-300 dark:bg-red-800';
  };

  // Get confidence label
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900';
      case 'high': return 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900';
      case 'medium': return 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900';
      case 'low': return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900';
      default: return 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800';
    }
  };

  // Format time range
  const formatTimeRange = (start: Date, end: Date) => {
    const startTime = start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const endTime = end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const date = start.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `${date}, ${startTime} - ${endTime}`;
  };

  // Calculate duration
  const getDuration = (start: Date, end: Date) => {
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const SuggestionCard: React.FC<{ suggestion: AIScheduleSuggestion; showActions?: boolean }> = ({ 
    suggestion, 
    showActions = true 
  }) => {
    const isExpanded = expandedSuggestions.has(suggestion.id);
    const confidence = suggestion.confidence;
    const confidenceColor = getConfidenceColor(confidence);
    const confidenceLabel = getConfidenceLabel(confidence);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                📋 {suggestion.taskTitle}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatTimeRange(suggestion.suggestedStart, suggestion.suggestedEnd)}
              </p>
              {suggestion.taskPriority && (
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getPriorityColor(suggestion.taskPriority)}`}>
                  {suggestion.taskPriority.charAt(0).toUpperCase() + suggestion.taskPriority.slice(1)} Priority
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${confidenceColor}`}>
                {confidenceLabel}
              </span>
              
              <button
                onClick={() => toggleExpanded(suggestion.id)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                <svg 
                  className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{getDuration(suggestion.suggestedStart, suggestion.suggestedEnd)}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      confidence >= 0.8 ? 'bg-green-500' :
                      confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{Math.round(confidence * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3 space-y-3">
              <div>
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Reasoning</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {suggestion.reasoning}
                </p>
              </div>
              
              {suggestion.conflictsWith && suggestion.conflictsWith.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">⚠️ Potential Conflicts</h4>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    This suggestion may conflict with {suggestion.conflictsWith.length} existing event(s).
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Task ID:</span>
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {suggestion.taskId}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && suggestion.status === 'pending' && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => onApprove(suggestion)}
                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve
              </button>
              
              <button
                onClick={() => onDeny(suggestion.id)}
                className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Deny
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Suggestions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {pendingSuggestions.length} pending, {approvedSuggestions.length} approved
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close AI suggestions panel"
          >
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Pending Suggestions */}
        {pendingSuggestions.length > 0 && (
          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Pending Review ({pendingSuggestions.length})
            </h3>
            <div className="space-y-3">
              {pendingSuggestions.map(suggestion => (
                <SuggestionCard 
                  key={suggestion.id} 
                  suggestion={suggestion} 
                  showActions={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Approved Suggestions */}
        {approvedSuggestions.length > 0 && (
          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Recently Approved ({approvedSuggestions.length})
            </h3>
            <div className="space-y-3">
              {approvedSuggestions.slice(0, 3).map(suggestion => (
                <SuggestionCard 
                  key={suggestion.id} 
                  suggestion={suggestion} 
                  showActions={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {pendingSuggestions.length === 0 && approvedSuggestions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI suggestions</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              AI will automatically suggest optimal times for scheduling your unscheduled tasks.
            </p>
          </div>
        )}

        {/* Footer info */}
        {suggestions.length > 0 && (
          <div className="border-t border-gray-200 pt-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">How AI suggestions work:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• AI analyzes your tasks, deadlines, and schedule</li>
                    <li>• Suggests optimal time slots based on priority and energy levels</li>
                    <li>• You can approve, deny, or manually adjust suggestions</li>
                    <li>• AI learns from your preferences over time</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISuggestionsPanel;