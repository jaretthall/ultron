import React, { useMemo } from 'react';
import { Project, Task, TaskStatus, TaskPriority } from '../../../types';
import { calculateUrgencyScore, calculateProjectHealthScore } from '../../utils/projectUtils';

interface CriticalAlertsPanelProps {
  projects: Project[];
  tasks: Task[];
}

interface CriticalItem {
  id: string;
  title: string;
  type: 'project' | 'task';
  urgency: number;
  daysOverdue: number;
  reason: string;
  severity: 'critical' | 'warning' | 'info';
}

const CriticalAlertsPanel: React.FC<CriticalAlertsPanelProps> = ({ projects, tasks }) => {
  const criticalItems = useMemo((): CriticalItem[] => {
    const items: CriticalItem[] = [];
    const now = new Date();

    // Check projects for critical issues
    projects.forEach(project => {
      const urgencyScore = calculateUrgencyScore(project.deadline);
      const healthScore = calculateProjectHealthScore(project, tasks);
      
      // Overdue projects
      if (project.deadline && new Date(project.deadline) < now && project.status !== 'completed') {
        const daysOverdue = Math.ceil((now.getTime() - new Date(project.deadline).getTime()) / (1000 * 60 * 60 * 24));
        items.push({
          id: project.id,
          title: project.title,
          type: 'project',
          urgency: urgencyScore,
          daysOverdue,
          reason: `Overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`,
          severity: daysOverdue > 7 ? 'critical' : 'warning'
        });
      }
      
      // Projects with low health scores
      else if (healthScore < 40 && project.status === 'active') {
        items.push({
          id: project.id,
          title: project.title,
          type: 'project',
          urgency: urgencyScore,
          daysOverdue: 0,
          reason: 'Poor project health - needs attention',
          severity: 'warning'
        });
      }
      
      // Projects due soon with low completion
      else if (urgencyScore >= 70 && project.status === 'active') {
        const projectTasks = tasks.filter(t => t.project_id === project.id);
        const completedTasks = projectTasks.filter(t => t.status === TaskStatus.COMPLETED);
        const completion = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0;
        
        if (completion < 50) {
          const daysUntil = project.deadline ? 
            Math.ceil((new Date(project.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
          items.push({
            id: project.id,
            title: project.title,
            type: 'project',
            urgency: urgencyScore,
            daysOverdue: 0,
            reason: `Due in ${daysUntil} days, only ${Math.round(completion)}% complete`,
            severity: urgencyScore >= 90 ? 'critical' : 'warning'
          });
        }
      }
    });

    // Check tasks for critical issues
    tasks.forEach(task => {
      const urgencyScore = calculateUrgencyScore(task.due_date);
      
      // Overdue tasks
      if (task.due_date && new Date(task.due_date) < now && task.status !== TaskStatus.COMPLETED) {
        const daysOverdue = Math.ceil((now.getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24));
        items.push({
          id: task.id,
          title: task.title,
          type: 'task',
          urgency: urgencyScore,
          daysOverdue,
          reason: `Overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`,
          severity: daysOverdue > 3 ? 'critical' : 'warning'
        });
      }
      
      // High priority tasks due soon
      else if (task.priority === TaskPriority.URGENT && urgencyScore >= 80 && task.status !== TaskStatus.COMPLETED) {
        const daysUntil = task.due_date ? 
          Math.ceil((new Date(task.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        items.push({
          id: task.id,
          title: task.title,
          type: 'task',
          urgency: urgencyScore,
          daysOverdue: 0,
          reason: `Urgent task due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
          severity: 'warning'
        });
      }
      
      // Tasks with no progress but high priority
      else if ((task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT) && 
               task.status === TaskStatus.TODO && 
               (!task.progress || task.progress === 0)) {
        items.push({
          id: task.id,
          title: task.title,
          type: 'task',
          urgency: urgencyScore,
          daysOverdue: 0,
          reason: 'High priority task not started',
          severity: 'info'
        });
      }
    });

    // Sort by severity and urgency
    return items
      .sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, info: 1 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return b.urgency - a.urgency;
      })
      .slice(0, 12); // Show all critical items, limit to 12 for performance
  }, [projects, tasks]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getSeverityBorderClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-900/10';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-900/10';
      default:
        return 'border-l-blue-500 bg-blue-900/10';
    }
  };

  if (criticalItems.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Critical Alerts</h2>
        <div className="flex flex-col items-center justify-center py-8">
          <svg className="w-12 h-12 text-green-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-300 text-center">All caught up! No critical items need immediate attention.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Critical Alerts</h2>
        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          {criticalItems.length}
        </span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {criticalItems.map(item => (
          <div
            key={`${item.type}-${item.id}`}
            className={`border-l-4 rounded-r-lg p-3 ${getSeverityBorderClass(item.severity)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getSeverityIcon(item.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-slate-400 uppercase">
                    {item.type}
                  </span>
                  {item.urgency >= 90 && (
                    <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded">
                      URGENT
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-medium text-slate-200 truncate mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400">
                  {item.reason}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CriticalAlertsPanel;