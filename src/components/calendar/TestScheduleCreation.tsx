import React, { useState } from 'react';
import { useAppState } from '../../contexts/AppStateContext';

// Simple test component to verify schedule creation works
const TestScheduleCreation: React.FC = () => {
  const { addSchedule } = useAppState();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testCreateSchedule = async () => {
    setLoading(true);
    setResult('');

    try {
      const testSchedule = {
        title: `Test Event ${Date.now()}`,
        context: 'Test event creation',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
        all_day: false,
        event_type: 'other' as const,
        location: 'Test Location',
        blocks_work_time: false,
        tags: ['test'],
      };

      await addSchedule(testSchedule);
      setResult('✅ SUCCESS: Schedule created successfully!');
    } catch (error: any) {
      setResult(`❌ ERROR: ${error.message}`);
      console.error('Test schedule creation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold text-white mb-3">Database Test</h3>
      <button
        onClick={testCreateSchedule}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg mr-3"
      >
        {loading ? 'Testing...' : 'Test Schedule Creation'}
      </button>
      {result && (
        <div className={`mt-3 p-3 rounded ${result.includes('SUCCESS') ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}`}>
          {result}
        </div>
      )}
    </div>
  );
};

export default TestScheduleCreation;