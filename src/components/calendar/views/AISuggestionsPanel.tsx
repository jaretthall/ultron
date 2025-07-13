import React, { useState, useMemo } from 'react';
import { AIScheduleSuggestion } from '../../../services/calendarIntegrationService';
import ModifyTimeModal from '../ModifyTimeModal';

interface AISuggestionsPanelProps {
  suggestions: AIScheduleSuggestion[];
  onApprove: (suggestion: AIScheduleSuggestion) => void;
  onApproveAll: (suggestions: AIScheduleSuggestion[]) => void;
  onApproveAndEdit: (suggestions: AIScheduleSuggestion[], feedback: string) => void;
  onProvideFeedback: (feedback: string, commonIssues: string[]) => void;
  onDeny: (suggestionId: string) => void;
  onClose: () => void;
  onRefresh?: () => void;
  onReset?: () => void;
  onAddLunchBreak?: (time: string) => void;
  onAddBufferTime?: (minutes: number) => void;
  onShiftAllBack?: (minutes: number) => void;
}

const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  suggestions,
  onApprove,
  onApproveAll,
  onApproveAndEdit,
  onProvideFeedback,
  onDeny,
  onClose,
  onRefresh,
  onReset,
  onAddLunchBreak,
  onAddBufferTime,
  onShiftAllBack
}) => {
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedCommonIssues, setSelectedCommonIssues] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'individual' | 'chronological'>('chronological');
  const [showModifyTimeModal, setShowModifyTimeModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AIScheduleSuggestion | null>(null);

  // Common feedback issues
  const commonIssues = [
    'Allow more time for traffic/travel',
    'Tasks are scheduled too close together',
    'Need longer blocks for deep work',
    'Prefer different times of day',
    'Wrong energy level matching',
    'Missing buffer time between meetings',
    'Business tasks suggested during personal time',
    'Personal tasks suggested during business hours',
    'Weekend scheduling should be personal only',
    'Evening scheduling should be personal only',
    'Need time for breaks/meals'
  ];

  // Handle common issue toggle
  const toggleCommonIssue = (issue: string) => {
    setSelectedCommonIssues(prev => 
      prev.includes(issue) 
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  // Filter and sort suggestions
  const pendingSuggestions = useMemo(() => {
    return suggestions
      .filter(s => s.status === 'pending')
      .sort((a, b) => {
        if (viewMode === 'chronological') {
          // Sort by suggested start time for chronological view
          return a.suggestedStart.getTime() - b.suggestedStart.getTime();
        } else {
          // Sort by confidence (high to low), then by suggested start time
          if (a.confidence !== b.confidence) {
            return b.confidence - a.confidence;
          }
          return a.suggestedStart.getTime() - b.suggestedStart.getTime();
        }
      });
  }, [suggestions, viewMode]);

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

  // Handle feedback submission
  const handleFeedbackSubmit = () => {
    const combinedFeedback = [
      ...selectedCommonIssues,
      ...(feedbackText.trim() ? [feedbackText.trim()] : [])
    ].join('\n• ');
    
    if (combinedFeedback) {
      onProvideFeedback(combinedFeedback, selectedCommonIssues);
    }
    
    // Reset form
    setFeedbackText('');
    setSelectedCommonIssues([]);
    setShowFeedbackForm(false);
  };

  // Handle approve all
  const handleApproveAll = () => {
    onApproveAll(pendingSuggestions);
  };

  // Handle approve and edit
  const handleApproveAndEdit = () => {
    const combinedFeedback = [
      ...selectedCommonIssues,
      ...(feedbackText.trim() ? [feedbackText.trim()] : [])
    ].join('\n• ');
    
    onApproveAndEdit(pendingSuggestions, combinedFeedback);
    
    // Reset form
    setFeedbackText('');
    setSelectedCommonIssues([]);
    setShowFeedbackForm(false);
  };

  // Handle modify time
  const handleModifyTime = (suggestion: AIScheduleSuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowModifyTimeModal(true);
  };

  const handleSaveModifiedTime = (suggestion: AIScheduleSuggestion, newStart: Date, newEnd: Date) => {
    // Create a modified suggestion
    const modifiedSuggestion: AIScheduleSuggestion = {
      ...suggestion,
      suggestedStart: newStart,
      suggestedEnd: newEnd,
      reasoning: `${suggestion.reasoning} (Modified by user to ${newStart.toLocaleDateString()} at ${newStart.toLocaleTimeString()})`
    };
    
    // Approve the modified suggestion
    onApprove(modifiedSuggestion);
    setShowModifyTimeModal(false);
    setSelectedSuggestion(null);
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
            <div className="space-y-2 mt-4 pt-3 border-t border-gray-100">
              <div className="flex gap-2">
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
              
              <button
                onClick={() => handleModifyTime(suggestion)}
                className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modify Time
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Schedule Plan
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {pendingSuggestions.length} pending suggestions • {approvedSuggestions.length} approved
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Refresh AI suggestions"
                title="Refresh suggestions based on current tasks and completed items"
              >
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            
            {onReset && (
              <button
                onClick={onReset}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Reset AI suggestions"
                title="Clear all suggestions and generate fresh ones"
              >
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            
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

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('chronological')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'chronological'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Chronological
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'individual'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              By Confidence
            </button>
          </div>

          {/* Plan-wide Actions */}
          {pendingSuggestions.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  showFeedbackForm
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Provide Feedback
              </button>
              <button
                onClick={handleApproveAll}
                className="px-3 py-1 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Approve All
              </button>
            </div>
          )}
        </div>

        {/* Health & Schedule Actions */}
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Health & Timing Adjustments
          </h4>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            {onAddLunchBreak && (
              <>
                <button
                  onClick={() => onAddLunchBreak('12:00')}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
                >
                  🍽️ Lunch 12PM
                </button>
                <button
                  onClick={() => onAddLunchBreak('12:30')}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
                >
                  🍽️ Lunch 12:30PM
                </button>
              </>
            )}
            
            {onAddBufferTime && (
              <>
                <button
                  onClick={() => onAddBufferTime(15)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
                >
                  ⏰ +15min Buffer
                </button>
                <button
                  onClick={() => onAddBufferTime(30)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
                >
                  ⏰ +30min Buffer
                </button>
              </>
            )}
          </div>

          {onShiftAllBack && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onShiftAllBack(30)}
                className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
              >
                ⬅️ Shift Back 30m
              </button>
              <button
                onClick={() => onShiftAllBack(60)}
                className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded transition-colors flex items-center justify-center gap-1"
              >
                ⬅️ Shift Back 1h
              </button>
            </div>
          )}

          <p className="text-xs text-green-700 dark:text-green-400 mt-2">
            💡 <strong>Health Tip:</strong> Regular meals and breaks improve focus and prevent burnout
          </p>
        </div>

        {/* Feedback Form */}
        {showFeedbackForm && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Provide Feedback on This Schedule Plan
            </h3>
            
            {/* Common Issues */}
            <div className="mb-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Common issues (select any that apply):</p>
              <div className="grid grid-cols-1 gap-2">
                {commonIssues.map((issue) => (
                  <label key={issue} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedCommonIssues.includes(issue)}
                      onChange={() => toggleCommonIssue(issue)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{issue}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Feedback */}
            <div className="mb-4">
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                Additional feedback:
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Any other adjustments needed? (e.g., 'Group similar tasks together', 'Schedule important calls in the morning')"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100"
                rows={3}
              />
            </div>

            {/* Feedback Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleApproveAndEdit}
                disabled={selectedCommonIssues.length === 0 && !feedbackText.trim()}
                className="px-3 py-1 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Approve & Edit
              </button>
              <button
                onClick={handleFeedbackSubmit}
                disabled={selectedCommonIssues.length === 0 && !feedbackText.trim()}
                className="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Request New Plan
              </button>
              <button
                onClick={() => {
                  setShowFeedbackForm(false);
                  setFeedbackText('');
                  setSelectedCommonIssues([]);
                }}
                className="px-3 py-1 text-sm font-medium bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
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

        {/* Modify Time Modal */}
        <ModifyTimeModal
          isOpen={showModifyTimeModal}
          onClose={() => {
            setShowModifyTimeModal(false);
            setSelectedSuggestion(null);
          }}
          onSave={handleSaveModifiedTime}
          suggestion={selectedSuggestion}
        />
      </div>
    </div>
  );
};

export default AISuggestionsPanel;