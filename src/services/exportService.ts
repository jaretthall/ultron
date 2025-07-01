
import {
  Project, Task, UserPreferences, WorkspaceSnapshot, EnrichedProject,
  PriorityGroups, TagPatterns, UrgencyMetrics, TimeMetrics, StrategicInsights,
  TaskStatus, TaskPriority, TagUsage, ProjectStatus
} from '../types';
import { generateStrategicInsights } from './geminiService';
import { APP_VERSION } from '../constants';

const calculateCompletionPercentage = (projectId: string, tasks: Task[]): number => {
  const projectTasks = tasks.filter(task => task.project_id === projectId); // snake_case
  if (projectTasks.length === 0) return 0;
  const completedTasks = projectTasks.filter(task => task.status === TaskStatus.COMPLETED);
  return Math.round((completedTasks.length / projectTasks.length) * 100);
};

const enrichProjects = (projects: Project[], tasks: Task[]): EnrichedProject[] => {
  return projects.map(project => {
    const projectTasks = tasks.filter(task => task.project_id === project.id); // snake_case
    return {
      ...project,
      completion_percentage: calculateCompletionPercentage(project.id, tasks), // snake_case
      active_tasks_count: projectTasks.filter(task => task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.TODO).length, // snake_case
      total_tasks_count: projectTasks.length, // snake_case
    };
  });
};

const groupTasksByPriority = (tasks: Task[]): PriorityGroups => {
  return {
    urgent: tasks.filter(task => task.priority === TaskPriority.URGENT),
    high: tasks.filter(task => task.priority === TaskPriority.HIGH),
    medium: tasks.filter(task => task.priority === TaskPriority.MEDIUM),
    low: tasks.filter(task => task.priority === TaskPriority.LOW),
  };
};

const analyzeTags = (projects: Project[], tasks: Task[]): TagPatterns => {
  const tagMap: Map<string, { count: number; projectIds: Set<string>; taskIds: Set<string> }> = new Map();

  projects.forEach(project => {
    project.tags.forEach(tag => {
      if (!tagMap.has(tag)) tagMap.set(tag, { count: 0, projectIds: new Set(), taskIds: new Set() });
      const current = tagMap.get(tag)!;
      current.count++;
      current.projectIds.add(project.id);
    });
  });

  tasks.forEach(task => {
    task.tags.forEach(tag => {
      if (!tagMap.has(tag)) tagMap.set(tag, { count: 0, projectIds: new Set(), taskIds: new Set() });
      const current = tagMap.get(tag)!;
      current.count++;
      current.taskIds.add(task.id);
    });
  });

  const allTagsWithUsage: TagUsage[] = Array.from(tagMap.entries()).map(([tag, data]) => ({
    tag,
    count: data.count,
    related_project_ids: Array.from(data.projectIds), // snake_case
    related_task_ids: Array.from(data.taskIds), // snake_case
  })).sort((a,b) => b.count - a.count);

  return {
    all_tags_with_usage: allTagsWithUsage, // snake_case
    most_frequent_tags: allTagsWithUsage.slice(0, 5), // snake_case
  };
};

const analyzeUrgency = (projects: EnrichedProject[], tasks: Task[]): UrgencyMetrics => {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const overdueTasks = tasks.filter(task => task.due_date && new Date(task.due_date) < now && task.status !== TaskStatus.COMPLETED); // snake_case
  const tasksDueSoon = tasks.filter(task =>
    task.due_date && // snake_case
    new Date(task.due_date) >= now && // snake_case
    new Date(task.due_date) <= sevenDaysFromNow && // snake_case
    task.status !== TaskStatus.COMPLETED
  );

  const upcomingDeadlines: UrgencyMetrics['upcoming_deadlines'] = []; // snake_case
  projects.forEach(p => {
    if (p.deadline && new Date(p.deadline) >= now && new Date(p.deadline) <= sevenDaysFromNow && p.status !== ProjectStatus.COMPLETED) {
      upcomingDeadlines.push({ entity_id: p.id, entity_title: p.title, deadline: p.deadline, type: 'project' }); // snake_case for entity_id, entity_title
    }
  });
  tasksDueSoon.forEach(t => {
     if (t.due_date) { // snake_case
        upcomingDeadlines.push({ entity_id: t.id, entity_title: t.title, deadline: t.due_date, type: 'task' }); // snake_case for entity_id, entity_title
     }
  });

  upcomingDeadlines.sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return {
    overdue_tasks_count: overdueTasks.length, // snake_case
    tasks_due_soon_count: tasksDueSoon.length, // snake_case
    upcoming_deadlines: upcomingDeadlines.slice(0,10), // snake_case
  };
};

const analyzeTime = (tasks: Task[]): TimeMetrics => {
  const totalEstimatedHoursAllTasks = tasks.reduce((sum, task) => sum + task.estimated_hours, 0); // snake_case
  const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);
  const totalEstimatedHoursCompletedTasks = completedTasks.reduce((sum, task) => sum + task.estimated_hours, 0); // snake_case
  const pendingTasks = tasks.filter(task => task.status !== TaskStatus.COMPLETED);
  const totalEstimatedHoursPendingTasks = pendingTasks.reduce((sum, task) => sum + task.estimated_hours, 0); // snake_case

  return {
    total_estimated_hours_all_tasks: totalEstimatedHoursAllTasks, // snake_case
    total_estimated_hours_completed_tasks: totalEstimatedHoursCompletedTasks, // snake_case
    total_estimated_hours_pending_tasks: totalEstimatedHoursPendingTasks, // snake_case
    average_task_estimation: tasks.length > 0 ? Math.round(totalEstimatedHoursAllTasks / tasks.length * 10) / 10 : 0, // snake_case
  };
};


export const generateWorkspaceSnapshot = async (
  projects: Project[],
  tasks: Task[],
  userPreferences: UserPreferences
): Promise<WorkspaceSnapshot> => {
  const enrichedP = enrichProjects(projects, tasks);
  const tasksByP = groupTasksByPriority(tasks);
  const tagA = analyzeTags(projects, tasks);
  const urgencyA = analyzeUrgency(enrichedP, tasks);
  const timeA = analyzeTime(tasks);

  const strategicI: StrategicInsights = await generateStrategicInsights(projects, tasks, userPreferences);

  return {
    metadata: {
      export_date: new Date().toISOString(), // snake_case
      app_version: APP_VERSION, // snake_case
      user_preferences: userPreferences, // Assuming userPreferences type is already snake_case
    },
    projects: enrichedP,
    tasks_by_priority: tasksByP, // snake_case
    all_tasks: tasks, // snake_case
    tag_analysis: tagA, // snake_case
    urgency_analysis: urgencyA, // snake_case
    time_analysis: timeA, // snake_case
    strategic_insights: strategicI, // Assuming strategicI is already snake_case
  };
};
