import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../state/AppStateContext';
import { AnalyticsService, AnalyticsData } from '../../../services/analyticsService';
import StatCard from '../StatCard';
import LoadingSpinner from '../LoadingSpinner';

// Chart Icons
const ChartIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const TrendIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);

const GoalIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const { state } = useAppContext();
  const { projects, tasks } = state;
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    const calculateAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = AnalyticsService.calculateAnalytics(projects, tasks);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error calculating analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateAnalytics();
  }, [projects, tasks]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <LoadingSpinner size="h-8 w-8" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={`text-center text-slate-400 ${className}`}>
        <p>Unable to load analytics data</p>
      </div>
    );
  }

  const { productivity, trends, goals, workloadInsights } = analyticsData;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-sky-400 mb-2">Analytics Dashboard</h1>
        <p className="text-slate-400">Performance metrics and productivity insights</p>
      </div>

      {/* Productivity Metrics */}
      <section>
        <h2 className="text-xl font-semibold text-sky-300 mb-4 flex items-center">
          <ChartIcon />
          <span className="ml-2">Productivity Metrics</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Task Completion Rate"
            value={`${productivity.taskCompletionRate.toFixed(1)}%`}
            icon={<ChartIcon />}
            color="text-emerald-400"
          />
          <StatCard
            title="Project Completion Rate"
            value={`${productivity.projectCompletionRate.toFixed(1)}%`}
            icon={<GoalIcon />}
            color="text-blue-400"
          />
          <StatCard
            title="Time Estimation Accuracy"
            value={`${productivity.timeEstimationAccuracy.toFixed(1)}%`}
            icon={<ClockIcon />}
            color="text-purple-400"
          />
          <StatCard
            title="Avg Task Duration"
            value={`${productivity.averageTaskCompletionTime.toFixed(1)}h`}
            icon={<ClockIcon />}
            color="text-yellow-400"
          />
        </div>
      </section>

      {/* Priority Distribution */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-sky-300 mb-4">Priority Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{productivity.priorityDistribution.urgent.toFixed(1)}%</div>
            <div className="text-sm text-slate-400">Urgent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{productivity.priorityDistribution.high.toFixed(1)}%</div>
            <div className="text-sm text-slate-400">High</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{productivity.priorityDistribution.medium.toFixed(1)}%</div>
            <div className="text-sm text-slate-400">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{productivity.priorityDistribution.low.toFixed(1)}%</div>
            <div className="text-sm text-slate-400">Low</div>
          </div>
        </div>
      </section>

      {/* Goal Metrics */}
      <section>
        <h2 className="text-xl font-semibold text-sky-300 mb-4 flex items-center">
          <GoalIcon />
          <span className="ml-2">Goal Achievement</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Goal Completion Rate"
            value={`${goals.goalCompletionRate.toFixed(1)}%`}
            icon={<GoalIcon />}
            color="text-emerald-400"
          />
          <StatCard
            title="Total Goals"
            value={goals.totalGoals}
            icon={<GoalIcon />}
            color="text-blue-400"
          />
          <StatCard
            title="Projects with Goals"
            value={goals.projectsWithGoals}
            icon={<GoalIcon />}
            color="text-purple-400"
          />
        </div>
      </section>

      {/* Productivity Trends */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-sky-300 flex items-center">
            <TrendIcon />
            <span className="ml-2">Productivity Trends</span>
          </h2>
          <div className="flex space-x-2">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-sm rounded ${
                  selectedPeriod === period
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trends[selectedPeriod].slice(-8).map((period, index) => (
            <div key={period.period} className="bg-slate-700 p-4 rounded-lg">
              <div className="text-sm text-slate-400 mb-2">
                {new Date(period.period).toLocaleDateString()}
              </div>
              <div className="space-y-1">
                <div className="text-emerald-400 font-semibold">
                  {period.tasksCompleted} tasks
                </div>
                <div className="text-blue-400">
                  {period.projectsCompleted} projects
                </div>
                <div className="text-yellow-400">
                  {period.hoursWorked}h worked
                </div>
                <div className="text-purple-400">
                  {period.completionRate}% rate
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workload Insights */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-sky-300 mb-4">Workload Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Workload */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Current Workload</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Tasks In Progress:</span>
                <span className="text-emerald-400 font-semibold">{workloadInsights.totalTasksInProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Tasks/Project:</span>
                <span className="text-blue-400 font-semibold">{workloadInsights.averageTasksPerProject.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Most Active Projects */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Most Active Projects</h3>
            <div className="space-y-2">
              {workloadInsights.mostActiveProjects.slice(0, 3).map((item, index) => (
                <div key={item.project.id} className="flex justify-between items-center">
                  <span className="text-slate-300 truncate max-w-[150px]">
                    {item.project.title}
                  </span>
                  <span className="text-sky-400 font-semibold">{item.taskCount} tasks</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        {workloadInsights.upcomingDeadlines.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">Upcoming Deadlines</h3>
            <div className="space-y-2">
              {workloadInsights.upcomingDeadlines.slice(0, 5).map((deadline, index) => (
                <div key={index} className="flex justify-between items-center bg-slate-700 p-2 rounded">
                  <span className="text-slate-300 truncate max-w-[200px]">
                    {'title' in deadline.entity ? deadline.entity.title : deadline.entity.title}
                  </span>
                  <span className={`font-semibold ${
                    deadline.daysUntil <= 3 ? 'text-red-400' : 
                    deadline.daysUntil <= 7 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {deadline.daysUntil === 0 ? 'Today' : 
                     deadline.daysUntil === 1 ? 'Tomorrow' : 
                     `${deadline.daysUntil} days`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AnalyticsDashboard; 