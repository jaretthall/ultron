/**
 * User-Friendly Error Messages and UI Feedback System
 * Phase 2 Implementation - Contextual, actionable error messages for users
 */

import { EnhancedError, ErrorType } from './errorHandling';

export interface UserMessage {
  title: string;
  message: string;
  action?: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  dismissible: boolean;
  duration?: number; // Auto-dismiss after milliseconds
}

export class UserMessageGenerator {
  /**
   * Generate user-friendly message from enhanced error
   */
  static fromError(error: EnhancedError, context?: string): UserMessage {
    const baseMessage = this.getContextualMessage(error, context);
    
    return {
      title: this.getErrorTitle(error.type),
      message: baseMessage.message,
      action: baseMessage.action,
      severity: this.getSeverityFromError(error),
      dismissible: true,
      duration: this.getDurationFromSeverity(error.severity)
    };
  }
  
  /**
   * Generate success message for completed operations
   */
  static success(
    title: string, 
    message: string, 
    action?: string,
    duration: number = 3000
  ): UserMessage {
    return {
      title,
      message,
      action,
      severity: 'success',
      dismissible: true,
      duration
    };
  }
  
  /**
   * Generate info message for user guidance
   */
  static info(
    title: string, 
    message: string, 
    action?: string,
    dismissible: boolean = true
  ): UserMessage {
    return {
      title,
      message,
      action,
      severity: 'info',
      dismissible
    };
  }
  
  /**
   * Generate warning message for attention items
   */
  static warning(
    title: string, 
    message: string, 
    action?: string
  ): UserMessage {
    return {
      title,
      message,
      action,
      severity: 'warning',
      dismissible: true,
      duration: 5000
    };
  }
  
  private static getErrorTitle(errorType: ErrorType): string {
    switch (errorType) {
      case ErrorType.NETWORK:
      case ErrorType.CONNECTION:
        return 'Connection Problem';
        
      case ErrorType.AUTHENTICATION:
        return 'Sign In Required';
        
      case ErrorType.AUTHORIZATION:
        return 'Access Denied';
        
      case ErrorType.VALIDATION:
        return 'Invalid Input';
        
      case ErrorType.CONSTRAINT:
        return 'Cannot Complete Action';
        
      case ErrorType.NOT_FOUND:
        return 'Not Found';
        
      case ErrorType.RATE_LIMIT:
        return 'Slow Down';
        
      case ErrorType.TIMEOUT:
        return 'Operation Timed Out';
        
      case ErrorType.SERVER:
        return 'Server Error';
        
      default:
        return 'Something Went Wrong';
    }
  }
  
  private static getContextualMessage(
    error: EnhancedError, 
    context?: string
  ): { message: string; action?: string } {
    const contextMessages = this.getContextSpecificMessages(error.type, context);
    
    if (contextMessages) {
      return contextMessages;
    }
    
    // Fallback to generic messages
    return this.getGenericMessage(error);
  }
  
  private static getContextSpecificMessages(
    errorType: ErrorType, 
    context?: string
  ): { message: string; action?: string } | null {
    if (!context) return null;
    
    const contextKey = context.toLowerCase();
    
    // Project-related operations
    if (contextKey.includes('project')) {
      switch (errorType) {
        case ErrorType.CONSTRAINT:
          return {
            message: 'This project cannot be deleted because it has associated tasks or schedules.',
            action: 'Remove all tasks and schedules first, then try again.'
          };
        case ErrorType.VALIDATION:
          return {
            message: 'Please check the project details and ensure all required fields are filled correctly.',
            action: 'Review the project title and other required information.'
          };
        case ErrorType.NOT_FOUND:
          return {
            message: 'The project you\'re looking for no longer exists.',
            action: 'Return to the projects list to see available projects.'
          };
      }
    }
    
    // Task-related operations
    if (contextKey.includes('task')) {
      switch (errorType) {
        case ErrorType.CONSTRAINT:
          return {
            message: 'This task has dependencies that prevent this action.',
            action: 'Check task dependencies and try again.'
          };
        case ErrorType.VALIDATION:
          return {
            message: 'Please check the task details for any missing or invalid information.',
            action: 'Ensure the task title is provided and all dates are valid.'
          };
        case ErrorType.NOT_FOUND:
          return {
            message: 'The task you\'re trying to access no longer exists.',
            action: 'Return to the task list to see current tasks.'
          };
      }
    }
    
    // Authentication operations
    if (contextKey.includes('auth') || contextKey.includes('sign') || contextKey.includes('login')) {
      switch (errorType) {
        case ErrorType.AUTHENTICATION:
          return {
            message: 'Your email or password is incorrect.',
            action: 'Please check your credentials and try again.'
          };
        case ErrorType.RATE_LIMIT:
          return {
            message: 'Too many sign-in attempts. Please wait before trying again.',
            action: 'Wait a few minutes, then try signing in again.'
          };
        case ErrorType.NETWORK:
          return {
            message: 'Cannot connect to sign-in service.',
            action: 'Check your internet connection and try again.'
          };
      }
    }
    
    // Settings operations
    if (contextKey.includes('setting') || contextKey.includes('preference')) {
      switch (errorType) {
        case ErrorType.VALIDATION:
          return {
            message: 'Some settings values are not valid.',
            action: 'Please review your settings and correct any highlighted fields.'
          };
        case ErrorType.NETWORK:
          return {
            message: 'Cannot save settings right now.',
            action: 'Your changes are saved locally. Try again when your connection improves.'
          };
      }
    }
    
    return null;
  }
  
