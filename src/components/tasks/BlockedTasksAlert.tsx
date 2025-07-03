import React, { useMemo } from 'react';
import { Task } from '../../../types';
import { buildDependencyGraph, getBlockedTasksFromGraph } from '../../utils/dependencyUtils';

interface BlockedTasksAlertProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  className?: string;
}

const ExclamationTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BlockedTasksAlert: React.FC<BlockedTasksAlertProps> = ({
  tasks,
  onTaskClick,
  className = ''
}) => {
  const [isDismissed, setIsDismissed] = React.useState(false);

  const blockedAnalysis = useMemo(() => {
    const graph = buildDependencyGraph(tasks);
    const blockedTaskNodes = getBlockedTasksFromGraph(graph);
    
    const blockedTasks = blockedTaskNodes.map(node => {
      const task = tasks.find(t => t.id === node.id);
      const blockingTasks = node.dependencies
        .map(depId => tasks.find(t => t.id === depId))
        .filter((t): t is Task => t !== undefined && t.status !== 'completed');
      
      return {
        task: task!,
        blockingTasks,
        blockingCount: blockingTasks.length
      };
    }).filter(item => item.task);

    // Find high-impact blocked tasks (tasks that have many dependents)
    const highImpactBlocked = blockedTasks.filter(item => {
      const dependents = tasks.filter(t => t.dependencies.includes(item.task.id));
      return dependents.length > 0;
    });

    // Find overdue blocking tasks
    const overdueBlockingTasks = new Set<string>();
    blockedTasks.forEach(item => {
      item.blockingTasks.forEach(blockingTask => {
        if (blockingTask.due_date && new Date(blockingTask.due_date) < new Date()) {
          overdueBlockingTasks.add(blockingTask.id);
        }
      });
    });

    return {
      blockedTasks,
      highImpactBlocked,
      overdueBlockingCount: overdueBlockingTasks.size,
      totalBlocked: blockedTasks.length
    };
  }, [tasks]);

  if (isDismissed || blockedAnalysis.totalBlocked === 0) {
    return null;
  }

  const severity = blockedAnalysis.totalBlocked > 5 ? 'high' : 
                  blockedAnalysis.totalBlocked > 2 ? 'medium' : 'low';

  const alertStyles = {
    high: 'bg-red-900/20 border-red-500/50 text-red-300',
    medium: 'bg-orange-900/20 border-orange-500/50 text-orange-300',
    low: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-300'
  };

  const iconStyles = {
    high: 'text-red-400',
    medium: 'text-orange-400',
    low: 'text-yellow-400'
  };

  return (
    <div className={`border rounded-lg p-4 ${alertStyles[severity]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`${iconStyles[severity]} mt-0.5`}>
            <ExclamationTriangleIcon />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {blockedAnalysis.totalBlocked} Task{blockedAnalysis.totalBlocked !== 1 ? 's' : ''} Blocked
            </h3>
            <p className="text-sm mt-1 opacity-90">
              {blockedAnalysis.totalBlocked === 1 
                ? 'One task is waiting for dependencies to be completed.'
                : `${blockedAnalysis.totalBlocked} tasks are waiting for dependencies to be completed.`
              }
            </p>

            {/* High Impact Alert */}
            {blockedAnalysis.highImpactBlocked.length > 0 && (
              <div className="mt-3 p-3 bg-black/20 rounded-md">
                <p className="text-sm font-medium">
                  ⚠️ {blockedAnalysis.highImpactBlocked.length} high-impact task{blockedAnalysis.highImpactBlocked.length !== 1 ? 's' : ''} blocked
                </p>
                <p className="text-xs mt-1 opacity-80">
                  These tasks are blocking other work and should be prioritized.
                </p>
              </div>
            )}

            {/* Overdue Dependencies Alert */}
            {blockedAnalysis.overdueBlockingCount > 0 && (
              <div className="mt-3 p-3 bg-red-900/30 rounded-md border border-red-600/30">
                <p className="text-sm font-medium text-red-200">
                  <ClockIcon /> {blockedAnalysis.overdueBlockingCount} overdue dependencies
                </p>
                <p className="text-xs mt-1 text-red-300">
                  Some blocking tasks are past their due dates.
                </p>
              </div>
            )}

            {/* Top Blocked Tasks */}
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Most Critical Blocked Tasks:</p>
              <div className="space-y-2">
                {blockedAnalysis.blockedTasks.slice(0, 3).map(({ task, blockingTasks }) => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-2 bg-black/20 rounded-md cursor-pointer hover:bg-black/30 transition-colors"
                    onClick={() => onTaskClick?.(task)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs opacity-70 flex items-center gap-1">
                          <LinkIcon />
                          {blockingTasks.length} dependencies
                        </span>
                        {task.due_date && (
                          <span className="text-xs opacity-70 flex items-center gap-1">
                            <ClockIcon />
                            Due {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs opacity-60">
                      Click to view
                    </div>
                  </div>
                ))}
              </div>

              {blockedAnalysis.blockedTasks.length > 3 && (
                <p className="text-xs mt-2 opacity-70">
                  ...and {blockedAnalysis.blockedTasks.length - 3} more blocked tasks
                </p>
              )}
            </div>

            {/* Action Suggestions */}
            <div className="mt-4 p-3 bg-black/20 rounded-md">
              <p className="text-sm font-medium">💡 Suggestions:</p>
              <ul className="text-xs mt-2 space-y-1 opacity-90">
                <li>• Focus on completing blocking dependencies first</li>
                <li>• Review if any dependencies can be removed or simplified</li>
                <li>• Consider breaking down complex tasks into smaller pieces</li>
                {blockedAnalysis.overdueBlockingCount > 0 && (
                  <li>• Address overdue blocking tasks immediately</li>
                )}
              </ul>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsDismissed(true)}
          className="text-gray-400 hover:text-white ml-4 p-1 rounded transition-colors"
          title="Dismiss alert"
        >
          <XMarkIcon />
        </button>
      </div>
    </div>
  );
};

export default BlockedTasksAlert; 