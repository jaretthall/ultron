import React, { useMemo } from 'react';
import { Project, Task, ProjectContext, TaskStatus } from '../../../types';
import { calculateProjectCompletion } from '../../utils/projectUtils';

interface OverallProgressIndicatorProps {
  projects: Project[];
  tasks: Task[];
}

interface ProgressData {
  overall: number;
  business: number;
  personal: number;
  businessTasksCompleted: number;
  businessTasksTotal: number;
  personalTasksCompleted: number;
  personalTasksTotal: number;
}

const OverallProgressIndicator: React.FC<OverallProgressIndicatorProps> = ({ projects, tasks }) => {
  const progressData = useMemo((): ProgressData => {
    // Filter projects by context
    const businessProjects = projects.filter(p => p.context === ProjectContext.BUSINESS);
    const personalProjects = projects.filter(p => p.context === ProjectContext.PERSONAL);
    
    // Filter tasks by context (including standalone tasks)
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

    // Calculate project completion percentages
    const businessProjectCompletion = businessProjects.length > 0 
      ? businessProjects.reduce((sum, project) => sum + calculateProjectCompletion(project, tasks), 0) / businessProjects.length
      : 0;
      
    const personalProjectCompletion = personalProjects.length > 0
      ? personalProjects.reduce((sum, project) => sum + calculateProjectCompletion(project, tasks), 0) / personalProjects.length
      : 0;

    // Calculate task completion
    const businessTasksCompleted = businessTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const personalTasksCompleted = personalTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    
    // Calculate task-based completion percentages
    const businessTaskCompletion = businessTasks.length > 0 ? (businessTasksCompleted / businessTasks.length) * 100 : 0;
    const personalTaskCompletion = personalTasks.length > 0 ? (personalTasksCompleted / personalTasks.length) * 100 : 0;

    // Weight project and task completion (60% projects, 40% tasks)
    const businessProgress = Math.round((businessProjectCompletion * 0.6) + (businessTaskCompletion * 0.4));
    const personalProgress = Math.round((personalProjectCompletion * 0.6) + (personalTaskCompletion * 0.4));
    
    // Overall progress (weighted by volume)
    const totalItems = businessTasks.length + personalTasks.length + businessProjects.length + personalProjects.length;
    const businessWeight = totalItems > 0 ? (businessTasks.length + businessProjects.length) / totalItems : 0;
    const personalWeight = totalItems > 0 ? (personalTasks.length + personalProjects.length) / totalItems : 0;
    
    const overallProgress = Math.round((businessProgress * businessWeight) + (personalProgress * personalWeight));

    return {
      overall: overallProgress,
      business: businessProgress,
      personal: personalProgress,
      businessTasksCompleted,
      businessTasksTotal: businessTasks.length,
      personalTasksCompleted,
      personalTasksTotal: personalTasks.length,
    };
  }, [projects, tasks]);

  const CircularProgress: React.FC<{ percentage: number; size: number; color: string; label: string }> = ({ percentage, size, color, label }) => {
    const radius = (size - 8) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-slate-700"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth="4"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-in-out"
            />
          </svg>
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-100">{percentage}%</span>
          </div>
        </div>
        <span className="mt-2 text-sm font-medium text-slate-300">{label}</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Overall Progress</h2>
      
      {/* Main progress circles */}
      <div className="flex justify-around items-center mb-6">
        <CircularProgress
          percentage={progressData.overall}
          size={120}
          color="#06b6d4"
          label="Overall"
        />
        <CircularProgress
          percentage={progressData.business}
          size={100}
          color="#8b5cf6"
          label="Business"
        />
        <CircularProgress
          percentage={progressData.personal}
          size={100}
          color="#10b981"
          label="Personal"
        />
      </div>

      {/* Detailed breakdown */}
      <div className="border-t border-slate-700 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-700 rounded-lg p-3">
            <h4 className="font-medium text-purple-400 mb-2">Business</h4>
            <div className="space-y-1 text-slate-300">
              <p>Tasks: {progressData.businessTasksCompleted}/{progressData.businessTasksTotal}</p>
              <p>Projects: {projects.filter(p => p.context === ProjectContext.BUSINESS).length}</p>
            </div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <h4 className="font-medium text-green-400 mb-2">Personal</h4>
            <div className="space-y-1 text-slate-300">
              <p>Tasks: {progressData.personalTasksCompleted}/{progressData.personalTasksTotal}</p>
              <p>Projects: {projects.filter(p => p.context === ProjectContext.PERSONAL).length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallProgressIndicator;