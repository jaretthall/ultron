import React, { useState, useEffect, useRef, useMemo } from 'react';
// import { Project, Task } from '../../types';
import { useAppState } from '../contexts/AppStateContext';

interface SearchResult {
  type: 'project' | 'task' | 'tag';
  id: string;
  title: string;
  description?: string;
  subtitle?: string;
  priority?: string;
  status?: string;
  context?: string;
  tags?: string[];
  relevanceScore: number;
}

interface GlobalSearchProps {
  placeholder?: string;
  onResultSelect?: (result: any) => void;
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: SearchResult) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { state } = useAppState();
  const { projects, tasks } = state;

  // Advanced search algorithm with relevance scoring
  const performSearch = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    const results: SearchResult[] = [];

    // Search Projects
    projects.forEach(project => {
      let relevanceScore = 0;
      // const projectText = `${project.title} ${project.description} ${project.goals?.join(' ') || ''}`.toLowerCase();
      
      // Calculate relevance score
      searchTerms.forEach(term => {
        if (project.title.toLowerCase().includes(term)) relevanceScore += 10;
        if (project.description?.toLowerCase().includes(term)) relevanceScore += 5;
        if (project.goals?.some(goal => goal.toLowerCase().includes(term))) relevanceScore += 3;
        if (project.tags?.some(tag => tag.toLowerCase().includes(term))) relevanceScore += 2;
      });

      // Exact matches get bonus points
      if (project.title.toLowerCase().includes(query.toLowerCase())) relevanceScore += 15;

      if (relevanceScore > 0) {
        results.push({
          type: 'project',
          id: project.id,
          title: project.title,
          description: project.description,
          subtitle: `${project.status} • ${project.context} project`,
          context: project.context,
          status: project.status,
          tags: project.tags,
          relevanceScore
        });
      }
    });

    // Search Tasks
    tasks.forEach(task => {
      let relevanceScore = 0;
      // const taskText = `${task.title} ${task.description}`.toLowerCase();
      
      searchTerms.forEach(term => {
        if (task.title.toLowerCase().includes(term)) relevanceScore += 10;
        if (task.description?.toLowerCase().includes(term)) relevanceScore += 5;
        if (task.tags?.some(tag => tag.toLowerCase().includes(term))) relevanceScore += 2;
      });

      // Exact matches get bonus points
      if (task.title.toLowerCase().includes(query.toLowerCase())) relevanceScore += 15;

      // Priority and status boost
      if (task.priority === 'urgent' || task.priority === 'high') relevanceScore += 2;
      if (task.status === 'in-progress') relevanceScore += 1;

      if (relevanceScore > 0) {
        const project = projects.find(p => p.id === task.project_id);
        results.push({
          type: 'task',
          id: task.id,
          title: task.title,
          description: task.description,
          subtitle: `${task.priority} priority • ${task.status}${project ? ` • ${project.title}` : ''}`,
          priority: task.priority,
          status: task.status,
          tags: task.tags,
          relevanceScore
        });
      }
    });

    // Search Tags (collect unique tags)
    const allTags = new Set<string>();
    [...projects, ...tasks].forEach(item => {
      item.tags?.forEach(tag => allTags.add(tag));
    });

    Array.from(allTags).forEach(tag => {
      let relevanceScore = 0;
      searchTerms.forEach(term => {
        if (tag.toLowerCase().includes(term)) relevanceScore += 8;
      });

      if (tag.toLowerCase().includes(query.toLowerCase())) relevanceScore += 12;

      if (relevanceScore > 0) {
        const taggedItems = [...projects, ...tasks].filter(item => 
          item.tags?.includes(tag)
        ).length;

        results.push({
          type: 'tag',
          id: tag,
          title: tag,
          subtitle: `Tag • ${taggedItems} item${taggedItems !== 1 ? 's' : ''}`,
          relevanceScore
        });
      }
    });

    // Sort by relevance score and limit results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }, [query, projects, tasks]);

  useEffect(() => {
    setSearchResults(performSearch);
    setSelectedIndex(0);
  }, [performSearch]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            onSelectResult(searchResults[selectedIndex]);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, onSelectResult, onClose]);

  // Get icon for result type
  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'project':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'task':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'tag':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
    }
  };

  // Get color for result type
  const getResultColor = (result: SearchResult) => {
    switch (result.type) {
      case 'project':
        return 'text-emerald-400';
      case 'task':
        return result.priority === 'urgent' ? 'text-red-400' : 
               result.priority === 'high' ? 'text-orange-400' : 'text-blue-400';
      case 'tag':
        return 'text-purple-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 border border-slate-600">
        {/* Search Input */}
        <div className="p-4 border-b border-slate-600">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, tasks, and tags..."
              className="w-full pl-10 pr-4 py-3 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400">
              ESC to close
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>Start typing to search across your projects, tasks, and tags</p>
              <p className="text-xs mt-2">Use ↑↓ to navigate, Enter to select</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No results found for "{query}"</p>
              <p className="text-xs mt-2">Try different keywords or check spelling</p>
            </div>
          ) : (
            <div className="py-2">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex 
                      ? 'bg-slate-700 border-l-4 border-sky-400' 
                      : 'hover:bg-slate-700/50'
                  }`}
                  onClick={() => {
                    onSelectResult(result);
                    onClose();
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`mt-0.5 ${getResultColor(result)}`}>
                      {getResultIcon(result)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-slate-100 font-medium truncate">{result.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          result.type === 'project' ? 'bg-emerald-900/50 text-emerald-300' :
                          result.type === 'task' ? 'bg-blue-900/50 text-blue-300' :
                          'bg-purple-900/50 text-purple-300'
                        }`}>
                          {result.type}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p className="text-slate-400 text-sm mt-1">{result.subtitle}</p>
                      )}
                      {result.description && (
                        <p className="text-slate-500 text-xs mt-1 truncate">{result.description}</p>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-slate-600 text-slate-300 rounded">
                              {tag}
                            </span>
                          ))}
                          {result.tags.length > 3 && (
                            <span className="text-xs text-slate-400">+{result.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    {index === selectedIndex && (
                      <div className="text-sky-400 text-xs">
                        ⏎
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-600 bg-slate-750 rounded-b-xl">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <div className="flex space-x-4">
              <span>↑↓ Navigate</span>
              <span>⏎ Select</span>
              <span>ESC Close</span>
            </div>
            <div>
              {searchResults.length > 0 && `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch; 