import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../../types';

interface SimpleTaskEditModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

const SimpleTaskEditModal: React.FC<SimpleTaskEditModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateTask
}) => {
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateTask(task.id, {
      title,
      status,
      priority
    });
    onClose();
  };

  const handleMarkComplete = () => {
    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
    onUpdateTask(task.id, { status: newStatus });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-4">Edit Task</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full p-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-sky-500 focus:outline-none"
            >
              <option value={TaskStatus.TODO}>To Do</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.COMPLETED}>Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full p-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-sky-500 focus:outline-none"
            >
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.URGENT}>Urgent</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleMarkComplete}
            className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
              task.status === TaskStatus.COMPLETED
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {task.status === TaskStatus.COMPLETED ? 'Mark Incomplete' : 'Mark Complete'}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded font-medium transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleTaskEditModal; 