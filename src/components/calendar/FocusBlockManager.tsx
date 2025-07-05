import React, { useState, useEffect } from 'react';
import { Task, /*UserPreferences*/ } from '../../../types';
import { useAppState } from '../../contexts/AppStateContext';
// import { tasksService } from '../../../services/databaseService';

interface FocusBlockManagerProps {
  onClose?: () => void;
}

interface FocusBlock {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  block_type: 'deep_work' | 'focused_execution' | 'creative' | 'analytical';
  energy_level: 'high' | 'medium' | 'low';
  scheduled_tasks: Task[];
  actual_tasks?: Task[];
  completed: boolean;
  effectiveness_rating?: number;
  notes?: string;
}

interface FocusSession {
  block_type: 'deep_work' | 'focused_execution' | 'creative' | 'analytical';
  optimal_duration: number;
  break_duration: number;
  energy_requirement: 'high' | 'medium' | 'low';
  best_times: string[];
  description: string;
}

const focusSessionTypes: FocusSession[] = [
  {
    block_type: 'deep_work',
    optimal_duration: 90,
    break_duration: 20,
    energy_requirement: 'high',
    best_times: ['09:00', '10:30'],
    description: 'Uninterrupted deep thinking, complex problem solving, and strategic work'
  },
  {
    block_type: 'focused_execution',
    optimal_duration: 60,
    break_duration: 15,
    energy_requirement: 'medium',
    best_times: ['11:00', '14:00', '16:00'],
    description: 'Concentrated task execution, implementation, and detail-oriented work'
  },
  {
    block_type: 'creative',
    optimal_duration: 45,
    break_duration: 10,
    energy_requirement: 'medium',
    best_times: ['10:00', '15:00'],
    description: 'Brainstorming, ideation, design, and innovative thinking'
  },
  {
    block_type: 'analytical',
    optimal_duration: 75,
    break_duration: 15,
    energy_requirement: 'high',
    best_times: ['09:30', '11:30'],
    description: 'Data analysis, research, planning, and systematic evaluation'
  }
];

