import { supabase } from '../lib/supabaseClient';
import { getCustomAuthUser } from '../src/contexts/CustomAuthContext';
import { IdGenerator } from '../src/utils/idGeneration';
import { enhanceError } from '../src/utils/errorHandling';
import { RetryableOperations } from '../src/utils/retryLogic';
import { CACHE_KEYS, CACHE_TTL, cacheInvalidation, withCache } from '../src/utils/dataCache';
import {
  Project, Task, UserPreferences, Tag, TagCategory, Schedule,
  ProjectStatus, ProjectContext, TaskPriority, TaskStatus
} from '../types';

// Generic error handler for database operations
interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

class DatabaseServiceError extends Error {
  public details?: string;
  public hint?: string;
  public code?: string;

  constructor(error: DatabaseError) {
    super(error.message);
    this.name = 'DatabaseServiceError';
    this.details = error.details;
    this.hint = error.hint;
    this.code = error.code;
  }
}

// Enhanced error handler using Phase 2 error handling system
const handleError = (context: string, error: any): never => {
  // Use the enhanced error handling system
  throw enhanceError(error, context);
};

// Projects Service
export const projectsService = {
  async getAll(): Promise<Project[]> {
    console.log('🔍 projectsService.getAll() called');
    
    if (!supabase) {
      throw enhanceError(new Error('Supabase client not initialized'), 'projectsService.getAll');
    }

    // Use cache for frequently accessed projects data
    return withCache(
      CACHE_KEYS.ALL_PROJECTS,
      async () => {
        return RetryableOperations.databaseRead(async () => {
          console.log('📊 Fetching projects from Supabase...');
          const { data, error } = await supabase!!
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
          
          console.log('📊 Projects fetch result:', { 
            projectCount: data?.length || 0, 
            error: error,
            sample: data?.[0] || null 
          });
          
          if (error) {
            handleError('fetching projects', error);
          }
          
          return data || [];
        }, 'projectsService.getAll');
      },
      CACHE_TTL.MEDIUM
    );
  },

  async getById(id: string): Promise<Project | null> {
    if (!supabase) {
      throw enhanceError(new Error('Supabase client not initialized'), 'projectsService.getById');
    }
    
    // Validate ID format
    const idValidation = IdGenerator.validateEntityId(id, 'Project');
    if (!idValidation.isValid) {
      throw enhanceError(new Error(idValidation.error!), 'project ID validation');
    }
    
    return RetryableOperations.databaseRead(async () => {
      const { data, error } = await supabase!
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        handleError('fetching project by ID', error);
      }
      return data;
    }, 'projectsService.getById');
  },

  async create(project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Project> {
    if (!supabase) {
      throw enhanceError(new Error('Supabase client not initialized'), 'projectsService.create');
    }
    
    // Get current user from custom auth
    const user = getCustomAuthUser();
    if (!user) {
      throw enhanceError(new Error('User not authenticated'), 'project creation authentication');
    }
    
    // Validate user ID format
    const userIdValidation = IdGenerator.validateEntityId(user.id, 'User');
    if (!userIdValidation.isValid) {
      throw enhanceError(new Error(userIdValidation.error!), 'user ID validation');
    }
    
    return RetryableOperations.databaseWrite(async () => {
      // Clean the project data to remove any unwanted fields
      const cleanProject: any = {
        id: IdGenerator.generateProjectId(), // Generate proper UUID
        user_id: user.id,
        title: project.title,
        context: project.context || '',
        status: project.status || 'active',
        goals: project.goals || [],
        tags: project.tags || [],
        business_relevance: project.business_relevance ?? 50,
        preferred_time_slots: project.preferred_time_slots || [],
      };
      
      // Only add optional fields if they have meaningful values
      if (project.deadline) cleanProject.deadline = project.deadline;
      
      const { data, error } = await supabase!
        .from('projects')
        .insert([cleanProject])
        .select()
        .single();
      
      if (error) handleError('creating project', error);
      
      // Invalidate relevant caches after successful creation
      cacheInvalidation.projects();
      
      return data;
    }, 'projectsService.create');
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    if (!supabase) {
      throw enhanceError(new Error('Supabase client not initialized'), 'projectsService.update');
    }
    
    // Validate ID format
    const idValidation = IdGenerator.validateEntityId(id, 'Project');
    if (!idValidation.isValid) {
      throw enhanceError(new Error(idValidation.error!), 'project ID validation');
    }
    
    return RetryableOperations.databaseWrite(async () => {
      const { data, error } = await supabase!
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleError('updating project', error);
      
      // Invalidate specific project and related caches
      cacheInvalidation.project(id);
      
      return data;
    }, 'projectsService.update');
  },

  async delete(id: string): Promise<void> {
    if (!supabase) {
      throw enhanceError(new Error('Supabase client not initialized'), 'projectsService.delete');
    }
    
    // Validate ID format
    const idValidation = IdGenerator.validateEntityId(id, 'Project');
    if (!idValidation.isValid) {
      throw enhanceError(new Error(idValidation.error!), 'project ID validation');
    }
    
    return RetryableOperations.databaseWrite(async () => {
      const { error } = await supabase!
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) handleError('deleting project', error);
      
      // Invalidate all project-related caches after deletion
      cacheInvalidation.projects();
      
    }, 'projectsService.delete');
  },

  async getByStatus(status: ProjectStatus): Promise<Project[]> {
    if (!supabase) {
      throw enhanceError(new Error('Supabase client not initialized'), 'projectsService.getByStatus');
    }
    
    return RetryableOperations.databaseRead(async () => {
      const { data, error } = await supabase!
        .from('projects')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });
      
      if (error) handleError('fetching projects by status', error);
      return data || [];
    }, 'projectsService.getByStatus');
  },

  async getByContext(context: ProjectContext): Promise<Project[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('context', context)
      .order('created_at', { ascending: false });
    
    if (error) handleError('fetching projects by context', error);
    return data || [];
  },

  async getWithCompletionMetrics(): Promise<Array<Project & { completion_percentage: number, task_count: number }>> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tasks:tasks(count),
        completed_tasks:tasks!inner(count)
      `)
      .eq('tasks.status', 'completed')
      .order('created_at', { ascending: false });
    
    if (error) handleError('fetching projects with completion metrics', error);
    
    return (data || []).map(project => ({
      ...project,
      completion_percentage: project.tasks?.length > 0 
        ? Math.round((project.completed_tasks?.length || 0) / project.tasks.length * 100)
        : 0,
      task_count: project.tasks?.length || 0
    }));
  },

  async getOverdueProjects(): Promise<Project[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .lt('deadline', now)
      .neq('status', 'completed')
      .order('deadline', { ascending: true });
    
    if (error) handleError('fetching overdue projects', error);
    return data || [];
  },

  async getProjectsByBusinessRelevance(minRelevance: number = 7): Promise<Project[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .gte('business_relevance', minRelevance)
      .order('business_relevance', { ascending: false });
    
    if (error) handleError('fetching projects by business relevance', error);
    return data || [];
  },

  async getProjectsByTimeSlot(timeSlot: string): Promise<Project[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .contains('preferred_time_slots', [timeSlot])
      .order('created_at', { ascending: false });
    
    if (error) handleError('fetching projects by time slot', error);
    return data || [];
  }
};

// Tasks Service
export const tasksService = {
  async getAll(): Promise<Task[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Use cache for frequently accessed tasks data
    return withCache(
      CACHE_KEYS.ALL_TASKS,
      async () => {
        const { data, error } = await supabase!
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) handleError('fetching tasks', error);
        return data || [];
      },
      CACHE_TTL.MEDIUM
    );
  },

  async getById(id: string): Promise<Task | null> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Validate ID format
    const idValidation = IdGenerator.validateEntityId(id, 'Task');
    if (!idValidation.isValid) {
      throw new Error(idValidation.error);
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      handleError('fetching task by id', error);
    }
    return data;
  },

  async create(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Task> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get current user from custom auth
    const user = getCustomAuthUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Validate user ID format
    const userIdValidation = IdGenerator.validateEntityId(user.id, 'User');
    if (!userIdValidation.isValid) {
      throw new Error(userIdValidation.error);
    }
    
    // Validate project ID if provided
    if (task.project_id) {
      const projectIdValidation = IdGenerator.validateEntityId(task.project_id, 'Project');
      if (!projectIdValidation.isValid) {
        throw new Error(projectIdValidation.error);
      }
    }
    
    // Clean the task data to remove any unwanted fields
    const cleanTask: any = {
      id: IdGenerator.generateTaskId(), // Generate proper UUID
      user_id: user.id,
      title: task.title,
      context: task.context || '',
      priority: task.priority,
      status: task.status,
      estimated_hours: task.estimated_hours || 0,
      dependencies: task.dependencies || [],
      tags: task.tags || [],
    };
    
    // Only add optional fields if they have meaningful values
    if (task.project_id) cleanTask.project_id = task.project_id;
    if (task.due_date) cleanTask.due_date = task.due_date;
    if (task.category) cleanTask.category = task.category;
    if (task.task_context) cleanTask.task_context = task.task_context;
    if (task.energy_level) cleanTask.energy_level = task.energy_level;
    if (task.notes) cleanTask.notes = task.notes;
    if (task.completion_notes) cleanTask.completion_notes = task.completion_notes;
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(cleanTask)
      .select()
      .single();
    
    if (error) handleError('creating task', error);
    
    // Invalidate task-related caches after successful creation
    cacheInvalidation.tasks();
    
    return data;
  },

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleError('updating task', error);
    
    // Invalidate specific task and related caches
    cacheInvalidation.task(id);
    
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) handleError('deleting task', error);
    
    // Invalidate all task-related caches after deletion
    cacheInvalidation.tasks();
  },

  async getByProject(projectId: string): Promise<Task[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) handleError('fetching tasks by project', error);
    return data || [];
  },

  async getByStatus(status: TaskStatus): Promise<Task[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) handleError('fetching tasks by status', error);
    return data || [];
  },

  async getByPriority(priority: TaskPriority): Promise<Task[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('priority', priority)
      .order('created_at', { ascending: false });
    
    if (error) handleError('fetching tasks by priority', error);
    return data || [];
  },

  async getDueSoon(days: number = 7): Promise<Task[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .not('due_date', 'is', null)
      .lte('due_date', futureDate.toISOString())
      .neq('status', 'completed')
      .order('due_date', { ascending: true });
    
    if (error) handleError('fetching tasks due soon', error);
    return data || [];
  },

  async getOverdue(): Promise<Task[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .not('due_date', 'is', null)
      .lt('due_date', now)
      .neq('status', 'completed')
      .order('due_date', { ascending: true });
    
    if (error) handleError('fetching overdue tasks', error);
    return data || [];
  },

  // ========== TASK DEPENDENCY MANAGEMENT ==========
  
  /**
   * Add a dependency relationship between tasks
   * @param taskId - The task that depends on another
   * @param dependencyId - The task that must be completed first
   */
  async addDependency(taskId: string, dependencyId: string): Promise<Task> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Validate both tasks exist
    const [task, dependencyTask] = await Promise.all([
      this.getById(taskId),
      this.getById(dependencyId)
    ]);
    
    if (!task) throw new Error(`Task with ID ${taskId} not found`);
    if (!dependencyTask) throw new Error(`Dependency task with ID ${dependencyId} not found`);
    
    // Prevent self-dependency
    if (taskId === dependencyId) {
      throw new Error('A task cannot depend on itself');
    }
    
    // Check for circular dependencies
    const wouldCreateCycle = await this.wouldCreateCircularDependency(taskId, dependencyId);
    if (wouldCreateCycle) {
      throw new Error('Adding this dependency would create a circular dependency');
    }
    
    // Add the dependency if it doesn't already exist
    const updatedDependencies = [...new Set([...task.dependencies, dependencyId])];
    
    return this.update(taskId, { dependencies: updatedDependencies });
  },

  /**
   * Remove a dependency relationship between tasks
   */
  async removeDependency(taskId: string, dependencyId: string): Promise<Task> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const task = await this.getById(taskId);
    if (!task) throw new Error(`Task with ID ${taskId} not found`);
    
    const updatedDependencies = task.dependencies.filter(id => id !== dependencyId);
    
    return this.update(taskId, { dependencies: updatedDependencies });
  },

  /**
   * Get all tasks that depend on the given task (dependents)
   */
  async getTaskDependents(taskId: string): Promise<Task[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .contains('dependencies', [taskId]);
    
    if (error) handleError('fetching task dependents', error);
    return data || [];
  },

  /**
   * Get all tasks that the given task depends on (dependencies)
   */
  async getTaskDependencies(taskId: string): Promise<Task[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const task = await this.getById(taskId);
    if (!task || !task.dependencies.length) return [];
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('id', task.dependencies);
    
    if (error) handleError('fetching task dependencies', error);
    return data || [];
  },

  /**
   * Check if adding a dependency would create a circular dependency - OPTIMIZED
   */
  async wouldCreateCircularDependency(taskId: string, newDependencyId: string): Promise<boolean> {
    // Get all tasks once for in-memory graph traversal
    const { data: allTasks, error } = await supabase!
      .from('tasks')
      .select('id, dependencies')
      .order('created_at', { ascending: false });

    if (error) {
      handleError('fetching tasks for circular dependency check', error);
      return false;
    }

    if (!allTasks) return false;
    
    // Build dependency map for efficient lookups
    const taskDependencies = new Map<string, string[]>();
    for (const task of allTasks) {
      taskDependencies.set(task.id, task.dependencies || []);
    }
    
    // Use in-memory graph traversal instead of database calls
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (currentTaskId: string): boolean => {
      if (recursionStack.has(currentTaskId)) return true;
      if (visited.has(currentTaskId)) return false;
      
      visited.add(currentTaskId);
      recursionStack.add(currentTaskId);
      
      // Get dependencies from map instead of database
      const dependencies = currentTaskId === taskId 
        ? [...(taskDependencies.get(currentTaskId) || []), newDependencyId]
        : (taskDependencies.get(currentTaskId) || []);
      
      for (const depId of dependencies) {
        if (hasCycle(depId)) return true;
      }
      
      recursionStack.delete(currentTaskId);
      return false;
    };
    
    return hasCycle(taskId);
  },

  /**
   * Get all blocked tasks (tasks with incomplete dependencies)
   */
  async getBlockedTasks(): Promise<Array<Task & { blockingTasks: Task[], blockingTaskTitles: string[] }>> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get all tasks in one query to build dependency map
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status, dependencies, project_id, description, due_date, priority, created_at, updated_at, tags, user_id')
      .order('created_at', { ascending: false });

    if (tasksError) handleError('fetching all tasks for blocked analysis', tasksError);
    
    if (!allTasks) return [];
    
    // Build task lookup map for efficient dependency resolution
    const taskMap = new Map(allTasks.map(task => [task.id, task]));
    const blockedTasks: Array<Task & { blockingTasks: Task[], blockingTaskTitles: string[] }> = [];
    
    // Process tasks with dependencies
    for (const task of allTasks) {
      if (task.status === 'completed' || !task.dependencies?.length) continue;
      
      // Resolve dependencies using map lookup instead of database queries
      const blockingTasks: Task[] = [];
      for (const depId of task.dependencies) {
        const depTask = taskMap.get(depId);
        if (depTask && depTask.status !== 'completed') {
          blockingTasks.push(depTask as Task);
        }
      }
      
      if (blockingTasks.length > 0) {
        blockedTasks.push({
          ...(task as Task),
          blockingTasks,
          blockingTaskTitles: blockingTasks.map(dep => dep.title)
        });
      }
    }
    
    return blockedTasks;
  },

  /**
   * Get available tasks (tasks with no incomplete dependencies)
   */
  async getAvailableTasks(): Promise<Task[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get all tasks in one query to build dependency map
    const { data: allTasks, error } = await supabase!
      .from('tasks')
      .select('id, title, status, dependencies, project_id, description, due_date, priority, created_at, updated_at, tags, user_id, context, estimated_hours')
      .order('created_at', { ascending: false });

    if (error) handleError('fetching all tasks for available analysis', error);
    
    if (!allTasks) return [];
    
    // Build task lookup map for efficient dependency resolution
    const taskMap = new Map(allTasks.map(task => [task.id, task]));
    const availableTasks: Task[] = [];
    
    // Process non-completed tasks
    for (const task of allTasks) {
      if (task.status === 'completed') continue;
      
      if (!task.dependencies?.length) {
        // No dependencies - always available
        availableTasks.push(task as Task);
      } else {
        // Check if all dependencies are completed using map lookup
        const hasIncompleteDeps = task.dependencies.some((depId: string) => {
          const depTask = taskMap.get(depId);
          return depTask && depTask.status !== 'completed';
        });
        
        if (!hasIncompleteDeps) {
          availableTasks.push(task as Task);
        }
      }
    }
    
    return availableTasks;
  },

  /**
   * Get dependency graph data for visualization
   */
  async getDependencyGraph(): Promise<{
    nodes: Array<{ id: string, title: string, status: TaskStatus, priority: TaskPriority }>,
    edges: Array<{ from: string, to: string }>
  }> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const allTasks = await this.getAll();
    
    const nodes = allTasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority
    }));
    
    const edges: Array<{ from: string, to: string }> = [];
    
    for (const task of allTasks) {
      for (const depId of task.dependencies) {
        edges.push({
          from: depId, // Dependency points to dependent
          to: task.id
        });
      }
    }
    
    return { nodes, edges };
  },

  /**
   * Calculate task priority score based on dependencies and other factors
   */
  async calculateDynamicPriority(taskId: string): Promise<number> {
    const task = await this.getById(taskId);
    if (!task) return 0;
    
    let score = 0;
    
    // Base priority score
    const priorityScores = {
      'urgent': 100,
      'high': 75,
      'medium': 50,
      'low': 25
    };
    score += priorityScores[task.priority] || 50;
    
    // Deadline urgency (if due date exists)
    if (task.due_date) {
      const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 0) score += 50; // Overdue
      else if (daysUntilDue <= 3) score += 30; // Due soon
      else if (daysUntilDue <= 7) score += 15; // Due this week
    }
    
    // Dependency impact (how many tasks are blocked by this one)
    const dependents = await this.getTaskDependents(taskId);
    score += dependents.length * 10; // Each dependent adds 10 points
    
    // Estimated effort (higher effort = slightly higher priority for batching)
    score += Math.min(task.estimated_hours * 2, 20); // Cap at 20 points
    
    return Math.min(score, 200); // Cap total score at 200
  },

  /**
   * Get tasks ordered by dynamic priority score
   */
  async getTasksByDynamicPriority(): Promise<Array<Task & { priorityScore: number }>> {
    // Get all tasks in one query
    const { data: allTasks, error } = await supabase!
      .from('tasks')
      .select('id, title, status, dependencies, project_id, description, due_date, priority, created_at, updated_at, tags, user_id, estimated_hours, context')
      .order('created_at', { ascending: false });

    if (error) handleError('fetching tasks for priority calculation', error);
    if (!allTasks) return [];

    // Build task map for efficient lookups
    const tasksWithScores: Array<Task & { priorityScore: number }> = [];
    
    // Calculate priority scores in batch without individual database calls
    for (const task of allTasks) {
      if (task.status !== 'completed') {
        const priorityScore = this.calculateDynamicPriorityBatch(task as Task, allTasks as Task[]);
        tasksWithScores.push({ ...(task as Task), priorityScore });
      }
    }
    
    return tasksWithScores.sort((a, b) => b.priorityScore - a.priorityScore);
  },

  /**
   * Calculate dynamic priority score without database calls (batch optimized)
   */
  calculateDynamicPriorityBatch(task: Task, allTasks: Task[]): number {
    let score = 0;
    
    // Base priority score
    const priorityScores: { [key: string]: number } = {
      'urgent': 100,
      'high': 75,
      'medium': 50,
      'low': 25
    };
    score += priorityScores[task.priority] || 50;
    
    // Deadline urgency (if due date exists)
    if (task.due_date) {
      const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 0) score += 50; // Overdue
      else if (daysUntilDue <= 3) score += 30; // Due soon
      else if (daysUntilDue <= 7) score += 15; // Due this week
    }
    
    // Dependency impact (how many tasks are blocked by this one)
    const dependents = allTasks.filter(t => t.dependencies?.includes(task.id));
    score += dependents.length * 10; // Each dependent adds 10 points
    
    // Estimated effort (higher effort = slightly higher priority for batching)
    score += Math.min((task.estimated_hours || 0) * 2, 20); // Cap at 20 points
    
    return score;
  }
};

// Schedules Service
export const schedulesService = {
  async getAll(): Promise<Schedule[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    try {
      // Get current user first
      const user = getCustomAuthUser();
      if (!user) {
        console.warn('No authenticated user found for schedules.getAll()');
        return [];
      }

      const { data, error } = await supabase
        .from('schedules')
        .select(`
          id,
          user_id,
          title,
          context,
          start_date,
          end_date,
          all_day,
          event_type,
          location,
          recurring,
          reminders,
          blocks_work_time,
          tags,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });
      
      if (error) {
        console.error('Supabase error fetching schedules:', error);
        handleError('fetching schedules', error);
      }

      // Convert JSONB fields back to strings for the interface
      return (data || []).map(schedule => ({
        ...schedule,
        recurring: schedule.recurring ? JSON.stringify(schedule.recurring) : null,
        reminders: schedule.reminders ? JSON.stringify(schedule.reminders) : null,
        // tags is already an array, no conversion needed
      }));
    } catch (err) {
      console.error('Error in schedulesService.getAll():', err);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  async getById(id: string): Promise<Schedule | null> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      handleError('fetching schedule by id', error);
    }
    
    // Convert JSONB fields back to strings for the interface
    if (data) {
      data.recurring = data.recurring ? JSON.stringify(data.recurring) : null;
      data.reminders = data.reminders ? JSON.stringify(data.reminders) : null;
      // tags is already an array, no conversion needed
    }
    
    return data;
  },

  async create(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Schedule> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get current user from custom auth
    const user = getCustomAuthUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate required fields
    if (!schedule.title || !schedule.start_date || !schedule.end_date) {
      throw new Error('Title, start_date, and end_date are required');
    }

    // Validate date format
    try {
      new Date(schedule.start_date).toISOString();
      new Date(schedule.end_date).toISOString();
    } catch (dateError) {
      throw new Error('Invalid date format provided');
    }
    
    // Clean the schedule data
    const cleanSchedule: any = {
      id: IdGenerator.generateScheduleId(),
      user_id: user.id,
      title: schedule.title.trim(),
      context: schedule.context ? schedule.context.trim() : '',
      start_date: schedule.start_date,
      end_date: schedule.end_date,
      all_day: schedule.all_day || false,
      event_type: schedule.event_type || 'other',
      location: schedule.location ? schedule.location.trim() : null,
      recurring: null, // Simplified for now to avoid JSON parsing issues
      reminders: null, // Simplified for now to avoid JSON parsing issues
      blocks_work_time: schedule.blocks_work_time || false,
      tags: Array.isArray(schedule.tags) ? schedule.tags : [],
    };

    // Handle JSON fields more safely
    if (schedule.recurring) {
      try {
        cleanSchedule.recurring = typeof schedule.recurring === 'string' ? JSON.parse(schedule.recurring) : schedule.recurring;
      } catch (jsonError) {
        console.warn('Invalid recurring JSON, setting to null:', schedule.recurring);
        cleanSchedule.recurring = null;
      }
    }

    if (schedule.reminders) {
      try {
        cleanSchedule.reminders = typeof schedule.reminders === 'string' ? JSON.parse(schedule.reminders) : schedule.reminders;
      } catch (jsonError) {
        console.warn('Invalid reminders JSON, setting to null:', schedule.reminders);
        cleanSchedule.reminders = null;
      }
    }
    
    // Note: schedules table doesn't have project_id column based on actual schema
    // Removed project_id assignment since column doesn't exist
    
    const { data, error } = await supabase
      .from('schedules')
      .insert([cleanSchedule])
      .select()
      .single();
    
    if (error) handleError('creating schedule', error);
    
    // Convert JSONB fields back to strings for the interface
    if (data) {
      data.recurring = data.recurring ? JSON.stringify(data.recurring) : null;
      data.reminders = data.reminders ? JSON.stringify(data.reminders) : null;
      // tags is already an array, no conversion needed
    }
    
    return data;
  },

  async update(id: string, updates: Partial<Schedule>): Promise<Schedule> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Handle JSON fields
    const cleanUpdates: any = { ...updates };
    if (cleanUpdates.recurring && typeof cleanUpdates.recurring === 'string') {
      cleanUpdates.recurring = JSON.parse(cleanUpdates.recurring);
    }
    if (cleanUpdates.reminders && typeof cleanUpdates.reminders === 'string') {
      cleanUpdates.reminders = JSON.parse(cleanUpdates.reminders);
    }
    // tags is already an array in the database, no conversion needed
    
    const { data, error } = await supabase
      .from('schedules')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleError('updating schedule', error);
    
    // Convert JSONB fields back to strings for the interface
    if (data) {
      data.recurring = data.recurring ? JSON.stringify(data.recurring) : null;
      data.reminders = data.reminders ? JSON.stringify(data.reminders) : null;
      // tags is already an array, no conversion needed
    }
    
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);
    
    if (error) handleError('deleting schedule', error);
  },

  // Note: Removed getByProject method since schedules table doesn't have project_id column
  // If you need to get schedules related to a project, you'll need to:
  // 1. Get tasks for the project
  // 2. Get schedules for those tasks using task_id
  async getByTask(taskId: string): Promise<Schedule[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('task_id', taskId)
      .order('start_date', { ascending: true });
    
    if (error) handleError('fetching schedules by task', error);
    
    // Convert JSONB fields back to strings for the interface
    return (data || []).map(schedule => ({
      ...schedule,
      recurring: schedule.recurring ? JSON.stringify(schedule.recurring) : null,
      reminders: schedule.reminders ? JSON.stringify(schedule.reminders) : null,
      // tags is already an array, no conversion needed
    }));
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .order('start_date', { ascending: true });
    
    if (error) handleError('fetching schedules by date range', error);
    
    // Convert JSONB fields back to strings for the interface
    return (data || []).map(schedule => ({
      ...schedule,
      recurring: schedule.recurring ? JSON.stringify(schedule.recurring) : null,
      reminders: schedule.reminders ? JSON.stringify(schedule.reminders) : null,
      // tags is already an array, no conversion needed
    }));
  },

  async getBlockingEvents(startDate: string, endDate: string): Promise<Schedule[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .eq('blocks_work_time', true)
      .order('start_date', { ascending: true });
    
    if (error) handleError('fetching blocking events', error);
    
    // Convert JSONB fields back to strings for the interface
    return (data || []).map(schedule => ({
      ...schedule,
      recurring: schedule.recurring ? JSON.stringify(schedule.recurring) : null,
      reminders: schedule.reminders ? JSON.stringify(schedule.reminders) : null,
      // tags is already an array, no conversion needed
    }));
  }
};

