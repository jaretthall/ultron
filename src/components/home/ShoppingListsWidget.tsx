import React, { useState, useEffect } from 'react';

interface ShoppingItem {
  id: string;
  text: string;
  completed: boolean;
  created_at: Date;
}

interface ShoppingList {
  id: string;
  name: string;
  category: 'grocery' | 'hardware' | 'general' | 'amazon' | 'custom';
  items: ShoppingItem[];
  created_at: Date;
  updated_at: Date;
}

interface ShoppingListsWidgetProps {
  className?: string;
}

const CATEGORY_CONFIGS = {
  grocery: {
    label: 'Grocery Store',
    icon: '🛒',
    color: 'bg-green-600',
    hoverColor: 'hover:bg-green-700'
  },
  hardware: {
    label: 'Hardware Store',
    icon: '🔨',
    color: 'bg-orange-600',
    hoverColor: 'hover:bg-orange-700'
  },
  general: {
    label: 'General/Walmart',
    icon: '🏪',
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700'
  },
  amazon: {
    label: 'Amazon',
    icon: '📦',
    color: 'bg-yellow-600',
    hoverColor: 'hover:bg-yellow-700'
  },
  custom: {
    label: 'Custom',
    icon: '📝',
    color: 'bg-purple-600',
    hoverColor: 'hover:bg-purple-700'
  }
};

