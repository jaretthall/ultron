import { Project, Task, EnrichedProject } from '../../types';

/**
 * Calculate project completion percentage based on associated tasks
 */
export const calculateProjectCompletion = (
  project: Project, 
  tasks: Task[]
): number => {
  const projectTasks = tasks.filter(task => task.project_id === project.id);
  
  if (projectTasks.length === 0) {
    // If no tasks, consider completion based on project status
    return project.status === 'completed' ? 100 : 0;
  }
  
  const completedTasks = projectTasks.filter(task => task.status === 'completed');
  return Math.round((completedTasks.length / projectTasks.length) * 100);
};

/**
 * Calculate urgency score based on deadline proximity
 */
export const calculateUrgencyScore = (deadline?: string): number => {
  if (!deadline) return 0;
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) return 100; // Overdue
  if (daysUntil <= 3) return 90;
  if (daysUntil <= 7) return 70;
  if (daysUntil <= 14) return 50;
  if (daysUntil <= 30) return 30;
  return 10;
};

/**
 * Enrich a project with calculated metrics
 */
export const enrichProject = (
  project: Project, 
  tasks: Task[]
): EnrichedProject => {
  const projectTasks = tasks.filter(task => task.project_id === project.id);
  const _completedTasks = projectTasks.filter(task => task.status === 'completed');
  const activeTasks = projectTasks.filter(task => task.status !== 'completed');
  
  return {
    ...project,
    completion_percentage: calculateProjectCompletion(project, tasks),
    active_tasks_count: activeTasks.length,
    total_tasks_count: projectTasks.length,
    urgency_score: calculateUrgencyScore(project.deadline),
  };
};

/**
 * Sort projects by priority (urgency + business relevance)
 */
export const sortProjectsByPriority = (projects: EnrichedProject[]): EnrichedProject[] => {
  return projects.sort((a, b) => {
    const aPriority = (a.urgency_score || 0) + ((a.business_relevance || 5) * 10);
    const bPriority = (b.urgency_score || 0) + ((b.business_relevance || 5) * 10);
    return bPriority - aPriority;
  });
};

/**
 * Filter projects by context
 */
export const filterProjectsByContext = (
  projects: Project[], 
  context: 'business' | 'personal' | 'hybrid'
): Project[] => {
  return projects.filter(project => project.context === context);
};

/**
 * Get projects that need attention (overdue or with blocked tasks)
 */
export const getProjectsNeedingAttention = (
  projects: EnrichedProject[], 
  tasks: Task[]
): EnrichedProject[] => {
  return projects.filter(project => {
    // Check if project is overdue
    if (project.deadline) {
      const deadlineDate = new Date(project.deadline);
      const now = new Date();
      if (deadlineDate < now && project.status !== 'completed') {
        return true;
      }
    }
    
    // Check if project has tasks with unresolved dependencies
    const projectTasks = tasks.filter(task => task.project_id === project.id);
    const hasBlockedTasks = projectTasks.some(task => {
      if (task.dependencies && task.dependencies.length > 0) {
        return task.dependencies.some(depId => {
          const depTask = tasks.find(t => t.id === depId);
          return depTask && depTask.status !== 'completed';
        });
      }
      return false;
    });
    
    return hasBlockedTasks;
  });
};

/**
 * Calculate overall project health score (0-100)
 */
export const calculateProjectHealthScore = (
  project: EnrichedProject,
  tasks: Task[]
): number => {
  let score = 100;
  
  // Reduce score for overdue projects
  if (project.urgency_score && project.urgency_score >= 80) {
    score -= 30;
  }
  
  // Reduce score for low completion with close deadline
  if (project.completion_percentage < 50 && project.urgency_score && project.urgency_score > 50) {
    score -= 20;
  }
  
  // Reduce score for blocked tasks
  const projectTasks = tasks.filter(task => task.project_id === project.id);
  const blockedTasksCount = projectTasks.filter(task => {
    if (task.dependencies && task.dependencies.length > 0) {
      return task.dependencies.some(depId => {
        const depTask = tasks.find(t => t.id === depId);
        return depTask && depTask.status !== 'completed';
      });
    }
    return false;
  }).length;
  
  if (blockedTasksCount > 0) {
    score -= (blockedTasksCount * 10);
  }
  
  return Math.max(0, score);
};

export const calculateProjectProgress = (project: Project, tasks: Task[]): number => {
  const projectTasks = tasks.filter(task => task.project_id === project.id);
  
  if (projectTasks.length === 0) return 0;
  
  const totalTasks = projectTasks.length;
  const completedCount = projectTasks.filter(task => task.status === 'completed').length;
  
  return Math.round((completedCount / totalTasks) * 100);
}; 