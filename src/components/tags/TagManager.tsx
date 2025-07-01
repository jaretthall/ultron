import React, { useState, useEffect } from 'react';
import { Tag, TagCategory } from '../../../types';
import { tagsService, tagCategoriesService } from '../../services/databaseService';

interface TagManagerProps {
  onClose?: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({ onClose }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewTagModalOpen, setIsNewTagModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tags' | 'categories' | 'analytics'>('tags');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tagsData, categoriesData, analyticsData] = await Promise.all([
        tagsService.getAll(),
        tagCategoriesService.getAllWithTagCounts(),
        tagsService.getTagAnalytics()
      ]);
      
      setTags(tagsData);
      setCategories(categoriesData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading tag data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tag.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tag.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTag = async (tagData: Omit<Tag, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await tagsService.create(tagData);
      await loadData();
      setIsNewTagModalOpen(false);
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleUpdateTag = async (id: string, updates: Partial<Tag>) => {
    try {
      await tagsService.update(id, updates);
      await loadData();
      setEditingTag(null);
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag? This action cannot be undone.')) return;
    
    try {
      await tagsService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const handleCreateCategory = async (categoryData: Omit<TagCategory, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await tagCategoriesService.create(categoryData);
      await loadData();
      setIsNewCategoryModalOpen(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleUpdateCategory = async (id: string, updates: Partial<TagCategory>) => {
    try {
      await tagCategoriesService.update(id, updates);
      await loadData();
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    const tagCount = (category as any).tagCount || 0;
    if (tagCount > 0) {
      alert(`Cannot delete category "${category.name}" because it contains ${tagCount} tags. Please move or delete the tags first.`);
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await tagCategoriesService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleBulkUpdateUsageCounts = async () => {
    try {
      setLoading(true);
      await tagsService.updateUsageCounts();
      await loadData();
    } catch (error) {
      console.error('Error updating usage counts:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Loading tag data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Tag Manager</h2>
            <p className="text-gray-600">Manage tags, categories, and analyze usage patterns</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'tags', label: 'Tags', count: tags.length },
            { id: 'categories', label: 'Categories', count: categories.length },
            { id: 'analytics', label: 'Analytics', count: analytics?.totalTags || 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'tags' && (
            <TagsTab
              tags={filteredTags}
              categories={categories}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              onSearchChange={setSearchQuery}
              onCategoryChange={setSelectedCategory}
              onCreateTag={() => setIsNewTagModalOpen(true)}
              onEditTag={setEditingTag}
              onDeleteTag={handleDeleteTag}
              onUpdateUsageCounts={handleBulkUpdateUsageCounts}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesTab
              categories={categories}
              onCreateCategory={() => setIsNewCategoryModalOpen(true)}
              onEditCategory={setEditingCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === 'analytics' && analytics && (
            <AnalyticsTab analytics={analytics} />
          )}
        </div>

        {/* Modals */}
        {isNewTagModalOpen && (
          <TagModal
            categories={categories}
            onSave={handleCreateTag}
            onClose={() => setIsNewTagModalOpen(false)}
          />
        )}

        {isNewCategoryModalOpen && (
          <CategoryModal
            onSave={handleCreateCategory}
            onClose={() => setIsNewCategoryModalOpen(false)}
          />
        )}

        {editingTag && (
          <TagModal
            tag={editingTag}
            categories={categories}
            onSave={(data) => handleUpdateTag(editingTag.id, data)}
            onClose={() => setEditingTag(null)}
          />
        )}

        {editingCategory && (
          <CategoryModal
            category={editingCategory}
            onSave={(data) => handleUpdateCategory(editingCategory.id, data)}
            onClose={() => setEditingCategory(null)}
          />
        )}
      </div>
    </div>
  );
};

// Tags Tab Component
interface TagsTabProps {
  tags: Tag[];
  categories: TagCategory[];
  searchQuery: string;
  selectedCategory: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onCreateTag: () => void;
  onEditTag: (tag: Tag) => void;
  onDeleteTag: (id: string) => void;
  onUpdateUsageCounts: () => void;
}

const TagsTab: React.FC<TagsTabProps> = ({
  tags,
  categories,
  searchQuery,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  onCreateTag,
  onEditTag,
  onDeleteTag,
  onUpdateUsageCounts
}) => {
  return (
    <div className="p-6 h-full flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.label} ({(category as any).tagCount || 0})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onUpdateUsageCounts}
            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
          >
            Refresh Usage Counts
          </button>
          <button
            onClick={onCreateTag}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            New Tag
          </button>
        </div>
      </div>

      {/* Tags Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map(tag => {
            const category = categories.find(c => c.id === tag.category_id);
            return (
              <div
                key={tag.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color || '#6B7280' }}
                    />
                    <h3 className="font-medium">{tag.name}</h3>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditTag(tag)}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteTag(tag.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {tag.description && (
                  <p className="text-sm text-gray-600 mb-2">{tag.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {category?.label || 'No Category'}
                  </span>
                  <span>{tag.usage_count || 0} uses</span>
                </div>
              </div>
            );
          })}
        </div>

        {tags.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tags found</h3>
            <p className="text-gray-500">Create your first tag to get started with organization.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Categories Tab Component
interface CategoriesTabProps {
  categories: (TagCategory & { tagCount?: number; totalUsage?: number })[];
  onCreateCategory: () => void;
  onEditCategory: (category: TagCategory) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categories,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory
}) => {
  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Tag Categories</h3>
        <button
          onClick={onCreateCategory}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          New Category
        </button>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-4">
          {categories.map(category => (
            <div
              key={category.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: category.color || '#6B7280' }}
                  />
                  <div>
                    <h4 className="font-medium">{category.label}</h4>
                    <p className="text-sm text-gray-600">{category.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right text-sm text-gray-500">
                    <div>{category.tagCount || 0} tags</div>
                    <div>{category.totalUsage || 0} total uses</div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditCategory(category)}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteCategory(category.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {category.description && (
                <p className="text-sm text-gray-600 mt-2">{category.description}</p>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500">Create categories to organize your tags better.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Analytics Tab Component
interface AnalyticsTabProps {
  analytics: any;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ analytics }) => {
  return (
    <div className="p-6 h-full overflow-auto">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900">Total Tags</h3>
          <p className="text-3xl font-bold text-blue-600">{analytics.totalTags}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900">Categories</h3>
          <p className="text-3xl font-bold text-green-600">{analytics.categoryStats.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-900">Orphaned Tags</h3>
          <p className="text-3xl font-bold text-yellow-600">{analytics.orphanedTags.length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900">Active Tags</h3>
          <p className="text-3xl font-bold text-purple-600">
            {analytics.tagUsageStats.filter((stat: any) => stat.totalUsage > 0).length}
          </p>
        </div>
      </div>

      {/* Most Used Tags */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Most Used Tags</h3>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Tag</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Projects</th>
                <th className="text-left p-4">Tasks</th>
                <th className="text-left p-4">Total Usage</th>
                <th className="text-left p-4">Trend</th>
              </tr>
            </thead>
            <tbody>
              {analytics.tagUsageStats
                .sort((a: any, b: any) => b.totalUsage - a.totalUsage)
                .slice(0, 10)
                .map((stat: any) => (
                  <tr key={stat.tag.id} className="border-t">
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: stat.tag.color || '#6B7280' }}
                        />
                        <span className="font-medium">{stat.tag.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {analytics.categoryStats.find((cat: any) => cat.category.id === stat.tag.category_id)?.category.label || 'No Category'}
                    </td>
                    <td className="p-4">{stat.projectUsage}</td>
                    <td className="p-4">{stat.taskUsage}</td>
                    <td className="p-4 font-semibold">{stat.totalUsage}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        stat.trendDirection === 'up' ? 'bg-green-100 text-green-800' :
                        stat.trendDirection === 'down' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {stat.trendDirection === 'up' ? '↗️' : stat.trendDirection === 'down' ? '↘️' : '→'} 
                        {stat.trendDirection}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cleanup Suggestions */}
      {analytics.suggestedCleanup.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Cleanup Suggestions</h3>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <ul className="space-y-2">
              {analytics.suggestedCleanup.map((suggestion: string, index: number) => (
                <li key={index} className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-orange-800">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Category Usage */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Category Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.categoryStats.map((stat: any) => (
            <div key={stat.category.id} className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: stat.category.color || '#6B7280' }}
                />
                <h4 className="font-medium">{stat.category.label}</h4>
              </div>
              <div className="text-sm text-gray-600">
                <div>{stat.tagCount} tags</div>
                <div>{stat.totalUsage} total uses</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Tag Modal Component
interface TagModalProps {
  tag?: Tag;
  categories: TagCategory[];
  onSave: (data: Omit<Tag, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  onClose: () => void;
}

const TagModal: React.FC<TagModalProps> = ({ tag, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: tag?.name || '',
    description: tag?.description || '',
    color: tag?.color || '#6B7280',
    category_id: tag?.category_id || (categories[0]?.id || '')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onSave({
      ...formData,
      usage_count: tag?.usage_count || 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">{tag ? 'Edit Tag' : 'Create New Tag'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter tag name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="#6B7280"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {tag ? 'Update' : 'Create'} Tag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Category Modal Component
interface CategoryModalProps {
  category?: TagCategory;
  onSave: (data: Omit<TagCategory, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  onClose: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    label: category?.label || '',
    description: category?.description || '',
    color: category?.color || '#6B7280'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.label.trim()) return;
    
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">{category ? 'Edit Category' : 'Create New Category'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="category_name"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Used internally for identification</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Category Name"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Displayed to users</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="#6B7280"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {category ? 'Update' : 'Create'} Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TagManager; 