const ShoppingListsWidget: React.FC<ShoppingListsWidgetProps> = ({ className = '' }) => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListCategory, setNewListCategory] = useState<ShoppingList['category']>('grocery');
  const [newItemText, setNewItemText] = useState('');

  // Load shopping lists from localStorage on component mount
  useEffect(() => {
    const savedLists = localStorage.getItem('ultron-shopping-lists');
    if (savedLists) {
      try {
        const parsedLists = JSON.parse(savedLists).map((list: any) => ({
          ...list,
          created_at: new Date(list.created_at),
          updated_at: new Date(list.updated_at),
          items: list.items.map((item: any) => ({
            ...item,
            created_at: new Date(item.created_at)
          }))
        }));
        setLists(parsedLists);
        if (parsedLists.length > 0) {
          setSelectedList(parsedLists[0]);
        }
      } catch (error) {
        console.error('Error loading shopping lists:', error);
      }
    }
  }, []);

  // Save shopping lists to localStorage whenever lists change
  useEffect(() => {
    localStorage.setItem('ultron-shopping-lists', JSON.stringify(lists));
  }, [lists]);

  const createNewList = () => {
    if (!newListName.trim()) return;

    const newList: ShoppingList = {
      id: `list-${Date.now()}`,
      name: newListName.trim(),
      category: newListCategory,
      items: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    setLists(prev => [newList, ...prev]);
    setSelectedList(newList);
    setNewListName('');
    setShowCreateForm(false);
  };

  const deleteList = (listId: string) => {
    setLists(prev => prev.filter(list => list.id !== listId));
    if (selectedList?.id === listId) {
      const remainingLists = lists.filter(list => list.id !== listId);
      setSelectedList(remainingLists.length > 0 ? remainingLists[0] : null);
    }
  };

  const addItem = () => {
    if (!selectedList || !newItemText.trim()) return;

    const newItem: ShoppingItem = {
      id: `item-${Date.now()}`,
      text: newItemText.trim(),
      completed: false,
      created_at: new Date()
    };

    const updatedList = {
      ...selectedList,
      items: [...selectedList.items, newItem],
      updated_at: new Date()
    };

    setLists(prev => prev.map(list => 
      list.id === selectedList.id ? updatedList : list
    ));
    setSelectedList(updatedList);
    setNewItemText('');
  };

  const toggleItem = (itemId: string) => {
    if (!selectedList) return;

    const updatedList = {
      ...selectedList,
      items: selectedList.items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      ),
      updated_at: new Date()
    };

    setLists(prev => prev.map(list => 
      list.id === selectedList.id ? updatedList : list
    ));
    setSelectedList(updatedList);
  };

  const deleteItem = (itemId: string) => {
    if (!selectedList) return;

    const updatedList = {
      ...selectedList,
      items: selectedList.items.filter(item => item.id !== itemId),
      updated_at: new Date()
    };

    setLists(prev => prev.map(list => 
      list.id === selectedList.id ? updatedList : list
    ));
    setSelectedList(updatedList);
  };

  const clearCompleted = () => {
    if (!selectedList) return;

    const updatedList = {
      ...selectedList,
      items: selectedList.items.filter(item => !item.completed),
      updated_at: new Date()
    };

    setLists(prev => prev.map(list => 
      list.id === selectedList.id ? updatedList : list
    ));
    setSelectedList(updatedList);
  };

  const getListStats = (list: ShoppingList) => {
    const total = list.items.length;
    const completed = list.items.filter(item => item.completed).length;
    return { total, completed, remaining: total - completed };
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-4 lg:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Shopping Lists
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New List
        </button>
      </div>

      {/* Create New List Form */}
      {showCreateForm && (
        <div className="mb-4 p-3 bg-slate-700 rounded-lg border border-slate-600">
          <h3 className="text-sm font-medium text-white mb-2">Create New List</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name..."
              className="w-full bg-slate-600 text-white border border-slate-500 rounded px-2 py-1 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && createNewList()}
            />
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_CONFIGS).map(([category, config]) => (
                <button
                  key={category}
                  onClick={() => setNewListCategory(category as ShoppingList['category'])}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    newListCategory === category
                      ? `${config.color} text-white`
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  {config.icon} {config.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={createNewList}
                disabled={!newListName.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewListName('');
                  setNewListCategory('grocery');
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-96">
        {/* Lists Overview */}
        <div className="border border-slate-600 rounded-lg overflow-hidden">
          <div className="bg-slate-700 px-3 py-2 border-b border-slate-600">
            <h3 className="text-sm font-medium text-slate-300">Your Lists ({lists.length})</h3>
          </div>
          <div className="overflow-y-auto h-80">
            {lists.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No shopping lists yet</p>
                <p className="text-xs mt-1">Create your first list to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-600">
                {lists.map((list) => {
                  const stats = getListStats(list);
                  const config = CATEGORY_CONFIGS[list.category];
                  
                  return (
                    <div
                      key={list.id}
                      className={`p-3 cursor-pointer hover:bg-slate-700 transition-colors ${
                        selectedList?.id === list.id ? 'bg-slate-700 border-r-2 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedList(list)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{config.icon}</span>
                            <h4 className="text-sm font-medium text-white truncate">
                              {list.name}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-400">
                            {config.label}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="text-slate-400">
                              {stats.total} items
                            </span>
                            {stats.completed > 0 && (
                              <span className="text-green-400">
                                {stats.completed} done
                              </span>
                            )}
                            {stats.remaining > 0 && (
                              <span className="text-yellow-400">
                                {stats.remaining} remaining
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteList(list.id);
                          }}
                          className="ml-2 p-1 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete list"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Current List Items */}
        <div className="border border-slate-600 rounded-lg overflow-hidden">
          <div className="bg-slate-700 px-3 py-2 border-b border-slate-600">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300">
                {selectedList ? (
                  <span className="flex items-center gap-2">
                    <span>{CATEGORY_CONFIGS[selectedList.category].icon}</span>
                    {selectedList.name}
                  </span>
                ) : (
                  'Select a List'
                )}
              </h3>
              {selectedList && selectedList.items.some(item => item.completed) && (
                <button
                  onClick={clearCompleted}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                >
                  Clear Done
                </button>
              )}
            </div>
          </div>

          <div className="h-80 overflow-y-auto">
            {selectedList ? (
              <div className="p-3 h-full flex flex-col">
                {/* Add Item Form */}
                <div className="mb-3 pb-3 border-b border-slate-600">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Add item..."
                      className="flex-1 bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                    <button
                      onClick={addItem}
                      disabled={!newItemText.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto">
                  {selectedList.items.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm">No items in this list</p>
                      <p className="text-xs mt-1">Add your first item above</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedList.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 p-2 rounded transition-colors ${
                            item.completed ? 'bg-slate-700 opacity-75' : 'bg-slate-700'
                          }`}
                        >
                          <button
                            onClick={() => toggleItem(item.id)}
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              item.completed
                                ? 'bg-green-600 border-green-600 text-white'
                                : 'border-slate-400 hover:border-green-400'
                            }`}
                          >
                            {item.completed && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                          <span className={`flex-1 text-sm ${
                            item.completed ? 'text-slate-400 line-through' : 'text-white'
                          }`}>
                            {item.text}
                          </span>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="flex-shrink-0 p-1 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>Select a list to view items</p>
                  <p className="text-xs mt-1">Lists are saved locally across sessions</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingListsWidget;