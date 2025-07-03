import React, { useState, useEffect } from 'react';
import { UserPreferences } from '../../../types';
import { useAppState } from '../../contexts/AppStateContext';

interface WorkingHoursManagerProps {
  userPreferences: UserPreferences;
  onUpdate: (preferences: UserPreferences) => void;
}

const WorkingHoursManager: React.FC<WorkingHoursManagerProps> = ({ userPreferences, onUpdate }) => {
  const { updateUserPreferences } = useAppState();

  const [formData, setFormData] = useState({
    working_hours_start: userPreferences.working_hours_start,
    working_hours_end: userPreferences.working_hours_end,
    business_hours_start: userPreferences.business_hours_start,
    business_hours_end: userPreferences.business_hours_end,
    business_days: userPreferences.business_days || [],
    personal_time_weekday_evening: userPreferences.personal_time_weekday_evening,
    personal_time_weekends: userPreferences.personal_time_weekends,
    personal_time_early_morning: userPreferences.personal_time_early_morning,
    allow_business_in_personal_time: userPreferences.allow_business_in_personal_time,
    allow_personal_in_business_time: userPreferences.allow_personal_in_business_time,
    context_switch_buffer_minutes: userPreferences.context_switch_buffer_minutes,
    focus_block_duration: userPreferences.focus_block_duration,
    break_duration: userPreferences.break_duration,
  });

  const [activeTab, setActiveTab] = useState<'working' | 'business' | 'personal' | 'focus'>('working');
  const [previewSchedule, setPreviewSchedule] = useState<any>(null);

  const daysOfWeek = [
    { id: 'mon', label: 'Monday' },
    { id: 'tue', label: 'Tuesday' },
    { id: 'wed', label: 'Wednesday' },
    { id: 'thu', label: 'Thursday' },
    { id: 'fri', label: 'Friday' },
    { id: 'sat', label: 'Saturday' },
    { id: 'sun', label: 'Sunday' }
  ];

  useEffect(() => {
    generatePreviewSchedule();
  }, [formData]);

  const generatePreviewSchedule = () => {
    const schedule = daysOfWeek.map(day => {
      const isBusinessDay = formData.business_days.includes(day.id as any);
      const slots = [];

      if (isBusinessDay) {
        // Early morning personal time
        if (formData.personal_time_early_morning) {
          slots.push({
            type: 'personal',
            start: '06:00',
            end: formData.business_hours_start,
            label: 'Personal Time (Early Morning)'
          });
        }

        // Business hours
        slots.push({
          type: 'business',
          start: formData.business_hours_start,
          end: formData.business_hours_end,
          label: 'Business Hours'
        });

        // Evening personal time
        if (formData.personal_time_weekday_evening) {
          slots.push({
            type: 'personal',
            start: formData.business_hours_end,
            end: '22:00',
            label: 'Personal Time (Evening)'
          });
        }
      } else {
        // Weekend or non-business day
        if (formData.personal_time_weekends) {
          slots.push({
            type: 'personal',
            start: formData.working_hours_start,
            end: formData.working_hours_end,
            label: 'Personal Time (All Day)'
          });
        }
      }

      return {
        day: day.label,
        slots
      };
    });

    setPreviewSchedule(schedule);
  };

  const handleSave = async () => {
    try {
      const updatedPrefs = { ...userPreferences, ...formData };
      await updateUserPreferences(updatedPrefs);
      onUpdate(updatedPrefs);
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  };

  const handleBusinessDayToggle = (dayId: string) => {
    const businessDays = userPreferences.business_days || [];
    const updatedPreferences = {
      ...userPreferences,
      business_days: businessDays.includes(dayId as any)
        ? businessDays.filter((day: string) => day !== dayId)
        : [...businessDays, dayId as any]
    };
    onUpdate(updatedPreferences as UserPreferences);
  };

  const renderWorkingHoursTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">General Working Hours</h3>
        <p className="text-gray-600 mb-4">
          Set your overall productive working hours across all days.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Working Hours Start
            </label>
            <input
              type="time"
              value={formData.working_hours_start}
              onChange={(e) => setFormData(prev => ({ ...prev, working_hours_start: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Working Hours End
            </label>
            <input
              type="time"
              value={formData.working_hours_end}
              onChange={(e) => setFormData(prev => ({ ...prev, working_hours_end: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Context Switching</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buffer Time Between Different Contexts (minutes)
          </label>
          <input
            type="number"
            min="0"
            max="60"
            value={formData.context_switch_buffer_minutes}
            onChange={(e) => setFormData(prev => ({ ...prev, context_switch_buffer_minutes: parseInt(e.target.value) || 0 }))}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Buffer time added when switching between business and personal tasks
          </p>
        </div>
      </div>
    </div>
  );

  const renderBusinessHoursTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Business Hours Configuration</h3>
        <p className="text-gray-600 mb-4">
          Configure when you're available for business-related work and meetings.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Hours Start
            </label>
            <input
              type="time"
              value={formData.business_hours_start}
              onChange={(e) => setFormData(prev => ({ ...prev, business_hours_start: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Hours End
            </label>
            <input
              type="time"
              value={formData.business_hours_end}
              onChange={(e) => setFormData(prev => ({ ...prev, business_hours_end: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Business Days</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {daysOfWeek.map(day => (
              <label key={day.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.business_days.includes(day.id as any)}
                  onChange={() => handleBusinessDayToggle(day.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{day.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPersonalTimeTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Personal Time Configuration</h3>
        <p className="text-gray-600 mb-4">
          Configure when personal tasks and activities are allowed.
        </p>

        <div className="space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.personal_time_early_morning}
              onChange={(e) => setFormData(prev => ({ ...prev, personal_time_early_morning: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Early Morning Personal Time</span>
              <p className="text-sm text-gray-600">Allow personal tasks before business hours start</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.personal_time_weekday_evening}
              onChange={(e) => setFormData(prev => ({ ...prev, personal_time_weekday_evening: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Weekday Evening Personal Time</span>
              <p className="text-sm text-gray-600">Allow personal tasks after business hours end</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.personal_time_weekends}
              onChange={(e) => setFormData(prev => ({ ...prev, personal_time_weekends: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Weekend Personal Time</span>
              <p className="text-sm text-gray-600">Allow personal tasks on weekends and non-business days</p>
            </div>
          </label>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">Context Mixing Rules</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allow_business_in_personal_time}
              onChange={(e) => setFormData(prev => ({ ...prev, allow_business_in_personal_time: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Allow Business Work in Personal Time</span>
              <p className="text-sm text-gray-600">Permit urgent business tasks during personal hours</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allow_personal_in_business_time}
              onChange={(e) => setFormData(prev => ({ ...prev, allow_personal_in_business_time: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium">Allow Personal Tasks in Business Time</span>
              <p className="text-sm text-gray-600">Permit personal tasks during business hours when appropriate</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderFocusBlocksTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Focus Block Configuration</h3>
        <p className="text-gray-600 mb-4">
          Configure your preferred focus block duration and break patterns for deep work.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Focus Block Duration (minutes)
            </label>
            <select
              value={formData.focus_block_duration}
              onChange={(e) => setFormData(prev => ({ ...prev, focus_block_duration: parseInt(e.target.value) }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={25}>25 minutes (Pomodoro)</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>90 minutes (Ultradian)</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Break Duration (minutes)
            </label>
            <select
              value={formData.break_duration}
              onChange={(e) => setFormData(prev => ({ ...prev, break_duration: parseInt(e.target.value) }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Focus Block Preview</h4>
          <div className="text-sm text-blue-800">
            <p>Focus: {formData.focus_block_duration} minutes</p>
            <p>Break: {formData.break_duration} minutes</p>
            <p>Total cycle: {formData.focus_block_duration + formData.break_duration} minutes</p>
            <p>
              Daily capacity: ~{Math.floor((8 * 60) / (formData.focus_block_duration + formData.break_duration))} focus blocks
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSchedulePreview = () => (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-semibold mb-3">Weekly Schedule Preview</h4>
      <div className="space-y-2">
        {previewSchedule?.map((daySchedule: any, index: number) => (
          <div key={index} className="flex items-center space-x-4">
            <span className="w-20 text-sm font-medium text-gray-700">{daySchedule.day}</span>
            <div className="flex-1 flex space-x-1">
              {daySchedule.slots.map((slot: any, slotIndex: number) => (
                <div
                  key={slotIndex}
                  className={`px-2 py-1 text-xs rounded ${
                    slot.type === 'business'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                  title={slot.label}
                >
                  {slot.start}-{slot.end}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-600">
        <span className="inline-block w-3 h-3 bg-blue-100 rounded mr-1"></span>
        Business Hours
        <span className="inline-block w-3 h-3 bg-green-100 rounded mr-1 ml-4"></span>
        Personal Time
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Working Hours Manager</h2>
            <p className="text-gray-600">Configure your working hours, business time, and focus patterns</p>
          </div>
          <button
            onClick={() => onUpdate(userPreferences)}
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
            { id: 'working', label: 'Working Hours' },
            { id: 'business', label: 'Business Hours' },
            { id: 'personal', label: 'Personal Time' },
            { id: 'focus', label: 'Focus Blocks' }
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
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl">
            {activeTab === 'working' && renderWorkingHoursTab()}
            {activeTab === 'business' && renderBusinessHoursTab()}
            {activeTab === 'personal' && renderPersonalTimeTab()}
            {activeTab === 'focus' && renderFocusBlocksTab()}
          </div>

          {/* Schedule Preview */}
          <div className="mt-8">
            {renderSchedulePreview()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={() => onUpdate(userPreferences)}
            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkingHoursManager; 