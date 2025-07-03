import React, { useState, useEffect } from 'react';
import { Tag } from '../../../types';
import { tagsService } from '../../../services/databaseService';
import { useAppState } from '../../contexts/AppStateContext';

interface TagSearchProps {
  onResultsChange: (results: {
    projects: any[];
    tasks: any[];
    totalResults: number;
    selectedTags: string[];
  }) => void;
  entityTypes?: ('projects' | 'tasks' | 'documents' | 'schedules')[];
  matchType?: 'any' | 'all';
  placeholder?: string;
  className?: string;
}

const TagSearch: React.FC<TagSearchProps> = ({
  entityTypes = ['projects', 'tasks'],
  matchType = 'any',
  placeholder = "Search by tags...",
  className = ""
}) => {
  const { state } = useAppState();
  const { projects, tasks } = state;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);

  const [showDropdown, setShowDropdown] = useState(false);
  const [matchTypeState, setMatchType] = useState<'any' | 'all'>(matchType);
  const [searchResults, setSearchResults] = useState<{
    projects: any[];
    tasks: any[];
    totalResults: number;
    selectedTags?: string[];
  }>({
    projects: [],
    tasks: [],
    totalResults: 0
  });

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = availableTags.filter(tag =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedTags.includes(tag.name)
      );
      setFilteredTags(filtered);
      setShowDropdown(true);
    } else {
      setFilteredTags([]);
      setShowDropdown(false);
    }
  }, [searchQuery, availableTags, selectedTags]);

  useEffect(() => {
    if (selectedTags.length > 0) {
      const searchResults = {
        projects: projects.filter(project => 
          selectedTags.some(tag => project.tags?.includes(tag))
        ),
        tasks: tasks.filter(task => 
          selectedTags.some(tag => task.tags?.includes(tag))
        ),
        totalResults: 0,
        selectedTags
      };
      searchResults.totalResults = searchResults.projects.length + searchResults.tasks.length;
      setSearchResults(searchResults);
    }
  }, [selectedTags, projects, tasks]);

  const loadTags = async () => {
    try {
      const tags = await tagsService.getAll();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };



  const handleTagSelect = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleTagRemove = (tagName: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagName));
  };

  const handleClearAll = () => {
    setSelectedTags([]);
    setSearchQuery('');
  };

  const getTagColor = (tagName: string): string => {
    const tag = availableTags.find(t => t.name === tagName);
    return tag?.color || '#6B7280';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input and Controls */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            {/* Dropdown */}
            {showDropdown && filteredTags.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagSelect(tag.name)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {tag.usage_count || 0} uses
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Match Type Toggle */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setMatchType('any')}
              className={`px-3 py-1 rounded text-sm ${
                matchTypeState === 'any'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Match Any
            </button>
            <button
              onClick={() => setMatchType('all')}
              className={`px-3 py-1 rounded text-sm ${
                matchTypeState === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Match All
            </button>
          </div>

          {/* Clear Button */}
          {selectedTags.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>

        {/* Match Type Explanation */}
        <p className="text-xs text-gray-500">
          {matchTypeState === 'any' 
            ? 'Show items that have any of the selected tags'
            : 'Show items that have all of the selected tags'
          }
        </p>
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tagName => (
            <span
              key={tagName}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm text-white"
              style={{ backgroundColor: getTagColor(tagName) }}
            >
              <span>{tagName}</span>
              <button
                onClick={() => handleTagRemove(tagName)}
                className="text-white hover:text-gray-200 text-xs"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Results Summary */}
      {selectedTags.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Search Results</h4>
                <span className="text-sm text-gray-600">
                  {searchResults.totalResults} total results
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {entityTypes.includes('projects') && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Projects:</span>
                    <span className="font-medium">{searchResults.projects.length}</span>
                  </div>
                )}
                {entityTypes.includes('tasks') && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tasks:</span>
                    <span className="font-medium">{searchResults.tasks.length}</span>
                  </div>
                )}
              </div>

              {searchResults.totalResults === 0 && selectedTags.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No items found with the selected tags. Try using "Any" match type or different tags.
                </p>
              )}
            </div>
        </div>
      )}

      {/* Popular Tags Quick Select */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Popular Tags</h4>
        <div className="flex flex-wrap gap-2">
          {availableTags
            .filter(tag => !selectedTags.includes(tag.name))
            .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
            .slice(0, 8)
            .map(tag => (
              <button
                key={tag.id}
                onClick={() => handleTagSelect(tag.name)}
                className="inline-flex items-center space-x-1 px-2 py-1 text-xs border rounded hover:bg-gray-50"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span>{tag.name}</span>
                <span className="text-gray-500">({tag.usage_count || 0})</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TagSearch; 