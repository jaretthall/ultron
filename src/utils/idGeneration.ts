import { v4 as uuidv4 } from 'uuid';

/**
 * Centralized ID generation utility for Ultron application
 * Ensures consistent UUID format across all database entities
 * 
 * Addresses Phase 1 Supabase improvement plan:
 * - Standardized ID generation
 * - UUID format validation
 * - Compatibility with both UUID and TEXT column types
 */
export class IdGenerator {
  /**
   * Generate a proper UUID v4 string
   * Always returns a valid UUID format that works with both UUID and TEXT columns
   */
  static generateId(): string {
    return uuidv4();
  }

  /**
   * Generate a user ID for custom auth
   * Uses consistent format with other entities
   */
  static generateUserId(): string {
    return `user_${uuidv4()}`;
  }

  /**
   * Generate prefixed IDs for better debugging
   */
  static generatePrefixedId(prefix: string): string {
    return `${prefix}_${uuidv4()}`;
  }

  /**
   * Validate ID format
   * Accepts both standard UUIDs and prefixed UUIDs
   */
  static isValidId(id: string): boolean {
    // Standard UUID v4 format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // Prefixed UUID format (e.g., user_uuid, project_uuid)
    const prefixedUuidRegex = /^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    return uuidRegex.test(id) || prefixedUuidRegex.test(id);
  }

  /**
   * Validate that an ID is a proper UUID format (no prefix)
   * Useful for database foreign key validation
   */
  static isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Extract UUID from prefixed ID
   * Returns the UUID portion from IDs like "user_uuid" or "project_uuid"
   */
  static extractUUID(prefixedId: string): string | null {
    const parts = prefixedId.split('_');
    if (parts.length >= 2) {
      const potentialUuid = parts.slice(1).join('_'); // Handle multiple underscores
      return this.isValidUUID(potentialUuid) ? potentialUuid : null;
    }
    return this.isValidUUID(prefixedId) ? prefixedId : null;
  }

  /**
   * Generate entity-specific IDs for better debugging and organization
   */
  static generateProjectId(): string {
    return this.generateId(); // Standard UUID for projects
  }

  static generateTaskId(): string {
    return this.generateId(); // Standard UUID for tasks
  }

  static generateScheduleId(): string {
    return this.generateId(); // Standard UUID for schedules
  }

  static generateNoteId(): string {
    return this.generateId(); // Standard UUID for notes
  }

  static generateDocumentId(): string {
    return this.generateId(); // Standard UUID for documents
  }

  static generateTagId(): string {
    return this.generateId(); // Standard UUID for tags
  }

  static generateCategoryId(): string {
    return this.generateId(); // Standard UUID for categories
  }

  static generatePreferencesId(): string {
    return this.generateId(); // Standard UUID for user preferences
  }

  /**
   * Validation helper for entity creation
   */
  static validateEntityId(id: string, entityType: string): { isValid: boolean; error?: string } {
    if (!id) {
      return { isValid: false, error: `${entityType} ID is required` };
    }

    if (!this.isValidId(id)) {
      return { 
        isValid: false, 
        error: `${entityType} ID must be in valid UUID format: ${id}` 
      };
    }

    return { isValid: true };
  }

  /**
   * Generate a short, human-readable ID for debugging
   * Not cryptographically secure - only for debugging purposes
   */
  static generateDebugId(prefix: string = 'debug'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Check if two IDs reference the same entity
   * Handles both prefixed and non-prefixed UUIDs
   */
  static idsMatch(id1: string, id2: string): boolean {
    const uuid1 = this.extractUUID(id1) || id1;
    const uuid2 = this.extractUUID(id2) || id2;
    return uuid1 === uuid2;
  }
}

/**
 * Legacy support function for existing codebase
 * Gradually replace manual UUID generation with IdGenerator.generateId()
 */
export const generateUUID = (): string => {
  console.warn('generateUUID() is deprecated. Use IdGenerator.generateId() instead.');
  return IdGenerator.generateId();
};

/**
 * Validation function for database operations
 */
export const validateUUID = (id: string): boolean => {
  return IdGenerator.isValidId(id);
};

export default IdGenerator;