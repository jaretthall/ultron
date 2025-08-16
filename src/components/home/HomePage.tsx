import React, { useState } from 'react';
import { Project, Task, ProjectContext, TaskStatus, TaskPriority } from '../../../types';
import { useAppState } from '../../contexts/AppStateContext';
import NewTaskModal from '../tasks/NewTaskModal';
import NewProjectModal from '../projects/NewProjectModal';
import EditTaskModal from '../tasks/EditTaskModal';
import OverallProgressIndicator from './OverallProgressIndicator';
import ClinicalNotesAlert from './ClinicalNotesAlert';
import CompactMonthView from '../calendar/views/CompactMonthView';
import GlassPanel from '../common/GlassPanel';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = () => {
  const { state, addTask, addProject, updateTask } = useAppState();
  const {
    projects,
    tasks,
    // userPreferences,
    // isAuthenticated,
    // allProjects,
    // user
  } = state;

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Handlers for adding tasks and projects
  const handleAddTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await addTask(task);
      console.log('✅ Task added successfully');
    } catch (error) {
      console.error('❌ Failed to add task:', error);
    }
  };

  const handleAddProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await addProject(project);
      console.log('✅ Project added successfully');
    } catch (error) {
      console.error('❌ Failed to add project:', error);
    }
  };

  const handleEditTaskRequest = (task: Task) => {
    setEditingTask(task);
  };

  // Data for dashboard widgets - show all projects, not just business ones
  const recentProjects = projects.slice(0, 5);
  const urgentTasks = tasks.filter((t: Task) => t.priority === TaskPriority.URGENT && t.status === TaskStatus.TODO).slice(0, 5);
  const inProgressTasks = tasks.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS).slice(0, 5);

  // Task priority color mapping
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case TaskPriority.HIGH:
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case TaskPriority.LOW:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  // Project status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'on_hold':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 min-h-screen relative" data-testid="dashboard-content">

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Dashboard</h1>
            <p className="text-slate-400 text-sm">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={() => setIsTaskModalOpen(true)}
              className="glass-button bg-gradient-to-r from-sky-600/80 to-sky-500/80 hover:from-sky-600 hover:to-sky-500 text-white py-2.5 px-5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 backdrop-blur-xl border border-sky-500/30 shadow-lg hover:shadow-sky-500/25"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Task</span>
            </button>
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="glass-button bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 hover:from-emerald-600 hover:to-emerald-500 text-white py-2.5 px-5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 backdrop-blur-xl border border-emerald-500/30 shadow-lg hover:shadow-emerald-500/25"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        <div className="mb-6">
          <ClinicalNotesAlert tasks={tasks} onTaskClick={handleEditTaskRequest} />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          
          {/* Recent Projects */}
          <GlassPanel
            title="Recent Projects"
            className="lg:col-span-1"
            actions={
              <span className="text-xs text-slate-400">
                {recentProjects.length} active
              </span>
            }
          >
            {recentProjects.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400 mb-3">No projects yet</p>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                          {project.title}
                        </h4>
                        {project.goals && project.goals.length > 0 && (
                          <p className="text-xs text-slate-400 mt-1 truncate">
                            {project.goals[0]}
                          </p>
                        )}
                      </div>
                      <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* Urgent Tasks */}
          <GlassPanel
            title="Urgent Tasks"
            className="lg:col-span-1"
            actions={
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">
                  {urgentTasks.length} urgent
                </span>
              </div>
            }
          >
            {urgentTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-emerald-400 font-medium">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No urgent tasks right now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleEditTaskRequest(task)}
                    className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/30 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                          {task.title}
                        </h4>
                        {task.due_date && (
                          <p className="text-xs text-red-400 mt-1">
                            Due {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* In Progress Tasks */}
          <GlassPanel
            title="In Progress"
            className="lg:col-span-1"
            actions={
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">
                  {inProgressTasks.length} active
                </span>
              </div>
            }
          >
            {inProgressTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400 mb-3">No tasks in progress</p>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
                >
                  Start working on something
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {inProgressTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleEditTaskRequest(task)}
                    className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                          {task.title}
                        </h4>
                        {task.estimated_hours && (
                          <p className="text-xs text-blue-400 mt-1">
                            ~{task.estimated_hours}h estimated
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-300 font-medium">Working</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* Task Stats & Quick Actions */}
          <GlassPanel title="Task Overview" className="lg:col-span-1">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-300">{tasks.length}</div>
                <div className="text-xs uppercase tracking-wide text-blue-400/80 font-medium">Total</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-300">{tasks.filter(t => t.status === TaskStatus.TODO).length}</div>
                <div className="text-xs uppercase tracking-wide text-yellow-400/80 font-medium">Todo</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                <div className="text-2xl font-bold text-emerald-300">{tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}</div>
                <div className="text-xs uppercase tracking-wide text-emerald-400/80 font-medium">Active</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-300">{tasks.filter(t => t.status === TaskStatus.COMPLETED).length}</div>
                <div className="text-xs uppercase tracking-wide text-purple-400/80 font-medium">Done</div>
              </div>
            </div>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600/80 to-blue-600/80 hover:from-sky-600 hover:to-blue-600 text-white text-sm font-medium transition-all duration-200 backdrop-blur-xl border border-sky-500/30"
            >
              + New Task
            </button>
          </GlassPanel>
        </div>

        {/* Bottom Row - Notes and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Quick Notes */}
          <GlassPanel
            title="📝 Quick Notes"
            actions={
              <button className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded-lg transition-all duration-200 border border-blue-500/30">
                + New Note
              </button>
            }
          >
            <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-400 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Notes are saved in the cloud and sync across all your devices!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Notes List */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Notes (0)</h4>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 text-center min-h-[200px] flex flex-col items-center justify-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-600/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">No notes yet</p>
                  <p className="text-xs text-slate-500">Create your first note to get started</p>
                </div>
              </div>

              {/* Note Editor */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Select a Note</h4>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 text-center min-h-[200px] flex flex-col items-center justify-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-600/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Select a note to view or edit</p>
                  <p className="text-xs text-slate-500">Notes are saved locally across browser sessions</p>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Shopping Lists */}
          <GlassPanel
            title="🛒 Shopping Lists"
            actions={
              <button className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs rounded-lg transition-all duration-200 border border-emerald-500/30">
                + New List
              </button>
            }
          >
            <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-400 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Shopping lists are saved in the cloud and sync across all your devices!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Lists */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Your Lists (0)</h4>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 text-center min-h-[200px] flex flex-col items-center justify-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-600/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">No shopping lists yet</p>
                  <p className="text-xs text-slate-500">Create your first list to get started</p>
                </div>
              </div>

              {/* List Items */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Select a List</h4>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 text-center min-h-[200px] flex flex-col items-center justify-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-600/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400 mb-1">Select a list to view items</p>
                  <p className="text-xs text-slate-500">Lists are saved locally across sessions</p>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Progress & Calendar Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <GlassPanel title="Calendar" className="lg:col-span-1">
            <CompactMonthView
              currentDate={new Date()}
              selectedDate={new Date()}
              events={[]}
              onDateSelect={() => {}}
              onEventClick={() => {}}
            />
          </GlassPanel>

          {/* Progress Overview */}
          <GlassPanel title="Overall Progress" className="lg:col-span-2">
            <OverallProgressIndicator projects={projects} tasks={tasks} />
          </GlassPanel>
        </div>
      </div>
      
      {/* Modals */}
      {isTaskModalOpen && (
        <NewTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onAddTask={handleAddTask}
          projects={projects}
        />
      )}
      
      {isProjectModalOpen && (
        <NewProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onAddProject={handleAddProject}
        />
      )}

      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onUpdateTask={async (updatedTask) => {
            await updateTask(updatedTask.id, updatedTask);
            setEditingTask(null);
          }}
          task={editingTask}
          projects={projects}
        />
      )}
    </div>
  );
};

export default HomePage;