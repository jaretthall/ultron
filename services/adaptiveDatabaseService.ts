import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { customDatabaseService } from './customDatabaseService';
import { 
  projectsService as supabaseProjectsService, 
  tasksService as supabaseTasksService,
  userPreferencesService as supabaseUserPreferencesService,
  tagsService as supabaseTagsService,
  tagCategoriesService as supabaseTagCategoriesService
} from './databaseService';
import {
  Project, Task, UserPreferences, Tag, TagCategory
} from '../types';

// Adaptive database service that uses Supabase when available, localStorage when not
class AdaptiveDatabaseService {
  private useSupabase(): boolean {
    return isSupabaseConfigured() && supabase !== null;
  }

  private logFallback(operation: string) {
    console.log(`🔄 Using localStorage fallback for ${operation} (Supabase not available)`);
  }

  // Projects Service
  async getAllProjects(): Promise<Project[]> {
    if (this.useSupabase()) {
      try {
        return await supabaseProjectsService.getAll();
      } catch (error) {
        console.error('Supabase projects fetch failed, falling back to localStorage:', error);
        this.logFallback('getAllProjects');
        return await customDatabaseService.getAllProjects();
      }
    } else {
      this.logFallback('getAllProjects');
      return await customDatabaseService.getAllProjects();
    }
  }

  async getProjectById(id: string): Promise<Project | null> {
    if (this.useSupabase()) {
      try {
        return await supabaseProjectsService.getById(id);
      } catch (error) {
        console.error('Supabase project fetch failed, falling back to localStorage:', error);
        this.logFallback('getProjectById');
        return await customDatabaseService.getProjectById(id);
      }
    } else {
      this.logFallback('getProjectById');
      return await customDatabaseService.getProjectById(id);
    }
  }

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Project> {
    if (this.useSupabase()) {
      try {
        return await supabaseProjectsService.create(project);
      } catch (error) {
        console.error('Supabase project creation failed, falling back to localStorage:', error);
        this.logFallback('createProject');
        return await customDatabaseService.createProject(project);
      }
    } else {
      this.logFallback('createProject');
      return await customDatabaseService.createProject(project);
    }
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    if (this.useSupabase()) {
      try {
        return await supabaseProjectsService.update(id, updates);
      } catch (error) {
        console.error('Supabase project update failed, falling back to localStorage:', error);
        this.logFallback('updateProject');
        return await customDatabaseService.updateProject(id, updates);
      }
    } else {
      this.logFallback('updateProject');
      return await customDatabaseService.updateProject(id, updates);
    }
  }

  async deleteProject(id: string): Promise<boolean> {
    if (this.useSupabase()) {
      try {
        await supabaseProjectsService.delete(id);
        return true;
      } catch (error) {
        console.error('Supabase project deletion failed, falling back to localStorage:', error);
        this.logFallback('deleteProject');
        return await customDatabaseService.deleteProject(id);
      }
    } else {
      this.logFallback('deleteProject');
      return await customDatabaseService.deleteProject(id);
    }
  }

