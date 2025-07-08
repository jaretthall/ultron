import React, { useMemo } from 'react';
import { Project, Task, TaskStatus, TaskPriority, ProjectStatus, ProjectContext } from '../../../types';

interface EnhancedHomeStatsProps {
  projects: Project[];
  tasks: Task[];
}

interface StatsData {
  completionStats: {
    tasksCompletedToday: number;
    tasksCompletedThisWeek: number;
    avgTasksPerDay: number;
  };
  priorityBreakdown: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  contextStats: {
    businessTasksActive: number;
    personalTasksActive: number;
    businessProjectsActive: number;
    personalProjectsActive: number;
  };
  deadlineStats: {
    dueTodayCount: number;
    dueThisWeekCount: number;
    overdueCount: number;
    upcomingCount: number;
  };
  productivityMetrics: {
    avgProgressPerTask: number;
    totalEstimatedHours: number;
    completedHours: number;
    efficiencyRating: number;
  };
}

const EnhancedHomeStats: React.FC<EnhancedHomeStatsProps> = ({ projects, tasks }) => {
  // Memoize static icons to prevent re-creation on every render
  const icons = useMemo(() => ({
    check: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    clock: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    trending: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    exclamation: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    calendar: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    chart: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  }), []);

  const stats = useMemo((): StatsData => {
    const now = new Date();
    const today = now.toDateString();
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Completion stats
    const tasksCompletedToday = tasks.filter(t => 
      t.status === TaskStatus.COMPLETED && 
      t.updated_at && 
      new Date(t.updated_at).toDateString() === today
    ).length;

    const tasksCompletedThisWeek = tasks.filter(t => 
      t.status === TaskStatus.COMPLETED && 
      t.updated_at && 
      new Date(t.updated_at) >= thisWeekStart
    ).length;

    const avgTasksPerDay = tasksCompletedThisWeek / 7;

    // Priority breakdown (active tasks only)
    const activeTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED);
    const priorityBreakdown = {
      urgent: activeTasks.filter(t => t.priority === TaskPriority.URGENT).length,
      high: activeTasks.filter(t => t.priority === TaskPriority.HIGH).length,
      medium: activeTasks.filter(t => t.priority === TaskPriority.MEDIUM).length,
      low: activeTasks.filter(t => t.priority === TaskPriority.LOW).length,
    };

    // Context stats
    const businessTasks = tasks.filter(t => {
      if (t.project_id) {
        const project = projects.find(p => p.id === t.project_id);
        return project?.context === ProjectContext.BUSINESS;
      }
      return t.task_context === 'business';
    });

    const personalTasks = tasks.filter(t => {
      if (t.project_id) {
        const project = projects.find(p => p.id === t.project_id);
        return project?.context === ProjectContext.PERSONAL;
      }
      return t.task_context === 'personal';
    });

    const contextStats = {
      businessTasksActive: businessTasks.filter(t => t.status !== TaskStatus.COMPLETED).length,
      personalTasksActive: personalTasks.filter(t => t.status !== TaskStatus.COMPLETED).length,
      businessProjectsActive: projects.filter(p => 
        p.context === ProjectContext.BUSINESS && p.status === ProjectStatus.ACTIVE
      ).length,
      personalProjectsActive: projects.filter(p => 
        p.context === ProjectContext.PERSONAL && p.status === ProjectStatus.ACTIVE
      ).length,
    };

    // Deadline stats
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    const thisWeekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const allItems = [
      ...tasks.filter(t => t.due_date && t.status !== TaskStatus.COMPLETED),
      ...projects.filter(p => p.deadline && p.status !== 'completed')
    ];

    const deadlineStats = {
      dueTodayCount: allItems.filter(item => {
        const dueDate = new Date((item as any).due_date || (item as any).deadline);
        return dueDate <= todayEnd && dueDate >= now;
      }).length,
      
      dueThisWeekCount: allItems.filter(item => {
        const dueDate = new Date((item as any).due_date || (item as any).deadline);
        return dueDate <= thisWeekEnd && dueDate > todayEnd;
      }).length,
      
      overdueCount: allItems.filter(item => {
        const dueDate = new Date((item as any).due_date || (item as any).deadline);
        return dueDate < now;
      }).length,
      
      upcomingCount: allItems.filter(item => {
        const dueDate = new Date((item as any).due_date || (item as any).deadline);
        return dueDate > thisWeekEnd;
      }).length,
    };

    // Productivity metrics
    const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
    const completedHours = completedTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
    
    const tasksWithProgress = tasks.filter(t => t.progress !== undefined);
    const avgProgressPerTask = tasksWithProgress.length > 0 
      ? tasksWithProgress.reduce((sum, task) => sum + (task.progress || 0), 0) / tasksWithProgress.length
      : 0;

    // Efficiency rating (0-100) based on completion rate and progress
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
    const efficiencyRating = Math.round((completionRate * 0.7) + (avgProgressPerTask * 0.3));

    return {
      completionStats: {
        tasksCompletedToday,
        tasksCompletedThisWeek,
        avgTasksPerDay,
      },
      priorityBreakdown,
      contextStats,
      deadlineStats,
      productivityMetrics: {
        avgProgressPerTask,
        totalEstimatedHours,
        completedHours,
        efficiencyRating,
      },
    };
  }, [projects, tasks]);

  const StatCard: React.FC<{ 
    title: string; 
    value: number | string; 
    subtitle?: string; 
    color?: string;
    icon?: React.ReactNode;
  }> = React.memo(({ title, value, subtitle, color = 'text-slate-300', icon }) => (
    <div className="bg-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        {icon && <div className={color}>{icon}</div>}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  ));

  return (
    <div className="space-y-6">
      {/* Completion Stats */}
      <div className="bg-slate-800 rounded-lg p-4 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold text-white mb-4">Productivity Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard
            title="Completed Today"
            value={stats.completionStats.tasksCompletedToday}
            color="text-green-400"
            icon={icons.check}
          />
          <StatCard
            title="This Week"
            value={stats.completionStats.tasksCompletedThisWeek}
            subtitle={`${stats.completionStats.avgTasksPerDay.toFixed(1)} avg/day`}
            color="text-blue-400"
          />
          <StatCard
            title="Efficiency"
            value={`${stats.productivityMetrics.efficiencyRating}%`}
            color={
              stats.productivityMetrics.efficiencyRating >= 80 ? 'text-green-400' :
              stats.productivityMetrics.efficiencyRating >= 60 ? 'text-yellow-400' : 'text-red-400'
            }
          />
          <StatCard
            title="Avg Progress"
            value={`${Math.round(stats.productivityMetrics.avgProgressPerTask)}%`}
            subtitle="Per active task"
            color="text-purple-400"
          />
        </div>
      </div>

      {/* Priority & Context Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-slate-800 rounded-lg p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-white mb-4">Priority Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-400">🔥 Urgent</span>
              <span className="text-lg font-bold text-red-400">{stats.priorityBreakdown.urgent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-400">⚡ High</span>
              <span className="text-lg font-bold text-orange-400">{stats.priorityBreakdown.high}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-400">📋 Medium</span>
              <span className="text-lg font-bold text-yellow-400">{stats.priorityBreakdown.medium}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-400">📝 Low</span>
              <span className="text-lg font-bold text-green-400">{stats.priorityBreakdown.low}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-white mb-4">Context Distribution</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-purple-400 mb-2">Business</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tasks</span>
                  <span className="text-slate-200">{stats.contextStats.businessTasksActive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Projects</span>
                  <span className="text-slate-200">{stats.contextStats.businessProjectsActive}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">Personal</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tasks</span>
                  <span className="text-slate-200">{stats.contextStats.personalTasksActive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Projects</span>
                  <span className="text-slate-200">{stats.contextStats.personalProjectsActive}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deadline & Hours Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-slate-800 rounded-lg p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-white mb-4">Deadline Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Due Today"
              value={stats.deadlineStats.dueTodayCount}
              color="text-red-400"
            />
            <StatCard
              title="This Week"
              value={stats.deadlineStats.dueThisWeekCount}
              color="text-yellow-400"
            />
            <StatCard
              title="Overdue"
              value={stats.deadlineStats.overdueCount}
              color="text-red-500"
            />
            <StatCard
              title="Upcoming"
              value={stats.deadlineStats.upcomingCount}
              color="text-blue-400"
            />
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-white mb-4">Time Tracking</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Estimated</span>
              <span className="text-lg font-bold text-blue-400">
                {stats.productivityMetrics.totalEstimatedHours.toFixed(1)}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Completed</span>
              <span className="text-lg font-bold text-green-400">
                {stats.productivityMetrics.completedHours.toFixed(1)}h
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${stats.productivityMetrics.totalEstimatedHours > 0 
                    ? (stats.productivityMetrics.completedHours / stats.productivityMetrics.totalEstimatedHours) * 100 
                    : 0}%` 
                }}
              ></div>
            </div>
            <div className="text-center">
              <span className="text-xs text-slate-400">
                {stats.productivityMetrics.totalEstimatedHours > 0 
                  ? Math.round((stats.productivityMetrics.completedHours / stats.productivityMetrics.totalEstimatedHours) * 100)
                  : 0}% Complete
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedHomeStats;