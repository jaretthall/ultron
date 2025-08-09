import { getCustomAuthUser } from '../src/contexts/CustomAuthContext';
import {
  Project, Task, UserPreferences, Tag, TagCategory
} from '../types';

// LocalStorage-based database service for custom authentication bypass
class CustomDatabaseService {
  private getStorageKey(table: string, userId: string): string {
    return `ultron_${table}_${userId}`;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private async getCurrentUser() {
    const user = await getCustomAuthUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user;
  }

  private async getFromStorage<T>(table: string): Promise<T[]> {
    try {
      const user = await this.getCurrentUser();
      const key = this.getStorageKey(table, user.id);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${table} from storage:`, error);
      return [];
    }
  }

  private async saveToStorage<T>(table: string, data: T[]): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      const key = this.getStorageKey(table, user.id);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${table} to storage:`, error);
      throw error;
    }
  }

  // Projects Service
  async getAllProjects(): Promise<Project[]> {
    return await this.getFromStorage<Project>('projects');
  }

  async getProjectById(id: string): Promise<Project | null> {
    const projects = await this.getFromStorage<Project>('projects');
    return projects.find(p => p.id === id) || null;
  }

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Project> {
    const user = await this.getCurrentUser();
    const projects = await this.getFromStorage<Project>('projects');
    
    const newProject: Project = {
      ...project,
      id: this.generateUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      goals: project.goals || [],
      tags: project.tags || [],
      preferred_time_slots: project.preferred_time_slots || []
    };

    projects.push(newProject);
    await this.saveToStorage('projects', projects);
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const projects = await this.getFromStorage<Project>('projects');
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Project not found');
    }

    const updatedProject: Project = {
      ...projects[index],
      ...updates,
      id, // Ensure ID doesn't change
      updated_at: new Date().toISOString()
    };

    projects[index] = updatedProject;
    await this.saveToStorage('projects', projects);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    const projects = await this.getFromStorage<Project>('projects');
    const filteredProjects = projects.filter(p => p.id !== id);
    
    if (filteredProjects.length === projects.length) {
      return false; // No project was deleted
    }

    // Also delete associated tasks
    const tasks = await this.getFromStorage<Task>('tasks');
    const filteredTasks = tasks.filter(t => t.project_id !== id);
    await this.saveToStorage('tasks', filteredTasks);

    await this.saveToStorage('projects', filteredProjects);
    return true;
  }

  // Tasks Service
  async getAllTasks(): Promise<Task[]> {
    return await this.getFromStorage<Task>('tasks');
  }

  async getTaskById(id: string): Promise<Task | null> {
    const tasks = await this.getFromStorage<Task>('tasks');
    return tasks.find(t => t.id === id) || null;
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    const tasks = await this.getFromStorage<Task>('tasks');
    return tasks.filter(t => t.project_id === projectId);
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Task> {
    const user = await this.getCurrentUser();
    const tasks = await this.getFromStorage<Task>('tasks');
    
    const newTask: Task = {
      ...task,
      id: this.generateUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: task.tags || [],
      dependencies: task.dependencies || []
    };

    tasks.push(newTask);
    await this.saveToStorage('tasks', tasks);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const tasks = await this.getFromStorage<Task>('tasks');
    const index = tasks.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Task not found');
    }

    const updatedTask: Task = {
      ...tasks[index],
      ...updates,
      id, // Ensure ID doesn't change
      updated_at: new Date().toISOString()
    };

    tasks[index] = updatedTask;
    await this.saveToStorage('tasks', tasks);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const tasks = await this.getFromStorage<Task>('tasks');
    const filteredTasks = tasks.filter(t => t.id !== id);
    
    if (filteredTasks.length === tasks.length) {
      return false; // No task was deleted
    }

    await this.saveToStorage('tasks', filteredTasks);
    return true;
  }

  // User Preferences Service
  async getUserPreferences(): Promise<UserPreferences | null> {
    const preferences = await this.getFromStorage<UserPreferences>('user_preferences');
    return preferences[0] || null;
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const user = await this.getCurrentUser();
    const existingPrefs = await this.getFromStorage<UserPreferences>('user_preferences');
    
    const defaultPrefs: UserPreferences = {
      id: this.generateUUID(),
      user_id: user.id,
      working_hours_start: '09:00',
      working_hours_end: '17:00',
      focus_block_duration: 90,
      break_duration: 15,
      priority_weight_deadline: 0.4,
      priority_weight_effort: 0.3,
      priority_weight_deps: 0.3,
      ai_provider: 'gemini',
      selected_gemini_model: 'gemini-pro',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedPrefs: UserPreferences = {
      ...(existingPrefs[0] || defaultPrefs),
      ...preferences,
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    await this.saveToStorage('user_preferences', [updatedPrefs]);
    return updatedPrefs;
  }

  // Tags Service
  async getAllTags(): Promise<Tag[]> {
    return await this.getFromStorage<Tag>('tags');
  }

  async createTag(tag: Omit<Tag, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Tag> {
    const user = await this.getCurrentUser();
    const tags = await this.getFromStorage<Tag>('tags');
    
    const newTag: Tag = {
      ...tag,
      id: this.generateUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    tags.push(newTag);
    await this.saveToStorage('tags', tags);
    return newTag;
  }

  async updateTag(id: string, updates: Partial<Tag>): Promise<Tag> {
    const tags = await this.getFromStorage<Tag>('tags');
    const index = tags.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Tag not found');
    }

    const updatedTag: Tag = {
      ...tags[index],
      ...updates,
      id,
      updated_at: new Date().toISOString()
    };

    tags[index] = updatedTag;
    await this.saveToStorage('tags', tags);
    return updatedTag;
  }

  async deleteTag(id: string): Promise<boolean> {
    const tags = await this.getFromStorage<Tag>('tags');
    const filteredTags = tags.filter(t => t.id !== id);
    
    if (filteredTags.length === tags.length) {
      return false;
    }

    await this.saveToStorage('tags', filteredTags);
    return true;
  }

  // Tag Categories Service
  async getAllTagCategories(): Promise<TagCategory[]> {
    return await this.getFromStorage<TagCategory>('tag_categories');
  }

  async createTagCategory(category: Omit<TagCategory, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<TagCategory> {
    const user = await this.getCurrentUser();
    const categories = await this.getFromStorage<TagCategory>('tag_categories');
    
    const newCategory: TagCategory = {
      ...category,
      id: this.generateUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    categories.push(newCategory);
    await this.saveToStorage('tag_categories', categories);
    return newCategory;
  }

  // Clear all data for current user (useful for testing)
  async clearAllUserData(): Promise<void> {
    const user = await this.getCurrentUser();
    const tables = ['projects', 'tasks', 'user_preferences', 'tags', 'tag_categories'];
    
    tables.forEach(table => {
      const key = this.getStorageKey(table, user.id);
      localStorage.removeItem(key);
    });
  }
}

export const customDatabaseService = new CustomDatabaseService();