  // Tasks Service
  async getAllTasks(): Promise<Task[]> {
    if (this.useSupabase()) {
      try {
        return await supabaseTasksService.getAll();
      } catch (error) {
        console.error('Supabase tasks fetch failed, falling back to localStorage:', error);
        this.logFallback('getAllTasks');
        return await customDatabaseService.getAllTasks();
      }
    } else {
      this.logFallback('getAllTasks');
      return await customDatabaseService.getAllTasks();
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
    if (this.useSupabase()) {
      try {
        return await supabaseTasksService.getById(id);
      } catch (error) {
        console.error('Supabase task fetch failed, falling back to localStorage:', error);
        this.logFallback('getTaskById');
        return await customDatabaseService.getTaskById(id);
      }
    } else {
      this.logFallback('getTaskById');
      return await customDatabaseService.getTaskById(id);
    }
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    if (this.useSupabase()) {
      try {
        return await supabaseTasksService.getByProject(projectId);
      } catch (error) {
        console.error('Supabase tasks fetch failed, falling back to localStorage:', error);
        this.logFallback('getTasksByProject');
        return await customDatabaseService.getTasksByProject(projectId);
      }
    } else {
      this.logFallback('getTasksByProject');
      return await customDatabaseService.getTasksByProject(projectId);
    }
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Task> {
    if (this.useSupabase()) {
      try {
        return await supabaseTasksService.create(task);
      } catch (error) {
        console.error('Supabase task creation failed, falling back to localStorage:', error);
        this.logFallback('createTask');
        return await customDatabaseService.createTask(task);
      }
    } else {
      this.logFallback('createTask');
      return await customDatabaseService.createTask(task);
    }
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (this.useSupabase()) {
      try {
        return await supabaseTasksService.update(id, updates);
      } catch (error) {
        console.error('Supabase task update failed, falling back to localStorage:', error);
        this.logFallback('updateTask');
        return await customDatabaseService.updateTask(id, updates);
      }
    } else {
      this.logFallback('updateTask');
      return await customDatabaseService.updateTask(id, updates);
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    if (this.useSupabase()) {
      try {
        await supabaseTasksService.delete(id);
        return true;
      } catch (error) {
        console.error('Supabase task deletion failed, falling back to localStorage:', error);
        this.logFallback('deleteTask');
        return await customDatabaseService.deleteTask(id);
      }
    } else {
      this.logFallback('deleteTask');
      return await customDatabaseService.deleteTask(id);
    }
  }

  // User Preferences Service
  async getUserPreferences(): Promise<UserPreferences | null> {
    if (this.useSupabase()) {
      try {
        return await supabaseUserPreferencesService.get();
      } catch (error) {
        console.error('Supabase preferences fetch failed, falling back to localStorage:', error);
        this.logFallback('getUserPreferences');
        return await customDatabaseService.getUserPreferences();
      }
    } else {
      this.logFallback('getUserPreferences');
      return await customDatabaseService.getUserPreferences();
    }
  }

  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    if (this.useSupabase()) {
      try {
        // Try to get existing preferences first
        const existing = await supabaseUserPreferencesService.get();
        if (existing) {
          return await supabaseUserPreferencesService.update(preferences);
        } else {
          // Create if doesn't exist
          const { id, user_id, ...prefsWithoutIds } = preferences as UserPreferences;
          return await supabaseUserPreferencesService.create(prefsWithoutIds);
        }
      } catch (error) {
        console.error('Supabase preferences update failed, falling back to localStorage:', error);
        this.logFallback('updateUserPreferences');
        return await customDatabaseService.updateUserPreferences(preferences);
      }
    } else {
      this.logFallback('updateUserPreferences');
      return await customDatabaseService.updateUserPreferences(preferences);
    }
  }

  // Tags Service
  async getAllTags(): Promise<Tag[]> {
    if (this.useSupabase()) {
      try {
        return await supabaseTagsService.getAll();
      } catch (error) {
        console.error('Supabase tags fetch failed, falling back to localStorage:', error);
        this.logFallback('getAllTags');
        return await customDatabaseService.getAllTags();
      }
    } else {
      this.logFallback('getAllTags');
      return await customDatabaseService.getAllTags();
    }
  }

  async createTag(tag: Omit<Tag, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Tag> {
    if (this.useSupabase()) {
      try {
        return await supabaseTagsService.create(tag);
      } catch (error) {
        console.error('Supabase tag creation failed, falling back to localStorage:', error);
        this.logFallback('createTag');
        return await customDatabaseService.createTag(tag);
      }
    } else {
      this.logFallback('createTag');
      return await customDatabaseService.createTag(tag);
    }
  }

  async updateTag(id: string, updates: Partial<Tag>): Promise<Tag> {
    if (this.useSupabase()) {
      try {
        return await supabaseTagsService.update(id, updates);
      } catch (error) {
        console.error('Supabase tag update failed, falling back to localStorage:', error);
        this.logFallback('updateTag');
        return await customDatabaseService.updateTag(id, updates);
      }
    } else {
      this.logFallback('updateTag');
      return await customDatabaseService.updateTag(id, updates);
    }
  }

  async deleteTag(id: string): Promise<boolean> {
    if (this.useSupabase()) {
      try {
        await supabaseTagsService.delete(id);
        return true;
      } catch (error) {
        console.error('Supabase tag deletion failed, falling back to localStorage:', error);
        this.logFallback('deleteTag');
        return await customDatabaseService.deleteTag(id);
      }
    } else {
      this.logFallback('deleteTag');
      return await customDatabaseService.deleteTag(id);
    }
  }

  // Tag Categories Service
  async getAllTagCategories(): Promise<TagCategory[]> {
    if (this.useSupabase()) {
      try {
        return await supabaseTagCategoriesService.getAll();
      } catch (error) {
        console.error('Supabase tag categories fetch failed, falling back to localStorage:', error);
        this.logFallback('getAllTagCategories');
        return await customDatabaseService.getAllTagCategories();
      }
    } else {
      this.logFallback('getAllTagCategories');
      return await customDatabaseService.getAllTagCategories();
    }
  }

  async createTagCategory(category: Omit<TagCategory, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<TagCategory> {
    if (this.useSupabase()) {
      try {
        return await supabaseTagCategoriesService.create(category);
      } catch (error) {
        console.error('Supabase tag category creation failed, falling back to localStorage:', error);
        this.logFallback('createTagCategory');
        return await customDatabaseService.createTagCategory(category);
      }
    } else {
      this.logFallback('createTagCategory');
      return await customDatabaseService.createTagCategory(category);
    }
  }

  // Utility functions
  async clearAllUserData(): Promise<void> {
    console.log('🧹 Clearing all user data from localStorage');
    return await customDatabaseService.clearAllUserData();
  }

  getDatabaseInfo(): { using: 'supabase' | 'localStorage'; configured: boolean } {
    const supabaseConfigured = isSupabaseConfigured();
    const using = this.useSupabase() ? 'supabase' : 'localStorage';
    
    return {
      using,
      configured: supabaseConfigured
    };
  }
}

export const adaptiveDatabaseService = new AdaptiveDatabaseService();