import React, { useState, useEffect, useRef } from 'react';
import { Tag, TagCategory } from '../../../types';
import { tagsService, tagCategoriesService } from '../../../services/databaseService';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowCreate?: boolean;
  className?: string;
  disabled?: boolean;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  placeholder = "Search or create tags...",
  maxTags,
  allowCreate = true,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      filterTags();
    } else {
      setFilteredTags([]);
      loadSuggestions();
    }
  }, [searchQuery, allTags]);

  const loadTags = async () => {
    try {
      const [tagsData, categoriesData] = await Promise.all([
        tagsService.getAll(),
        tagCategoriesService.getAll()
      ]);
      setAllTags(tagsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const filterTags = () => {
    const filtered = allTags.filter((tag: Tag) => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedTags.includes(tag.name)
    );
    setFilteredTags(filtered);
  };

  const loadSuggestions = async () => {
    try {
      const suggestions = await tagsService.getTagSuggestions('task', {});
      setSuggestedTags(suggestions.filter(tag => !selectedTags.includes(tag.name)).slice(0, 8));
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for click events
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const availableOptions = searchQuery ? filteredTags : suggestedTags;
    const canCreateNew = allowCreate && searchQuery && !allTags.some(tag => tag.name.toLowerCase() === searchQuery.toLowerCase());

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < (canCreateNew ? availableOptions.length : availableOptions.length - 1) ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : (canCreateNew ? availableOptions.length : availableOptions.length - 1)
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (canCreateNew && highlightedIndex === availableOptions.length) {
            handleCreateNewTag();
          } else if (availableOptions[highlightedIndex]) {
            handleSelectTag(availableOptions[highlightedIndex].name);
          }
        } else if (canCreateNew && searchQuery) {
          handleCreateNewTag();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'Backspace':
        if (!searchQuery && selectedTags.length > 0) {
          removeTag(selectedTags[selectedTags.length - 1]);
        }
        break;
    }
  };

  const handleSelectTag = (tagName: string) => {
    if (maxTags && selectedTags.length >= maxTags) return;
    
    if (!selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName]);
    }
    setSearchQuery('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleCreateNewTag = async () => {
    if (!searchQuery.trim() || disabled) return;
    
    try {
      setLoading(true);
      
      // Get the first category as default
      const defaultCategory = categories[0];
      if (!defaultCategory) {
        alert('Please create a tag category first');
        return;
      }

      const newTag = await tagsService.create({
        name: searchQuery.trim(),
        description: `Auto-created tag: ${searchQuery.trim()}`,
        category_id: defaultCategory.id,
        color: '#6B7280',
        usage_count: 0
      });

      await loadTags();
      handleSelectTag(newTag.name);
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Failed to create tag. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeTag = (tagName: string) => {
    if (disabled) return;
    onTagsChange(selectedTags.filter(tag => tag !== tagName));
  };

  const getTagColor = (tagName: string): string => {
    const tag = allTags.find(t => t.name === tagName);
    return tag?.color || '#6B7280';
  };

  const getCategoryName = (tagName: string): string => {
    const tag = allTags.find(t => t.name === tagName);
    if (!tag) return '';
    const category = categories.find(c => c.id === tag.category_id);
    return category?.label || '';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Tags */}
      <div className={`flex flex-wrap gap-2 p-2 border rounded-lg bg-white min-h-[44px] ${
        disabled ? 'bg-gray-50' : 'hover:border-blue-300'
      } ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}`}>
        {selectedTags.map(tagName => (
          <span
            key={tagName}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm text-white"
            style={{ backgroundColor: getTagColor(tagName) }}
          >
            <span>{tagName}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tagName)}
                className="text-white hover:text-gray-200 text-xs"
              >
                ×
              </button>
            )}
          </span>
        ))}
        
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          disabled={disabled || (maxTags ? selectedTags.length >= maxTags : false)}
          className="flex-1 min-w-[120px] outline-none bg-transparent"
        />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {searchQuery ? (
            // Search Results
            <div>
              {filteredTags.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                    Existing Tags
                  </div>
                  {filteredTags.map((tag, index) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleSelectTag(tag.name)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${
                        highlightedIndex === index ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{getCategoryName(tag.name)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Create New Option */}
              {allowCreate && !allTags.some(tag => tag.name.toLowerCase() === searchQuery.toLowerCase()) && (
                <div>
                  {filteredTags.length > 0 && <div className="border-t" />}
                  <button
                    type="button"
                    onClick={handleCreateNewTag}
                    disabled={loading}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                      highlightedIndex === filteredTags.length ? 'bg-blue-50' : ''
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-3 h-3 border border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Create "{searchQuery}"</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {filteredTags.length === 0 && !allowCreate && (
                <div className="px-3 py-2 text-gray-500 text-center">
                  No tags found
                </div>
              )}
            </div>
          ) : (
            // Suggestions
            <div>
              {suggestedTags.length > 0 ? (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                    Suggested Tags
                  </div>
                  {suggestedTags.map((tag, index) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleSelectTag(tag.name)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${
                        highlightedIndex === index ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {tag.usage_count || 0} uses
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 text-gray-500 text-center">
                  No suggestions available
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Max Tags Warning */}
      {maxTags && selectedTags.length >= maxTags && (
        <p className="mt-1 text-xs text-amber-600">
          Maximum {maxTags} tags allowed
        </p>
      )}
    </div>
  );
};

export default TagSelector; 