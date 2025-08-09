export interface AppLabels {
  projects: string;
  project: string;
  tasks: string;
  task: string;
  newProject: string;
  newTask: string;
  editProject: string;
  editTask: string;
  projectDashboard: string;
  taskManagement: string;
  counseling?: string;
  counselingSession?: string;
  projectsDescription: string;
  tasksDescription: string;
}

export const labelsBusiness: AppLabels = {
  projects: 'Projects',
  project: 'Project',
  tasks: 'Tasks',
  task: 'Task',
  newProject: 'New Project',
  newTask: 'New Task',
  editProject: 'Edit Project',
  editTask: 'Edit Task',
  projectDashboard: 'Project Dashboard',
  taskManagement: 'Task Management',
  counseling: 'Counseling',
  counselingSession: 'Counseling Session',
  projectsDescription: 'Manage your business projects',
  tasksDescription: 'Track and complete your tasks',
};

export const labelsStudent: AppLabels = {
  projects: 'Classes',
  project: 'Class',
  tasks: 'Assignments',
  task: 'Assignment',
  newProject: 'New Class',
  newTask: 'New Assignment',
  editProject: 'Edit Class',
  editTask: 'Edit Assignment',
  projectDashboard: 'Classes Dashboard',
  taskManagement: 'Assignment Management',
  // Note: counseling is intentionally omitted for student mode
  projectsDescription: 'Manage your classes and courses',
  tasksDescription: 'Track and complete your assignments',
};

export type AppMode = 'business' | 'student';

export const getLabels = (mode: AppMode): AppLabels => {
  return mode === 'student' ? labelsStudent : labelsBusiness;
};