// User Preferences Service
export const userPreferencesService = {
  async get(): Promise<UserPreferences | null> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get current user from custom auth
    const user = getCustomAuthUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      handleError('fetching user preferences', error);
    }
    return data;
  },

  async create(preferences: Omit<UserPreferences, 'id' | 'user_id'>): Promise<UserPreferences> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get current user from custom auth
    const user = getCustomAuthUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // First check if preferences already exist (due to database trigger)
    const { data: existingPreferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (existingPreferences) {
      // Update existing preferences instead of creating new ones
      return await this.update(preferences);
    }
    
    // Construct clean preferences object
    const cleanPreferences = {
      id: IdGenerator.generatePreferencesId(), // Generate proper UUID
      user_id: user.id,
      working_hours_start: preferences.working_hours_start || "09:00",
      working_hours_end: preferences.working_hours_end || "17:00",
      focus_block_duration: preferences.focus_block_duration ?? 90,
      break_duration: preferences.break_duration ?? 15,
      priority_weight_deadline: preferences.priority_weight_deadline ?? 0.4,
      priority_weight_effort: preferences.priority_weight_effort ?? 0.3,
      priority_weight_deps: preferences.priority_weight_deps ?? 0.3,
      ai_provider: preferences.ai_provider || 'gemini',
      selected_gemini_model: preferences.selected_gemini_model || 'gemini-1.5-flash',
      ...(preferences.instructions && { instructions: preferences.instructions }),
      ...(preferences.business_hours_start && { business_hours_start: preferences.business_hours_start }),
      ...(preferences.business_hours_end && { business_hours_end: preferences.business_hours_end }),
      ...(preferences.business_days && preferences.business_days.length > 0 && { business_days: preferences.business_days }),
      ...(preferences.personal_time_weekday_evening !== undefined && { personal_time_weekday_evening: preferences.personal_time_weekday_evening }),
      ...(preferences.personal_time_weekends !== undefined && { personal_time_weekends: preferences.personal_time_weekends }),
      ...(preferences.personal_time_early_morning !== undefined && { personal_time_early_morning: preferences.personal_time_early_morning }),
      ...(preferences.allow_business_in_personal_time !== undefined && { allow_business_in_personal_time: preferences.allow_business_in_personal_time }),
      ...(preferences.allow_personal_in_business_time !== undefined && { allow_personal_in_business_time: preferences.allow_personal_in_business_time }),
      ...(preferences.context_switch_buffer_minutes !== undefined && { context_switch_buffer_minutes: preferences.context_switch_buffer_minutes }),
      ...(preferences.claude_api_key && { claude_api_key: preferences.claude_api_key }),
      ...(preferences.openai_api_key && { openai_api_key: preferences.openai_api_key }),
      ...(preferences.focus_blocks && preferences.focus_blocks.length > 0 && { focus_blocks: preferences.focus_blocks }),
      ...(preferences.preferred_time_slots && preferences.preferred_time_slots.length > 0 && { preferred_time_slots: preferences.preferred_time_slots }),
      ...(preferences.business_relevance_default !== undefined && { business_relevance_default: preferences.business_relevance_default })
    };
    
    const { data, error } = await supabase
      .from('user_preferences')
      .insert([cleanPreferences])
      .select()
      .single();
    
    if (error) handleError('creating user preferences', error);
    return data;
  },

  async update(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get current user from custom auth
    const user = getCustomAuthUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) handleError('updating user preferences', error);
    return data;
  },

  async upsert(preferences: Omit<UserPreferences, 'id' | 'user_id'>): Promise<UserPreferences> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Get current user from custom auth
    const user = getCustomAuthUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Construct clean preferences object
    const cleanPreferences = {
      id: IdGenerator.generatePreferencesId(), // Generate proper UUID
      user_id: user.id,
      working_hours_start: preferences.working_hours_start || "09:00",
      working_hours_end: preferences.working_hours_end || "17:00",
      focus_block_duration: preferences.focus_block_duration ?? 90,
      break_duration: preferences.break_duration ?? 15,
      priority_weight_deadline: preferences.priority_weight_deadline ?? 0.4,
      priority_weight_effort: preferences.priority_weight_effort ?? 0.3,
      priority_weight_deps: preferences.priority_weight_deps ?? 0.3,
      ai_provider: preferences.ai_provider || 'gemini',
      selected_gemini_model: preferences.selected_gemini_model || 'gemini-1.5-flash',
      ...(preferences.instructions && { instructions: preferences.instructions }),
      ...(preferences.business_hours_start && { business_hours_start: preferences.business_hours_start }),
      ...(preferences.business_hours_end && { business_hours_end: preferences.business_hours_end }),
      ...(preferences.business_days && preferences.business_days.length > 0 && { business_days: preferences.business_days }),
      ...(preferences.personal_time_weekday_evening !== undefined && { personal_time_weekday_evening: preferences.personal_time_weekday_evening }),
      ...(preferences.personal_time_weekends !== undefined && { personal_time_weekends: preferences.personal_time_weekends }),
      ...(preferences.personal_time_early_morning !== undefined && { personal_time_early_morning: preferences.personal_time_early_morning }),
      ...(preferences.allow_business_in_personal_time !== undefined && { allow_business_in_personal_time: preferences.allow_business_in_personal_time }),
      ...(preferences.allow_personal_in_business_time !== undefined && { allow_personal_in_business_time: preferences.allow_personal_in_business_time }),
      ...(preferences.context_switch_buffer_minutes !== undefined && { context_switch_buffer_minutes: preferences.context_switch_buffer_minutes }),
      ...(preferences.claude_api_key && { claude_api_key: preferences.claude_api_key }),
      ...(preferences.openai_api_key && { openai_api_key: preferences.openai_api_key }),
      ...(preferences.focus_blocks && preferences.focus_blocks.length > 0 && { focus_blocks: preferences.focus_blocks }),
      ...(preferences.preferred_time_slots && preferences.preferred_time_slots.length > 0 && { preferred_time_slots: preferences.preferred_time_slots }),
      ...(preferences.business_relevance_default !== undefined && { business_relevance_default: preferences.business_relevance_default })
    };
    
    // Use upsert to handle both create and update cases
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(cleanPreferences, {
        onConflict: 'user_id'
      })
      .select()
      .single();
    
    if (error) handleError('upserting user preferences', error);
    return data;
  }
};

