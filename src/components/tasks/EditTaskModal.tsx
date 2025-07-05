import React, { useState, useEffect } from 'react';
import { Task, Project } from '../../../types';

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (updatedTask: Task) => Promise<void>;
  projects: Project[];
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  projects
}) => {
  const [title, setTitle] = useState(task.title);
  const [context, setContext] = useState(task.context);
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [projectId, setProjectId] = useState(task.project_id || '');
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '');
  const [estimatedHours, setEstimatedHours] = useState(task.estimated_hours || 0);
  const [tags, setTags] = useState(task.tags?.join(', ') || '');
  const [progress, setProgress] = useState(task.progress || 0);

  useEffect(() => {
    setTitle(task.title);
    setContext(task.context);
    setPriority(task.priority);
    setStatus(task.status);
    setProjectId(task.project_id || '');
    setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
    setEstimatedHours(task.estimated_hours || 0);
    setTags(task.tags?.join(', ') || '');
    setProgress(task.progress || 0);
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedTask: Task = {
      ...task,
      title,
      context,
      priority,
      status,
      project_id: projectId || undefined,
      due_date: dueDate || undefined,
      estimated_hours: Number(estimatedHours) || 0,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      progress: progress
    };

    await onUpdateTask(updatedTask);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Edit Task</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Context <span className="text-sky-400">*</span>
              <span className="block text-xs text-slate-400 font-normal mt-0.5">
                Provide detailed context to help AI understand this task's purpose, requirements, and any important background information.
              </span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Describe what this task involves, why it's important, any specific requirements, constraints, or context that would help the AI understand and prioritize this task effectively..."
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white h-24"
            />
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              <option value="">No Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Estimated Hours
            </label>
            <input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Number(e.target.value))}
              min="0"
              step="0.5"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., urgent, design, frontend"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Progress: {progress}%
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${progress}%, #475569 ${progress}%, #475569 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>Not Started</span>
                <span>In Progress</span>
                <span>Completed</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded font-medium"
            >
              Update Task
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal; 