
import React, { useState, useMemo } from 'react';
import { Task, Project, TaskStatus } from '../../../types';
import NewTaskModal from './NewTaskModal';
import TaskItem from './TaskItem';
import TaskCard from './TaskCard';
// import TaskDetailsModal from './TaskDetailsModal';
// import DependencyGraphView from './DependencyGraphView';
// import { buildDependencyGraph, getBlockedTasksFromGraph, getAvailableTasksFromGraph } from '../../utils/dependencyUtils';

interface TaskManagementPageProps {
  initialTasks: Task[];
  projects: Project[];
  onAddTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  onEditTaskRequest: (task: Task) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onCompleteTask?: (taskId: string) => Promise<void>;
}

// --- Icons ---
const PlusIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const ListIcon: React.FC = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
</svg>
);
const GridIcon: React.FC = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
   <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
</svg>
);
const SearchIcon: React.FC = () => (
  <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
  </svg>
);
const EmptyTasksIcon: React.FC = () => (
  <svg className="mx-auto h-12 w-12 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);
// --- End Icons ---

const TaskManagementPage: React.FC<TaskManagementPageProps> = ({
  initialTasks,
  projects,
  onAddTask,
  onEditTaskRequest,
  onDeleteTask,
  onCompleteTask
}) => {
  const tasks = initialTasks;

  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All Projects');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All' | 'Active'>('Active');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'graph'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  // const [showDependencyStats, setShowDependencyStats] = useState(false);

  const projectOptions = useMemo(() => {
    return [{ id: 'All Projects', title: 'All Projects' }, ...projects, {id: 'standalone', title: 'Standalone Tasks'}];
  }, [projects]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const searchMatch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const projectMatch = projectFilter === 'All Projects' ||
                           (projectFilter === 'standalone' && !task.project_id) || // Corrected: was task.projectId
                           task.project_id === projectFilter; // Corrected: was task.projectId

      let statusMatch = true;
      if (statusFilter === 'Active') {
        statusMatch = task.status === TaskStatus.TODO || task.status === TaskStatus.IN_PROGRESS;
      } else if (statusFilter !== 'All') {
        statusMatch = task.status === statusFilter;
      }

      return searchMatch && projectMatch && statusMatch;
    });
  }, [tasks, searchTerm, projectFilter, statusFilter]);

  const getProjectTitle = (pId?: string): string => {
    if (!pId) return "Standalone";
    const project = projects.find(p => p.id === pId);
    return project ? project.title : "Unknown Project";
  };

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    await onAddTask(taskData);
  };


  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-900 text-slate-100 flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-slate-400 mt-1">Organize and prioritize your tasks.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
          aria-label="Add New Task"
        >
          <PlusIcon /> <span className="ml-2">New Task</span>
        </button>
      </div>

      {/* Filters Section */}
      <div className="mb-6 flex flex-wrap gap-3 items-center shrink-0">
        <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-md leading-5 bg-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            aria-label="Search tasks"
          />
        </div>
        <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="bg-slate-700 border-slate-600 rounded-md text-sm py-2 px-3 focus:ring-sky-500 focus:border-sky-500"
            aria-label="Filter by project"
        >
          {projectOptions.map(proj => (
            <option key={proj.id} value={proj.id}>{proj.title}</option>
          ))}
        </select>
        <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as TaskStatus | 'All' | 'Active')}
            className="bg-slate-700 border-slate-600 rounded-md text-sm py-2 px-3 focus:ring-sky-500 focus:border-sky-500"
            aria-label="Filter by status"
        >
          <option value="Active">Active (Todo/In Progress)</option>
          <option value="All">All Statuses</option>
          <option value={TaskStatus.TODO}>Todo</option>
          <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
          <option value={TaskStatus.COMPLETED}>Completed</option>
        </select>
        <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-700 border-slate-600 rounded-md text-sm py-2 px-3 focus:ring-sky-500 focus:border-sky-500"
            aria-label="Filter by category"
            disabled
        >
          <option>All Categories</option>
        </select>
        <button className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2 px-3 rounded-lg flex items-center text-sm border border-slate-600" disabled>
            Filter by tags
        </button>
         <div className="flex items-center space-x-1 p-0.5 bg-slate-700 rounded-md ml-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-600'}`}
              aria-label="List view"
            >
              <ListIcon />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-600'}`}
              aria-label="Grid view"
            >
              <GridIcon />
            </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20">
            <EmptyTasksIcon />
            <h3 className="mt-2 text-lg font-medium text-slate-300">No tasks found</h3>
            <p className="mt-1 text-sm text-slate-500">
                {tasks.length > 0 ? "Try adjusting your filters or " : "Create your first task to get started."}
                 <button onClick={() => setIsModalOpen(true)} className="text-sky-400 hover:text-sky-300 font-medium">
                    create a new task
                </button>.
            </p>
          </div>
        ) : (
          viewMode === 'list' ? (
            <div className="space-y-3" data-testid="task-list">
              {filteredTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  projectTitle={getProjectTitle(task.project_id)}
                  onEditTaskRequest={onEditTaskRequest}
                  onDeleteTask={onDeleteTask}
                  onCompleteTask={onCompleteTask}
                /> 
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="task-list">
              {filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  projectTitle={getProjectTitle(task.project_id)}
                  onEditTaskRequest={onEditTaskRequest}
                  onDeleteTask={onDeleteTask}
                  onCompleteTask={onCompleteTask}
                />
              ))}
            </div>
          )
        )}
      </div>
      {isModalOpen && (
        <NewTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddTask={handleAddTask}
          projects={projects}
        />
      )}
    </div>
  );
};

export default TaskManagementPage;