// Tags Service
export const tagsService = {
  async getAll(): Promise<Tag[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('usage_count', { ascending: false });
    
    if (error) handleError('fetching tags', error);
    return data || [];
  },

  async create(tag: Omit<Tag, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Tag> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tags')
      .insert([tag])
      .select()
      .single();
    
    if (error) handleError('creating tag', error);
    return data;
  },

  async update(id: string, updates: Partial<Tag>): Promise<Tag> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleError('updating tag', error);
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);
    
    if (error) handleError('deleting tag', error);
  },

  async getByCategory(categoryId: string): Promise<Tag[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('category_id', categoryId)
      .order('usage_count', { ascending: false });
    
    if (error) handleError('fetching tags by category', error);
    return data || [];
  },

  // ========== ADVANCED TAG ANALYTICS ==========

  /**
   * Get comprehensive tag usage analytics across all entities
   */
  async getTagAnalytics(): Promise<{
    totalTags: number;
    tagUsageStats: Array<{
      tag: Tag;
      totalUsage: number;
      projectUsage: number;
      taskUsage: number;
      documentUsage: number;
      scheduleUsage: number;
      trendDirection: 'up' | 'down' | 'stable';
    }>;
    categoryStats: Array<{
      category: TagCategory;
      tagCount: number;
      totalUsage: number;
    }>;
    orphanedTags: Tag[];
    suggestedCleanup: string[];
  }> {
    if (!supabase) throw new Error('Supabase client not initialized');

    // Get all tags with categories
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select(`
        *,
        tag_categories (*)
      `);

    if (tagsError) handleError('fetching tags for analytics', tagsError);

    // Get all entities to analyze tag usage
    const [projects, tasks] = await Promise.all([
      projectsService.getAll(),
      tasksService.getAll()
      // Note: We'll need to implement document and schedule services for complete analytics
      // For now, using zero counts as placeholders for document and schedule usage
    ]);

    const allTags = tags || [];
    const tagUsageStats = allTags.map(tag => {
      const projectUsage = projects.filter(p => p.tags.includes(tag.name)).length;
      const taskUsage = tasks.filter(t => t.tags.includes(tag.name)).length;
      const documentUsage = 0; // documents.filter(d => d.tags.includes(tag.name)).length;
      const scheduleUsage = 0; // schedules.filter(s => s.tags.includes(tag.name)).length;
      const totalUsage = projectUsage + taskUsage + documentUsage + scheduleUsage;

      // Simple trend calculation (could be enhanced with historical data)
      const trendDirection: 'up' | 'down' | 'stable' = 
        totalUsage > (tag.usage_count || 0) ? 'up' : 
        totalUsage < (tag.usage_count || 0) ? 'down' : 'stable';

      return {
        tag,
        totalUsage,
        projectUsage,
        taskUsage,
        documentUsage,
        scheduleUsage,
        trendDirection
      };
    });

    // Get category statistics
    const { data: categories, error: categoriesError } = await supabase
      .from('tag_categories')
      .select('*');

    if (categoriesError) handleError('fetching categories for analytics', categoriesError);

    const categoryStats = (categories || []).map(category => {
      const categoryTags = allTags.filter(tag => tag.category_id === category.id);
      const totalUsage = categoryTags.reduce((sum, tag) => {
        const usage = tagUsageStats.find(stat => stat.tag.id === tag.id)?.totalUsage || 0;
        return sum + usage;
      }, 0);

      return {
        category,
        tagCount: categoryTags.length,
        totalUsage
      };
    });

    // Find orphaned tags (tags with 0 usage)
    const orphanedTags = tagUsageStats
      .filter(stat => stat.totalUsage === 0)
      .map(stat => stat.tag);

    // Generate cleanup suggestions
    const suggestedCleanup: string[] = [];
    if (orphanedTags.length > 0) {
      suggestedCleanup.push(`Consider removing ${orphanedTags.length} unused tags`);
    }
    
    const duplicateNames = allTags
      .map(tag => tag.name.toLowerCase())
      .filter((name, index, arr) => arr.indexOf(name) !== index);
    
    if (duplicateNames.length > 0) {
      suggestedCleanup.push(`Merge ${duplicateNames.length} tags with similar names`);
    }

    return {
      totalTags: allTags.length,
      tagUsageStats,
      categoryStats,
      orphanedTags,
      suggestedCleanup
    };
  },

  /**
   * Search tags by name with fuzzy matching
   */
  async searchTags(query: string): Promise<Tag[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('usage_count', { ascending: false })
      .limit(20);
    
    if (error) handleError('searching tags', error);
    return data || [];
  },

  /**
   * Get tag suggestions based on existing tag patterns
   */
  async getTagSuggestions(_entityType: 'project' | 'task' | 'document' | 'schedule', _entityData: any): Promise<Tag[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Simple suggestion algorithm based on most used tags
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(10);
    
    if (error) handleError('getting tag suggestions', error);
    
    // Could enhance this with ML-based suggestions using entityData
    return data || [];
  },

  /**
   * Update tag usage counts based on actual entity usage
   */
  async updateUsageCounts(): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const analytics = await this.getTagAnalytics();
    
    // Update each tag's usage count
    for (const stat of analytics.tagUsageStats) {
      await this.update(stat.tag.id, { usage_count: stat.totalUsage });
    }
  },

  /**
   * Get related tags based on co-occurrence patterns
   */
  async getRelatedTags(tagId: string): Promise<Array<{ tag: Tag; cooccurrenceScore: number }>> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const tag = await this.getById(tagId);
    if (!tag) return [];

    // Get all entities that use this tag
    const [projects, tasks] = await Promise.all([
      projectsService.getAll(),
      tasksService.getAll()
    ]);

    const entitiesWithTag = [
      ...projects.filter(p => p.tags.includes(tag.name)),
      ...tasks.filter(t => t.tags.includes(tag.name))
    ];

    // Count co-occurrences with other tags
    const cooccurrenceMap = new Map<string, number>();
    
    entitiesWithTag.forEach(entity => {
      entity.tags.forEach(otherTagName => {
        if (otherTagName !== tag.name) {
          cooccurrenceMap.set(otherTagName, (cooccurrenceMap.get(otherTagName) || 0) + 1);
        }
      });
    });

    // Get tag objects for the related tags
    const allTags = await this.getAll();
    const relatedTags = Array.from(cooccurrenceMap.entries())
      .map(([tagName, count]) => {
        const relatedTag = allTags.find(t => t.name === tagName);
        return relatedTag ? {
          tag: relatedTag,
          cooccurrenceScore: count / entitiesWithTag.length // Normalize by total occurrences
        } : null;
      })
      .filter((item): item is { tag: Tag; cooccurrenceScore: number } => item !== null)
      .sort((a, b) => b.cooccurrenceScore - a.cooccurrenceScore)
      .slice(0, 10); // Top 10 related tags

    return relatedTags;
  },

  /**
   * Get a tag by ID
   */
  async getById(id: string): Promise<Tag | null> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      handleError('fetching tag by id', error);
    }
    return data;
  }
};