  private static getGenericMessage(error: EnhancedError): { message: string; action?: string } {
    switch (error.type) {
      case ErrorType.NETWORK:
        return {
          message: 'Having trouble connecting. Your work is saved locally.',
          action: 'Check your internet connection and try again.'
        };
        
      case ErrorType.AUTHENTICATION:
        return {
          message: 'Your session has expired for security.',
          action: 'Please sign in again to continue.'
        };
        
      case ErrorType.AUTHORIZATION:
        return {
          message: 'You don\'t have permission to perform this action.',
          action: 'Contact your administrator if you need access.'
        };
        
      case ErrorType.VALIDATION:
        return {
          message: 'Some information is missing or incorrect.',
          action: 'Please check your input and try again.'
        };
        
      case ErrorType.CONSTRAINT:
        return {
          message: 'This action cannot be completed due to existing connections.',
          action: 'Remove related items first, then try again.'
        };
        
      case ErrorType.NOT_FOUND:
        return {
          message: 'The item you\'re looking for no longer exists.',
          action: 'It may have been moved or deleted. Please refresh and try again.'
        };
        
      case ErrorType.RATE_LIMIT:
        return {
          message: 'You\'re doing that too quickly.',
          action: 'Please wait a moment and try again.'
        };
        
      case ErrorType.TIMEOUT:
        return {
          message: 'The operation is taking longer than expected.',
          action: 'Please try again. If the problem persists, try refreshing the page.'
        };
        
      case ErrorType.SERVER:
        return {
          message: 'Our servers are having a temporary issue.',
          action: 'Please try again in a few moments.'
        };
        
      default:
        return {
          message: error.userMessage || 'Something unexpected happened.',
          action: 'Please try again. If the problem persists, refresh the page.'
        };
    }
  }
  
  private static getSeverityFromError(error: EnhancedError): 'info' | 'warning' | 'error' {
    switch (error.severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  }
  
  private static getDurationFromSeverity(severity: string): number | undefined {
    switch (severity) {
      case 'critical':
      case 'high':
        return undefined; // No auto-dismiss for serious errors
      case 'medium':
        return 8000; // 8 seconds
      default:
        return 5000; // 5 seconds
    }
  }
}

/**
 * Pre-defined success messages for common operations
 */
export class SuccessMessages {
  static projectCreated(projectName: string): UserMessage {
    return UserMessageGenerator.success(
      'Project Created',
      `"${projectName}" has been created successfully.`,
      'Start adding tasks to get organized!'
    );
  }
  
  static projectUpdated(projectName: string): UserMessage {
    return UserMessageGenerator.success(
      'Project Updated',
      `"${projectName}" has been updated.`
    );
  }
  
  static projectDeleted(): UserMessage {
    return UserMessageGenerator.success(
      'Project Deleted',
      'The project and all its tasks have been removed.'
    );
  }
  
  static taskCreated(taskName: string): UserMessage {
    return UserMessageGenerator.success(
      'Task Created',
      `"${taskName}" has been added to your task list.`
    );
  }
  
  static taskCompleted(taskName: string): UserMessage {
    return UserMessageGenerator.success(
      'Task Completed',
      `Great job! "${taskName}" is now complete.`,
      'Keep up the productive work!'
    );
  }
  
  static taskDeleted(): UserMessage {
    return UserMessageGenerator.success(
      'Task Deleted',
      'The task has been removed from your list.'
    );
  }
  
  static settingsSaved(): UserMessage {
    return UserMessageGenerator.success(
      'Settings Saved',
      'Your preferences have been updated.',
      undefined,
      2000
    );
  }
  
  static dataExported(): UserMessage {
    return UserMessageGenerator.success(
      'Export Complete',
      'Your data has been exported successfully.',
      'The file has been downloaded to your device.'
    );
  }
  
  static dataImported(itemCount: number): UserMessage {
    return UserMessageGenerator.success(
      'Import Complete',
      `Successfully imported ${itemCount} items.`,
      'Your data is now available in the application.'
    );
  }
}

/**
 * Pre-defined info messages for user guidance
 */
export class InfoMessages {
  static welcomeNewUser(): UserMessage {
    return UserMessageGenerator.info(
      'Welcome to Ultron!',
      'Start by creating your first project to organize your tasks.',
      'Click the "New Project" button to get started.'
    );
  }
  
  static offlineMode(): UserMessage {
    return UserMessageGenerator.info(
      'Working Offline',
      'You\'re currently offline. Your changes are being saved locally.',
      'Changes will sync when your connection is restored.',
      false
    );
  }
  
  static backOnline(): UserMessage {
    return UserMessageGenerator.success(
      'Back Online',
      'Connection restored. Syncing your changes now.',
      undefined,
      2000
    );
  }
  
  static dataSync(): UserMessage {
    return UserMessageGenerator.info(
      'Syncing Data',
      'Your latest changes are being synchronized.',
      undefined,
      false
    );
  }
}

/**
 * Operation-specific warning messages
 */
export class WarningMessages {
  static unsavedChanges(): UserMessage {
    return UserMessageGenerator.warning(
      'Unsaved Changes',
      'You have unsaved changes that will be lost.',
      'Save your work before leaving this page.'
    );
  }
  
  static deleteConfirmation(itemName: string, itemType: string): UserMessage {
    return UserMessageGenerator.warning(
      'Confirm Deletion',
      `Are you sure you want to delete "${itemName}"?`,
      `This ${itemType} and all related data will be permanently removed.`
    );
  }
  
  static dependencyWarning(dependentItems: string[]): UserMessage {
    return UserMessageGenerator.warning(
      'Dependencies Exist',
      `This item is connected to: ${dependentItems.join(', ')}`,
      'Deleting it will affect these related items.'
    );
  }
  
  static storageSpace(): UserMessage {
    return UserMessageGenerator.warning(
      'Storage Almost Full',
      'Your local storage is nearly full.',
      'Consider cleaning up old data or exporting to free up space.'
    );
  }
}