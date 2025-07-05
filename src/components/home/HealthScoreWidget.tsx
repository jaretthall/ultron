import React, { useMemo } from 'react';
import { Project, Task, TaskStatus } from '../../../types';
import { calculateProjectHealthScore, calculateUrgencyScore } from '../../utils/projectUtils';

interface HealthScoreWidgetProps {
  projects: Project[];
  tasks: Task[];
}

interface HealthMetrics {
  overallScore: number;
  projectHealth: number;
  taskHealth: number;
  blockedTasksCount: number;
  overdueItemsCount: number;
  productivityTrend: 'up' | 'down' | 'stable';
  recommendations: string[];
}

const HealthScoreWidget: React.FC<HealthScoreWidgetProps> = ({ projects, tasks }) => {
  const healthMetrics = useMemo((): HealthMetrics => {
    const now = new Date();
    
    // Calculate project health scores
    const projectHealthScores = projects
      .filter(p => p.status === 'active')
      .map(project => calculateProjectHealthScore(project, tasks));
    
    const avgProjectHealth = projectHealthScores.length > 0 
      ? projectHealthScores.reduce((sum, score) => sum + score, 0) / projectHealthScores.length
      : 100;

    // Calculate task health
    const activeTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED);
    const overdueTasks = activeTasks.filter(t => 
      t.due_date && new Date(t.due_date) < now
    );
    const highPriorityStuckTasks = activeTasks.filter(t => 
      (t.priority === 'high' || t.priority === 'urgent') && 
      t.status === TaskStatus.TODO && 
      (!t.progress || t.progress === 0)
    );
    
    // Task health based on overdue percentage and stuck high-priority tasks
    const overduePercentage = activeTasks.length > 0 ? (overdueTasks.length / activeTasks.length) * 100 : 0;
    const stuckTaskPenalty = Math.min(highPriorityStuckTasks.length * 10, 30);
    const taskHealth = Math.max(0, 100 - overduePercentage - stuckTaskPenalty);

    // Count blocked tasks (simplified - tasks with dependencies)
    const blockedTasksCount = tasks.filter(t => 
      t.dependencies && t.dependencies.length > 0 && t.status !== TaskStatus.COMPLETED
    ).length;

    // Count overdue items
    const overdueProjects = projects.filter(p => 
      p.deadline && new Date(p.deadline) < now && p.status !== 'completed'
    ).length;
    const overdueItemsCount = overdueTasks.length + overdueProjects;

    // Calculate overall health score
    const overallScore = Math.round((avgProjectHealth * 0.6) + (taskHealth * 0.4));

    // Simple productivity trend (based on completion rates)
    const recentlyCompletedTasks = tasks.filter(t => {
      if (!t.updated_at || t.status !== TaskStatus.COMPLETED) return false;
      const updatedDate = new Date(t.updated_at);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return updatedDate >= weekAgo;
    }).length;

    const productivityTrend: 'up' | 'down' | 'stable' = 
      recentlyCompletedTasks > activeTasks.length * 0.3 ? 'up' :
      recentlyCompletedTasks < activeTasks.length * 0.1 ? 'down' : 'stable';

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (overdueItemsCount > 0) {
      recommendations.push(`Address ${overdueItemsCount} overdue item${overdueItemsCount > 1 ? 's' : ''}`);
    }
    
    if (highPriorityStuckTasks.length > 0) {
      recommendations.push(`Start work on ${highPriorityStuckTasks.length} high-priority task${highPriorityStuckTasks.length > 1 ? 's' : ''}`);
    }
    
    if (blockedTasksCount > 0) {
      recommendations.push(`Resolve ${blockedTasksCount} blocked task${blockedTasksCount > 1 ? 's' : ''}`);
    }
    
    if (avgProjectHealth < 50) {
      recommendations.push('Review struggling projects for roadblocks');
    }
    
    if (productivityTrend === 'down') {
      recommendations.push('Consider adjusting workload or priorities');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is healthy - maintain current momentum');
    }

    return {
      overallScore,
      projectHealth: Math.round(avgProjectHealth),
      taskHealth: Math.round(taskHealth),
      blockedTasksCount,
      overdueItemsCount,
      productivityTrend,
      recommendations: recommendations.slice(0, 3), // Limit to top 3
    };
  }, [projects, tasks]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6">System Health</h2>
      
      {/* Overall Health Score */}
      <div className="text-center mb-6">
        <div className="relative inline-flex items-center justify-center w-24 h-24 mb-2">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-slate-700"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthMetrics.overallScore / 100)}`}
              strokeLinecap="round"
              className={getScoreColor(healthMetrics.overallScore)}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${getScoreColor(healthMetrics.overallScore)}`}>
              {healthMetrics.overallScore}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-400">Overall Health Score</p>
      </div>

      {/* Health Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Project Health</span>
            <span className={`text-sm font-medium ${getScoreColor(healthMetrics.projectHealth)}`}>
              {healthMetrics.projectHealth}%
            </span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getScoreBgColor(healthMetrics.projectHealth)}`}
              style={{ width: `${healthMetrics.projectHealth}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-slate-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Task Health</span>
            <span className={`text-sm font-medium ${getScoreColor(healthMetrics.taskHealth)}`}>
              {healthMetrics.taskHealth}%
            </span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getScoreBgColor(healthMetrics.taskHealth)}`}
              style={{ width: `${healthMetrics.taskHealth}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center">
          <div className="text-lg font-bold text-red-400">{healthMetrics.overdueItemsCount}</div>
          <div className="text-xs text-slate-400">Overdue</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-400">{healthMetrics.blockedTasksCount}</div>
          <div className="text-xs text-slate-400">Blocked</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            {getTrendIcon(healthMetrics.productivityTrend)}
            <span className="text-sm font-medium text-slate-300">
              {healthMetrics.productivityTrend === 'up' ? 'Rising' : 
               healthMetrics.productivityTrend === 'down' ? 'Falling' : 'Stable'}
            </span>
          </div>
          <div className="text-xs text-slate-400">Trend</div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3">Recommendations</h3>
        <div className="space-y-2">
          {healthMetrics.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-slate-300">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthScoreWidget;