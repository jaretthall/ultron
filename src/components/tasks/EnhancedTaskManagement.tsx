import React, { useState, useMemo } from 'react';
import { Task, TaskStatus } from '../../../types';
import NewTaskModal from './NewTaskModal';
import TaskItem from './TaskItem';
import TaskCard from './TaskCard';
import TaskDetailsModal from './TaskDetailsModal';
import DependencyGraphView from './DependencyGraphView';
import { useAppState } from '../../contexts/AppStateContext';
import { buildDependencyGraph, getBlockedTasksFromGraph, getAvailableTasksFromGraph } from '../../utils/dependencyUtils';

// Icons
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

const GraphIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
  </svg>
);

const ExclamationTriangleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const CheckCircleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

type ViewMode = 'list' | 'grid' | 'graph';

const EnhancedTaskManagement: React.FC = () => {
  const { state, addTask } = useAppState();
  const { tasks, projects } = state;

  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All Projects');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All' | 'Active' | 'Blocked' | 'Available'>('Active');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Dependency analysis
  const dependencyAnalysis = useMemo(() => {
    const graph = buildDependencyGraph(tasks);
    const blockedTasks = getBlockedTasksFromGraph(graph);
    const availableTasks = getAvailableTasksFromGraph(graph);
    
    return {
      graph,
      blockedTasks: blockedTasks.map(node => tasks.find((t: Task) => t.id === node.id)).filter(Boolean) as Task[],
      availableTasks: availableTasks.map(node => tasks.find((t: Task) => t.id === node.id)).filter(Boolean) as Task[],
      totalDependencies: graph.edges.length
    };
  }, [tasks]);

  const projectOptions = useMemo(() => {
    return [
      { id: 'All Projects', title: 'All Projects' }, 
      ...projects, 
      { id: 'standalone', title: 'Standalone Tasks' }
    ];
  }, [projects]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task: Task) => {
      const searchMatch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const projectMatch = projectFilter === 'All Projects' ||
                           (projectFilter === 'standalone' && !task.project_id) ||
                           task.project_id === projectFilter;

      let statusMatch = true;
      if (statusFilter === 'Active') {
        statusMatch = task.status === TaskStatus.TODO || task.status === TaskStatus.IN_PROGRESS;
      } else if (statusFilter === 'Blocked') {
        statusMatch = dependencyAnalysis.blockedTasks.some(t => t.id === task.id);
      } else if (statusFilter === 'Available') {
        statusMatch = dependencyAnalysis.availableTasks.some(t => t.id === task.id);
      } else if (statusFilter !== 'All') {
        statusMatch = task.status === statusFilter;
      }

      return searchMatch && projectMatch && statusMatch;
    });
  }, [tasks, searchTerm, projectFilter, statusFilter, dependencyAnalysis]);

  const getProjectTitle = (pId?: string): string => {
    if (!pId) return "Standalone";
    const project = projects.find((p: any) => p.id === pId);
    return project ? project.title : "Unknown Project";
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    addTask(newTask);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-900 text-slate-100 flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Task Management</h1>
          <p className="text-slate-400 mt-1">Organize, prioritize, and track task dependencies.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
        >
          <PlusIcon /> <span className="ml-2">New Task</span>
        </button>
      </div>

      {/* Dependency Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Tasks</p>
              <p className="text-2xl font-bold text-slate-200">{tasks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Blocked Tasks</p>
              <p className="text-2xl font-bold text-red-400">{dependencyAnalysis.blockedTasks.length}</p>
            </div>
            <ExclamationTriangleIcon />
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Available Tasks</p>
              <p className="text-2xl font-bold text-green-400">{dependencyAnalysis.availableTasks.length}</p>
            </div>
            <CheckCircleIcon />
          </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Dependencies</p>
              <p className="text-2xl font-bold text-blue-400">{dependencyAnalysis.totalDependencies}</p>
            </div>
          </div>
        </div>
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
          onChange={e => setStatusFilter(e.target.value as any)}
          className="bg-slate-700 border-slate-600 rounded-md text-sm py-2 px-3 focus:ring-sky-500 focus:border-sky-500"
          aria-label="Filter by status"
        >
          <option value="Active">Active Tasks</option>
          <option value="Available">Available Tasks</option>
          <option value="Blocked">Blocked Tasks</option>
          <option value="All">All Statuses</option>
          <option value={TaskStatus.TODO}>Todo</option>
          <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
          <option value={TaskStatus.COMPLETED}>Completed</option>
        </select>

        <div className="flex items-center space-x-1 p-0.5 bg-slate-700 rounded-md ml-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-600'}`}
            title="List view"
          >
            <ListIcon />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-600'}`}
            title="Grid view"
          >
            <GridIcon />
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`p-1.5 rounded-md ${viewMode === 'graph' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-600'}`}
            title="Dependency graph"
          >
            <GraphIcon />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'graph' ? (
          <DependencyGraphView
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            selectedTaskId={selectedTask?.id}
            className="h-full"
          />
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto h-12 w-12 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
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
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <div key={task.id} onClick={() => handleTaskClick(task)} className="cursor-pointer">
                  <TaskItem 
                    task={task} 
                    projectTitle={getProjectTitle(task.project_id)}
                    onEditTaskRequest={() => {}}
                    onDeleteTask={() => {}}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTasks.map(task => (
                <div key={task.id} onClick={() => handleTaskClick(task)} className="cursor-pointer">
                  <TaskCard 
                    task={task} 
                    projectTitle={getProjectTitle(task.project_id)}
                    onEditTaskRequest={() => {}}
                    onDeleteTask={() => {}}
                  />
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <NewTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddTask={handleAddTask}
          projects={projects}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal
          isOpen={selectedTask !== null}
          onClose={() => setSelectedTask(null)}
          task={selectedTask!}
          onUpdate={(updatedTask: Task) => {
            // Handle task update
            console.log('Task updated:', updatedTask);
            setSelectedTask(null);
          }}
          onDelete={(taskId: string) => {
            // Handle task deletion
            console.log('Task deleted:', taskId);
            setSelectedTask(null);
          }}
          allTasks={filteredTasks}
          allProjects={projects}
        />
      )}
    </div>
  );
};

export default EnhancedTaskManagement; 