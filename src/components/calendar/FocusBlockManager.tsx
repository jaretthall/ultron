import React, { useState, useEffect } from 'react';
import { Task, UserPreferences } from '../../../types';
import { useAppContext } from '../../state/AppStateContext';
import { tasksService } from '../../../services/databaseService';

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
  const { state } = useAppContext();
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
        const businessEnd = userPreferences.business_hours_end || '17:00';
        
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
            className="p-2 rounded-lg border hover:bg-gray-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold">
            Week of {getStartOfWeek(selectedWeek).toLocaleDateString()}
          </h3>
          <button
            onClick={() => setSelectedWeek(prev => {
              const newDate = new Date(prev);
              newDate.setDate(newDate.getDate() + 7);
              return newDate;
            })}
            className="p-2 rounded-lg border hover:bg-gray-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={generateOptimalBlocks}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Generate Optimal Blocks
          </button>
          <button
            onClick={() => setShowNewBlockForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
                isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="text-sm font-medium mb-2">
                {date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              
              <div className="space-y-2">
                {blocks.map(block => (
                  <div
                    key={block.id}
                    className={`p-2 rounded text-xs ${
                      block.block_type === 'deep_work' ? 'bg-purple-100 text-purple-800' :
                      block.block_type === 'focused_execution' ? 'bg-blue-100 text-blue-800' :
                      block.block_type === 'creative' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }`}
                  >
                    <div className="font-medium">{block.start_time} - {block.end_time}</div>
                    <div className="capitalize">{block.block_type.replace('_', ' ')}</div>
                    {block.completed && (
                      <div className="flex items-center mt-1">
                        <svg className="w-3 h-3 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-600">Completed</span>
                      </div>
                    )}
                    <button
                      onClick={() => deleteFocusBlock(block.id)}
                      className="text-red-500 hover:text-red-700 mt-1"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Focus Block</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={newBlockForm.date || ''}
                  onChange={(e) => setNewBlockForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  value={newBlockForm.start_time || ''}
                  onChange={(e) => setNewBlockForm(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <select
                  value={newBlockForm.duration_minutes || 90}
                  onChange={(e) => setNewBlockForm(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
                  className="w-full border rounded-lg px-3 py-2"
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
                <label className="block text-sm font-medium mb-1">Block Type</label>
                <select
                  value={newBlockForm.block_type || 'deep_work'}
                  onChange={(e) => setNewBlockForm(prev => ({ ...prev, block_type: e.target.value as any }))}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="deep_work">Deep Work</option>
                  <option value="focused_execution">Focused Execution</option>
                  <option value="creative">Creative</option>
                  <option value="analytical">Analytical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Energy Level</label>
                <select
                  value={newBlockForm.energy_level || 'high'}
                  onChange={(e) => setNewBlockForm(prev => ({ ...prev, energy_level: e.target.value as any }))}
                  className="w-full border rounded-lg px-3 py-2"
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
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createFocusBlock}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      <h3 className="text-lg font-semibold">Focus Session Templates</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {focusSessionTypes.map(session => (
          <div key={session.block_type} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold capitalize">{session.block_type.replace('_', ' ')}</h4>
              <span className={`px-2 py-1 text-xs rounded ${
                session.energy_requirement === 'high' ? 'bg-red-100 text-red-800' :
                session.energy_requirement === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {session.energy_requirement} energy
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{session.description}</p>
            
            <div className="space-y-2 text-sm">
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
              className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
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
        <h3 className="text-lg font-semibold">Focus Block Analytics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-800">{focusBlocks.length}</div>
            <div className="text-sm text-blue-600">Total Blocks Scheduled</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-800">{completedBlocks.length}</div>
            <div className="text-sm text-green-600">Blocks Completed</div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-800">{averageEffectiveness.toFixed(1)}/5</div>
            <div className="text-sm text-yellow-600">Average Effectiveness</div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-3">Block Type Distribution</h4>
          <div className="space-y-2">
            {['deep_work', 'focused_execution', 'creative', 'analytical'].map(type => {
              const count = focusBlocks.filter(block => block.block_type === type).length;
              const percentage = focusBlocks.length > 0 ? (count / focusBlocks.length) * 100 : 0;
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Focus Block Manager</h2>
            <p className="text-gray-600">Manage deep work sessions and focus blocks</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Close Focus Block Manager"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
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
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <div className="text-gray-500">Loading focus blocks...</div>
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
    </div>
  );
};

export default FocusBlockManager; 