const FocusBlockManager: React.FC<FocusBlockManagerProps> = ({ onClose }) => {
  const { state } = useAppState();
  const { userPreferences } = state;

  const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'schedule' | 'templates' | 'analytics'>('schedule');
  const [newBlockForm, setNewBlockForm] = useState<Partial<FocusBlock>>({
    block_type: 'deep_work',
    duration_minutes: 90,
    energy_level: 'high'
  });
  const [showNewBlockForm, setShowNewBlockForm] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFocusBlocks();
  }, [selectedWeek]);

  const loadFocusBlocks = async () => {
    setLoading(true);
    try {
      // Mock focus blocks for demonstration
      const startOfWeek = getStartOfWeek(selectedWeek);
      const mockBlocks: FocusBlock[] = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        
        if (i < 5) { // Weekdays only
          mockBlocks.push({
            id: `block-${i}-1`,
            date: date.toISOString().split('T')[0],
            start_time: '09:00',
            end_time: '10:30',
            duration_minutes: 90,
            block_type: 'deep_work',
            energy_level: 'high',
            scheduled_tasks: [],
            completed: Math.random() > 0.5,
            effectiveness_rating: Math.floor(Math.random() * 5) + 1
          });
        }
      }
      
      setFocusBlocks(mockBlocks);
    } catch (error) {
      console.error('Error loading focus blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const generateOptimalBlocks = () => {
    if (!userPreferences) return;

    const blocks: Partial<FocusBlock>[] = [];
    const startOfWeek = getStartOfWeek(selectedWeek);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
      
      if (userPreferences.business_days?.includes(dayOfWeek as any)) {
        const businessStart = userPreferences.business_hours_start || '09:00';
        // const businessEnd = userPreferences.business_hours_end || '17:00';
        
        // Generate 2-3 focus blocks per day
        const morningBlock: Partial<FocusBlock> = {
          date: date.toISOString().split('T')[0],
          start_time: businessStart,
          end_time: addMinutes(businessStart, 90),
          duration_minutes: 90,
          block_type: 'deep_work',
          energy_level: 'high',
          scheduled_tasks: []
        };

        const afternoonBlock: Partial<FocusBlock> = {
          date: date.toISOString().split('T')[0],
          start_time: '14:00',
          end_time: '15:00',
          duration_minutes: 60,
          block_type: 'focused_execution',
          energy_level: 'medium',
          scheduled_tasks: []
        };

        blocks.push(morningBlock, afternoonBlock);
      }
    }

    console.log('Generated optimal blocks:', blocks);
    // In a real implementation, these would be saved to the database
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  const createFocusBlock = () => {
    if (!newBlockForm.date || !newBlockForm.start_time || !newBlockForm.duration_minutes) return;

    const newBlock: FocusBlock = {
      id: `block-${Date.now()}`,
      date: newBlockForm.date,
      start_time: newBlockForm.start_time,
      end_time: addMinutes(newBlockForm.start_time, newBlockForm.duration_minutes),
      duration_minutes: newBlockForm.duration_minutes,
      block_type: newBlockForm.block_type || 'deep_work',
      energy_level: newBlockForm.energy_level || 'high',
      scheduled_tasks: [],
      completed: false
    };

    setFocusBlocks(prev => [...prev, newBlock]);
    setShowNewBlockForm(false);
    setNewBlockForm({
      block_type: 'deep_work',
      duration_minutes: 90,
      energy_level: 'high'
    });
  };

  const deleteFocusBlock = (blockId: string) => {
    setFocusBlocks(prev => prev.filter(block => block.id !== blockId));
  };

  const getWeekDates = (): Date[] => {
    const startOfWeek = getStartOfWeek(selectedWeek);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getBlocksForDate = (date: Date): FocusBlock[] => {
    const dateString = date.toISOString().split('T')[0];
    return focusBlocks.filter(block => block.date === dateString);
  };

  const renderScheduleTab = () => (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedWeek(prev => {
              const newDate = new Date(prev);
              newDate.setDate(newDate.getDate() - 7);
              return newDate;
            })}
            className="p-2 rounded-lg border border-gray-600 hover:bg-gray-800 text-gray-300"
            aria-label="Previous week"
            title="Go to previous week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-white">
            Week of {getStartOfWeek(selectedWeek).toLocaleDateString()}
          </h3>
          <button
            onClick={() => setSelectedWeek(prev => {
              const newDate = new Date(prev);
              newDate.setDate(newDate.getDate() + 7);
              return newDate;
            })}
            className="p-2 rounded-lg border border-gray-600 hover:bg-gray-800 text-gray-300"
            aria-label="Next week"
            title="Go to next week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={generateOptimalBlocks}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 border border-blue-500"
          >
            Generate Optimal Blocks
          </button>
          <button
            onClick={() => setShowNewBlockForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 border border-green-500"
          >
            Add Focus Block
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {getWeekDates().map(date => {
          const blocks = getBlocksForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={date.toISOString()}
              className={`border rounded-lg p-3 min-h-[200px] ${
                isToday ? 'border-blue-400 bg-blue-900/20' : 'border-gray-600 bg-gray-800/50'
              }`}
            >
              <div className="text-sm font-medium mb-2 text-gray-200">
                {date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              
              <div className="space-y-2">
                {blocks.map(block => (
                  <div
                    key={block.id}
                    className={`p-2 rounded text-xs ${
                      block.block_type === 'deep_work' ? 'bg-purple-900/40 text-purple-200 border border-purple-600' :
                      block.block_type === 'focused_execution' ? 'bg-blue-900/40 text-blue-200 border border-blue-600' :
                      block.block_type === 'creative' ? 'bg-green-900/40 text-green-200 border border-green-600' :
                      'bg-orange-900/40 text-orange-200 border border-orange-600'
                    }`}
                  >
                    <div className="font-medium">{block.start_time} - {block.end_time}</div>
                    <div className="capitalize">{block.block_type.replace('_', ' ')}</div>
                    {block.completed && (
                      <div className="flex items-center mt-1">
                        <svg className="w-3 h-3 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-400">Completed</span>
                      </div>
                    )}
                    <button
                      onClick={() => deleteFocusBlock(block.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/30 px-2 py-1 rounded text-xs mt-1 border border-red-600 hover:border-red-500 transition-colors"
                      aria-label={`Remove focus block from ${block.start_time} to ${block.end_time}`}
                      title="Remove this focus block"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Block Form */}
      {showNewBlockForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">Create Focus Block</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="focus-block-date" className="block text-sm font-medium mb-1 text-gray-200">Date</label>
                <input
                  id="focus-block-date"
                  type="date"
                  value={newBlockForm.date || ''}
                  onChange={(e) => setNewBlockForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-gray-200"
                  title="Select date for focus block"
                  aria-label="Select date for focus block"
                />
              </div>

              <div>
                <label htmlFor="focus-block-start-time" className="block text-sm font-medium mb-1 text-gray-200">Start Time</label>
                <input
                  id="focus-block-start-time"
                  type="time"
                  value={newBlockForm.start_time || ''}
                  onChange={(e) => setNewBlockForm(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-gray-200"
                  title="Select start time for focus block"
                  aria-label="Select start time for focus block"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-200">Duration (minutes)</label>
                <select
                  value={newBlockForm.duration_minutes || 90}
                  onChange={(e) => setNewBlockForm(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-gray-200"
                  aria-label="Select duration in minutes"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={75}>75 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-200">Block Type</label>
                <select
                  value={newBlockForm.block_type || 'deep_work'}
                  onChange={(e) => setNewBlockForm(prev => ({ ...prev, block_type: e.target.value as any }))}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-gray-200"
                  aria-label="Select block type"
                >
                  <option value="deep_work">Deep Work</option>
                  <option value="focused_execution">Focused Execution</option>
                  <option value="creative">Creative</option>
                  <option value="analytical">Analytical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-200">Energy Level</label>
                <select
                  value={newBlockForm.energy_level || 'high'}
                  onChange={(e) => setNewBlockForm(prev => ({ ...prev, energy_level: e.target.value as any }))}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-gray-200"
                  aria-label="Select energy level"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewBlockForm(false)}
                className="px-4 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createFocusBlock}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 border border-blue-500"
              >
                Create Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Focus Session Templates</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {focusSessionTypes.map(session => (
          <div key={session.block_type} className="border border-gray-600 rounded-lg p-4 bg-gray-800/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold capitalize text-white">{session.block_type.replace('_', ' ')}</h4>
              <span className={`px-2 py-1 text-xs rounded border ${
                session.energy_requirement === 'high' ? 'bg-red-900/40 text-red-200 border-red-600' :
                session.energy_requirement === 'medium' ? 'bg-yellow-900/40 text-yellow-200 border-yellow-600' :
                'bg-green-900/40 text-green-200 border-green-600'
              }`}>
                {session.energy_requirement} energy
              </span>
            </div>
            
            <p className="text-sm text-gray-300 mb-3">{session.description}</p>
            
            <div className="space-y-2 text-sm text-gray-300">
              <div>Duration: {session.optimal_duration} minutes</div>
              <div>Break: {session.break_duration} minutes</div>
              <div>Best times: {session.best_times.join(', ')}</div>
            </div>
            
            <button
              onClick={() => {
                setNewBlockForm({
                  block_type: session.block_type,
                  duration_minutes: session.optimal_duration,
                  energy_level: session.energy_requirement
                });
                setShowNewBlockForm(true);
              }}
              className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm border border-blue-500"
            >
              Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => {
    const completedBlocks = focusBlocks.filter(block => block.completed);
    const averageEffectiveness = completedBlocks.length > 0 
      ? completedBlocks.reduce((sum, block) => sum + (block.effectiveness_rating || 0), 0) / completedBlocks.length
      : 0;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white">Focus Block Analytics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-900/40 border border-blue-600 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-200">{focusBlocks.length}</div>
            <div className="text-sm text-blue-300">Total Blocks Scheduled</div>
          </div>
          
          <div className="bg-green-900/40 border border-green-600 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-200">{completedBlocks.length}</div>
            <div className="text-sm text-green-300">Blocks Completed</div>
          </div>
          
          <div className="bg-yellow-900/40 border border-yellow-600 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-200">{averageEffectiveness.toFixed(1)}/5</div>
            <div className="text-sm text-yellow-300">Average Effectiveness</div>
          </div>
        </div>
        
        <div className="border border-gray-600 rounded-lg p-4 bg-gray-800/50">
          <h4 className="font-semibold mb-3 text-white">Block Type Distribution</h4>
          <div className="space-y-2">
            {['deep_work', 'focused_execution', 'creative', 'analytical'].map(type => {
              const count = focusBlocks.filter(block => block.block_type === type).length;
              const percentage = focusBlocks.length > 0 ? (count / focusBlocks.length) * 100 : 0;
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="capitalize text-gray-200">{type.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{width: `${percentage}%`}}
                        aria-label={`${type.replace('_', ' ')} blocks: ${percentage.toFixed(1)}%`}
                      />
                    </div>
                    <span className="text-sm text-gray-300">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-2xl font-bold text-white">Focus Block Manager</h2>
              <p className="text-gray-300">Manage deep work sessions and focus blocks</p>
            </div>
            <button
              onClick={() => setShowHelpModal(true)}
              className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-900/30 transition-colors"
              title="Learn about Focus Blocks"
              aria-label="Open Focus Blocks help guide"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
            title="Close Focus Block Manager"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'schedule', label: 'Schedule', icon: '📅' },
            { id: 'templates', label: 'Templates', icon: '📋' },
            { id: 'analytics', label: 'Analytics', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-400 text-blue-300 bg-blue-900/30'
                  : 'border-transparent text-gray-300 hover:text-gray-100 hover:border-gray-500 hover:bg-gray-800'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-300">Loading focus blocks...</div>
            </div>
          ) : (
            <>
              {activeTab === 'schedule' && renderScheduleTab()}
              {activeTab === 'templates' && renderTemplatesTab()}
              {activeTab === 'analytics' && renderAnalyticsTab()}
            </>
          )}
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700">
            {/* Help Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Focus Blocks: Your Mental Architecture for Peak Performance</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-200"
                title="Close help guide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Help Content */}
            <div className="overflow-y-auto p-6 space-y-6 max-h-[calc(90vh-80px)]">
              {/* Introduction */}
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 text-lg leading-relaxed">
                  Think of Focus Blocks as the blueprints for your brain's daily construction project. Just as a master architect wouldn't use the same materials and tools to build a delicate sculpture as they would a sturdy foundation, your mind needs different "construction zones" for different types of thinking.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Imagine your brain as a high-performance sports car with multiple driving modes. You wouldn't use "Sport Mode" to navigate a crowded parking lot, nor would you use "Eco Mode" on a racetrack. Focus Blocks are like having a sophisticated transmission system that automatically shifts your mental gears to match the terrain of your work.
                </p>
              </div>

              {/* Sarah's Story */}
              <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">The Story of Sarah's Scattered Day</h3>
                <div className="space-y-4 text-gray-300">
                  <p className="leading-relaxed">
                    Sarah used to approach her workday like a pinball, bouncing frantically between emails, creative projects, data analysis, and strategic planning. By 3 PM, she felt like a smartphone with 15 apps running simultaneously—everything was slow, nothing was working well, and her battery was dying fast.
                  </p>
                  <p className="leading-relaxed">
                    Then she discovered Focus Blocks. Instead of treating her day like a chaotic buffet where she grabbed whatever task seemed urgent, she began orchestrating her day like a symphony conductor. Her Deep Work blocks became her "first violin" moments—90 minutes of pure, uninterrupted focus on her most complex challenges when her mind was sharpest. Her Creative blocks were like jazz improvisation sessions—shorter bursts where her imagination could run wild. Her Analytical blocks became her "methodical detective" time—systematically working through data and research when her logical mind was most engaged.
                  </p>
                  <p className="leading-relaxed font-medium text-blue-200">
                    The transformation was remarkable. Sarah's work quality improved dramatically, her stress decreased, and she actually finished her days with energy left over—like driving efficiently in the right gear instead of redlining her engine in first gear all day.
                  </p>
                </div>
              </div>

              {/* Practical Playbook */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Your Practical Focus Blocks Playbook</h3>
                
                <div className="space-y-6">
                  {/* Energy Audit */}
                  <div className="bg-gray-800 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-green-300 mb-3">1. The Energy Audit Approach</h4>
                    <p className="text-gray-300 leading-relaxed">
                      Track your natural energy rhythms for a week. Note when you feel most alert, creative, and analytical. Your brain has a natural circadian rhythm for different types of thinking—honor it rather than fighting it.
                    </p>
                  </div>

                  {/* Block Matching */}
                  <div className="bg-gray-800 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-purple-300 mb-3">2. The Block Matching Strategy</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-purple-900/30 border border-purple-600 rounded p-3">
                        <h5 className="font-semibold text-purple-200">Deep Work (90 min)</h5>
                        <p className="text-sm text-gray-300">Reserve for your peak energy hours. This is your "heavy lifting" time for complex projects, strategic thinking, and problem-solving that requires sustained concentration.</p>
                      </div>
                      <div className="bg-blue-900/30 border border-blue-600 rounded p-3">
                        <h5 className="font-semibold text-blue-200">Focused Execution (60 min)</h5>
                        <p className="text-sm text-gray-300">Use during your moderate energy periods for implementation, detailed work, and tasks requiring precision but not breakthrough thinking.</p>
                      </div>
                      <div className="bg-green-900/30 border border-green-600 rounded p-3">
                        <h5 className="font-semibold text-green-200">Creative (45 min)</h5>
                        <p className="text-sm text-gray-300">Schedule when your mind is relaxed but engaged—often after physical activity or during natural creative peaks (many people find late morning or early evening optimal).</p>
                      </div>
                      <div className="bg-orange-900/30 border border-orange-600 rounded p-3">
                        <h5 className="font-semibold text-orange-200">Analytical (75 min)</h5>
                        <p className="text-sm text-gray-300">Best during your logical, systematic thinking periods—often mid-morning or early afternoon when your rational mind is most engaged.</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Techniques */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-lg p-5">
                      <h4 className="text-lg font-semibold text-yellow-300 mb-3">3. The Transition Buffer Technique</h4>
                      <p className="text-gray-300 leading-relaxed">
                        Build 10-15 minute buffers between different types of blocks. Think of these as mental gear changes—your brain needs time to shift from creative dreaming to analytical precision.
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-5">
                      <h4 className="text-lg font-semibold text-cyan-300 mb-3">4. The Template Customization Method</h4>
                      <p className="text-gray-300 leading-relaxed">
                        Start with the research-based templates, but customize them based on your unique work patterns. The 90-minute Deep Work block might be perfect for some, but if you naturally focus in 60-minute chunks, adjust accordingly.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-indigo-300 mb-3">5. The Progressive Block Building</h4>
                    <p className="text-gray-300 leading-relaxed">
                      Begin with one or two blocks per day and gradually increase. Think of it as mental strength training—you wouldn't start lifting weights with maximum load.
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-World Complexity */}
              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-yellow-300 mb-4">The Real-World Complexity</h3>
                <div className="space-y-4 text-gray-300">
                  <p className="leading-relaxed">
                    Here's where Focus Blocks get complicated: life doesn't always cooperate with perfect scheduling. You might have colleagues who don't understand why you can't "just quickly answer this email" during your Deep Work block. Some argue this approach is too rigid for collaborative environments or client-facing roles.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-green-900/30 border border-green-600 rounded p-4">
                      <h4 className="font-semibold text-green-200 mb-2">The Advocates argue:</h4>
                      <p className="text-sm">Focus Blocks dramatically improve work quality, reduce decision fatigue, and create sustainable productivity patterns. They point to research showing that task-switching can reduce efficiency by up to 40%.</p>
                    </div>
                    <div className="bg-red-900/30 border border-red-600 rounded p-4">
                      <h4 className="font-semibold text-red-200 mb-2">The Skeptics counter:</h4>
                      <p className="text-sm">Modern work requires agility and responsiveness that rigid time blocks can't accommodate. They worry about appearing unavailable to teammates or missing time-sensitive opportunities.</p>
                    </div>
                  </div>
                  <p className="leading-relaxed text-blue-200 font-medium">
                    The middle ground suggests treating Focus Blocks as strong guidelines rather than inflexible rules—protecting your most important blocks while remaining adaptable for genuinely urgent situations.
                  </p>
                </div>
              </div>

              {/* Learning Path */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Diving Deeper: Your Learning Path</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-300 mb-3">📚 Books to explore</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• "Deep Work" by Cal Newport (the foundational text)</li>
                      <li>• "When" by Daniel Pink (understanding optimal timing)</li>
                      <li>• "The Power of Full Engagement" by Jim Loehr and Tony Schwartz (energy management)</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-300 mb-3">🔬 Research areas</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Ultradian rhythms and cognitive performance</li>
                      <li>• Attention restoration theory</li>
                      <li>• Flow state research by Mihaly Csikszentmihalyi</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-green-300 mb-3">🧪 Practical experiments</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Use your app's analytics to identify your most productive block types and times</li>
                      <li>• A/B test different block durations to find your optimal focus periods</li>
                      <li>• Track completion rates and energy levels to refine your approach</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Closing */}
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-600 rounded-lg p-6">
                <p className="text-gray-200 leading-relaxed text-lg">
                  The key is remembering that Focus Blocks aren't just about time management—they're about <strong className="text-blue-300">energy architecture</strong> and <strong className="text-purple-300">attention craftsmanship</strong>. Like a skilled artisan who knows exactly which tool to use for each delicate cut, you're learning to wield your attention with precision and purpose.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusBlockManager; 