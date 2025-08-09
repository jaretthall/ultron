import { IdGenerator } from '../idGeneration';

describe('IdGenerator', () => {
  describe('generateProjectId', () => {
    it('should generate a valid UUID for project ID', () => {
      const id = IdGenerator.generateProjectId();
      // Standard UUID v4 format
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(id.length).toBe(36);
    });

    it('should generate unique project IDs', () => {
      const id1 = IdGenerator.generateProjectId();
      const id2 = IdGenerator.generateProjectId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateTaskId', () => {
    it('should generate a valid UUID for task ID', () => {
      const id = IdGenerator.generateTaskId();
      // Standard UUID v4 format
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(id.length).toBe(36);
    });

    it('should generate unique task IDs', () => {
      const id1 = IdGenerator.generateTaskId();
      const id2 = IdGenerator.generateTaskId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('isValidId', () => {
    it('should validate standard UUIDs', () => {
      const validUuid = IdGenerator.generateId();
      expect(IdGenerator.isValidId(validUuid)).toBe(true);
    });

    it('should validate prefixed UUIDs', () => {
      const prefixedId = IdGenerator.generatePrefixedId('test');
      expect(IdGenerator.isValidId(prefixedId)).toBe(true);
    });

    it('should reject invalid IDs', () => {
      expect(IdGenerator.isValidId('invalid-id')).toBe(false);
      expect(IdGenerator.isValidId('')).toBe(false);
    });
  });
});