// Tag Categories Service  
export const tagCategoriesService = {
  async getAll(): Promise<TagCategory[]> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tag_categories')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) handleError('fetching tag categories', error);
    return data || [];
  },

  async create(category: Omit<TagCategory, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<TagCategory> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tag_categories')
      .insert([category])
      .select()
      .single();
    
    if (error) handleError('creating tag category', error);
    return data;
  },

  async update(id: string, updates: Partial<TagCategory>): Promise<TagCategory> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tag_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) handleError('updating tag category', error);
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase
      .from('tag_categories')
      .delete()
      .eq('id', id);
    
    if (error) handleError('deleting tag category', error);
  },

  // ========== ADVANCED CATEGORY FEATURES ==========

  /**
   * Get category with associated tags
   */
  async getCategoryWithTags(id: string): Promise<(TagCategory & { tags: Tag[] }) | null> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tag_categories')
      .select(`
        *,
        tags (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      handleError('fetching category with tags', error);
    }
    return data;
  },

  /**
   * Get all categories with tag counts
   */
  async getAllWithTagCounts(): Promise<Array<TagCategory & { tagCount: number; totalUsage: number }>> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tag_categories')
      .select(`
        *,
        tags (*)
      `);
    
    if (error) handleError('fetching categories with tag counts', error);
    
    return (data || []).map(category => ({
      ...category,
      tagCount: category.tags?.length || 0,
      totalUsage: category.tags?.reduce((sum: number, tag: any) => sum + (tag.usage_count || 0), 0) || 0
    }));
  },

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<TagCategory | null> {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase
      .from('tag_categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      handleError('fetching tag category by id', error);
    }
    return data;
  }
};

// ========== TAG-BASED FILTERING SERVICE ==========
export const tagFilteringService = {
  /**
   * Get all entities (projects, tasks, etc.) that contain specific tags
   */
  async getEntitiesByTags(
    tagNames: string[], 
    options: {
      entityTypes?: ('projects' | 'tasks' | 'documents' | 'schedules')[];
      matchType?: 'any' | 'all'; // 'any' = OR logic, 'all' = AND logic
    } = {}
  ): Promise<{
    projects: Project[];
    tasks: Task[];
    documents: any[];
    schedules: any[];
    totalMatches: number;
  }> {
    const { entityTypes = ['projects', 'tasks'], matchType = 'any' } = options;
    
    const results = {
      projects: [] as Project[],
      tasks: [] as Task[],
      documents: [] as any[],
      schedules: [] as any[],
      totalMatches: 0
    };

    // Filter projects by tags
    if (entityTypes.includes('projects')) {
      const projects = await projectsService.getAll();
      results.projects = projects.filter(project => 
        matchType === 'any' 
          ? tagNames.some(tag => project.tags.includes(tag))
          : tagNames.every(tag => project.tags.includes(tag))
      );
    }

    // Filter tasks by tags
    if (entityTypes.includes('tasks')) {
      const tasks = await tasksService.getAll();
      results.tasks = tasks.filter(task => 
        matchType === 'any' 
          ? tagNames.some(tag => task.tags.includes(tag))
          : tagNames.every(tag => task.tags.includes(tag))
      );
    }

    // TODO: Add documents and schedules when their services are implemented
    
    results.totalMatches = results.projects.length + results.tasks.length + 
                          results.documents.length + results.schedules.length;

    return results;
  },

  /**
   * Get tag-based entity recommendations (entities that share similar tags)
   */
  async getRelatedEntities(
    baseEntityId: string, 
    baseEntityType: 'project' | 'task',
    limit: number = 10
  ): Promise<{
    projects: Array<Project & { similarity: number }>;
    tasks: Array<Task & { similarity: number }>;
  }> {
    // Get the base entity's tags
    let baseTags: string[] = [];
    
    if (baseEntityType === 'project') {
      const project = await projectsService.getById(baseEntityId);
      baseTags = project?.tags || [];
    } else if (baseEntityType === 'task') {
      const task = await tasksService.getById(baseEntityId);
      baseTags = task?.tags || [];
    }

    if (baseTags.length === 0) {
      return { projects: [], tasks: [] };
    }

    // Get all entities and calculate similarity scores
    const [allProjects, allTasks] = await Promise.all([
      projectsService.getAll(),
      tasksService.getAll()
    ]);

    // Calculate Jaccard similarity (intersection / union)
    const calculateSimilarity = (entityTags: string[]): number => {
      const intersection = baseTags.filter(tag => entityTags.includes(tag)).length;
      const union = new Set([...baseTags, ...entityTags]).size;
      return union === 0 ? 0 : intersection / union;
    };

    // Filter out the base entity and calculate similarities
    const relatedProjects = allProjects
      .filter(project => project.id !== (baseEntityType === 'project' ? baseEntityId : ''))
      .map(project => ({
        ...project,
        similarity: calculateSimilarity(project.tags)
      }))
      .filter(project => project.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    const relatedTasks = allTasks
      .filter(task => task.id !== (baseEntityType === 'task' ? baseEntityId : ''))
      .map(task => ({
        ...task,
        similarity: calculateSimilarity(task.tags)
      }))
      .filter(task => task.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return {
      projects: relatedProjects,
      tasks: relatedTasks
    };
  },

  /**
   * Get comprehensive tag-based search across all entities
   */
  async searchByTags(
    query: string,
    options: {
      exactMatch?: boolean;
      limit?: number;
      entityTypes?: ('projects' | 'tasks' | 'documents' | 'schedules')[];
    } = {}
  ): Promise<{
    matchingTags: Tag[];
    projects: Project[];
    tasks: Task[];
    totalResults: number;
  }> {
    const { exactMatch = false, limit = 50, entityTypes = ['projects', 'tasks'] } = options;
    
    // Find matching tags
    const matchingTags = exactMatch 
      ? await tagsService.searchTags(query)
      : await tagsService.searchTags(query);

    const matchingTagNames = matchingTags.map(tag => tag.name);

    // Get entities that use these tags
    const entities = await this.getEntitiesByTags(matchingTagNames, {
      entityTypes,
      matchType: 'any'
    });

    return {
      matchingTags,
      projects: entities.projects.slice(0, limit),
      tasks: entities.tasks.slice(0, limit),
      totalResults: entities.totalMatches
    };
  }
};

// Optimized Real-time subscriptions
import { realtimeManager } from '../src/utils/realtimeOptimized';

export const subscriptions = {
  /**
   * Subscribe to project changes with optimized performance
   */
  async subscribeToProjects(callback: (payload: any) => void) {
    return realtimeManager.subscribe(
      'projects_subscription',
      {
        table: 'projects',
        event: '*',
        throttleMs: 1000, // Throttle updates to once per second
        batchUpdates: true // Batch multiple updates together
      },
      callback
    );
  },

  /**
   * Subscribe to task changes with optimized performance
   */
  async subscribeToTasks(callback: (payload: any) => void) {
    return realtimeManager.subscribe(
      'tasks_subscription',
      {
        table: 'tasks',
        event: '*',
        throttleMs: 500, // More frequent updates for tasks
        batchUpdates: true
      },
      callback
    );
  },

  /**
   * Subscribe to schedule changes
   */
  async subscribeToSchedules(callback: (payload: any) => void) {
    return realtimeManager.subscribe(
      'schedules_subscription',
      {
        table: 'schedules',
        event: '*',
        throttleMs: 2000, // Less frequent for schedules
        batchUpdates: false
      },
      callback
    );
  },

  /**
   * Subscribe to specific project tasks
   */
  async subscribeToProjectTasks(projectId: string, callback: (payload: any) => void) {
    return realtimeManager.subscribe(
      `project_tasks_${projectId}`,
      {
        table: 'tasks',
        event: '*',
        filter: `project_id=eq.${projectId}`,
        throttleMs: 500,
        batchUpdates: true
      },
      callback
    );
  },

  /**
   * Unsubscribe from specific subscription
   */
  unsubscribe(subscriptionId: string) {
    realtimeManager.unsubscribe(subscriptionId);
  },

  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll() {
    realtimeManager.unsubscribeAll();
  },

  /**
   * Get real-time connection statistics
   */
  getStats() {
    return realtimeManager.getStats();
  }
};

// Authentication helpers
export const authService = {
  async getCurrentUser() {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        // Handle JWT-specific errors
        if (error.message.includes('JWT') || error.message.includes('invalid')) {
          console.warn('JWT error detected, clearing auth state:', error.message);
          // Clear potentially corrupted auth state
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
          return null;
        }
        handleError('getting current user', error);
      }
      return user;
    } catch (error: any) {
      if (error.message.includes('JWT') || error.message.includes('invalid')) {
        console.warn('JWT error in getCurrentUser, clearing auth state');
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        return null;
      }
      throw error;
    }
  },

  async signUp(email: string, password: string) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) handleError('signing up', error);
    return data;
  },

  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) handleError('signing in', error);
    return data;
  },

  async signOut() {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase.auth.signOut();
    if (error) handleError('signing out', error);
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    return supabase.auth.onAuthStateChange(callback);
  }
};

export { DatabaseServiceError }; 