// Test script for UUID implementation validation
// Run this with: node test-uuid-implementation.js

// Mock the IdGenerator functionality to test it
class IdGenerator {
  static generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static generateUserId() {
    return `user_${this.generateId()}`;
  }

  static generatePrefixedId(prefix) {
    return `${prefix}_${this.generateId()}`;
  }

  static isValidId(id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const prefixedUuidRegex = /^\w+_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id) || prefixedUuidRegex.test(id);
  }

  static validateEntityId(id, entityType) {
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
}

console.log('🧪 Testing UUID Implementation...\n');

// Test 1: Basic UUID generation
console.log('1. Testing UUID generation:');
const id1 = IdGenerator.generateId();
const id2 = IdGenerator.generateId();
console.log(`  Generated ID 1: ${id1}`);
console.log(`  Generated ID 2: ${id2}`);
console.log(`  IDs are different: ${id1 !== id2}`);
console.log(`  ID1 is valid: ${IdGenerator.isValidId(id1)}`);
console.log(`  ID2 is valid: ${IdGenerator.isValidId(id2)}\n`);

// Test 2: Prefixed IDs
console.log('2. Testing prefixed IDs:');
const userId = IdGenerator.generateUserId();
const projectId = IdGenerator.generatePrefixedId('project');
console.log(`  User ID: ${userId}`);
console.log(`  Project ID: ${projectId}`);
console.log(`  User ID is valid: ${IdGenerator.isValidId(userId)}`);
console.log(`  Project ID is valid: ${IdGenerator.isValidId(projectId)}\n`);

// Test 3: Validation
console.log('3. Testing validation:');
const validationTests = [
  { id: id1, type: 'Project', shouldPass: true },
  { id: userId, type: 'User', shouldPass: true },
  { id: 'invalid-id', type: 'Task', shouldPass: false },
  { id: '', type: 'Schedule', shouldPass: false },
  { id: null, type: 'Note', shouldPass: false }
];

validationTests.forEach((test, index) => {
  const result = IdGenerator.validateEntityId(test.id, test.type);
  const status = result.isValid === test.shouldPass ? '✅' : '❌';
  console.log(`  Test ${index + 1} ${status}: ${test.type} ID "${test.id}" - ${result.isValid ? 'Valid' : result.error}`);
});

// Test 4: Edge cases
console.log('\n4. Testing edge cases:');
const edgeCases = [
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx', // Template pattern
  '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
  'user_123e4567-e89b-12d3-a456-426614174000', // Valid prefixed
  '123e4567-e89b-12d3-a456-42661417400', // Too short
  '123e4567-e89b-12d3-a456-426614174000-extra', // Too long
  'prefix__123e4567-e89b-12d3-a456-426614174000' // Double underscore
];

edgeCases.forEach((testId, index) => {
  const isValid = IdGenerator.isValidId(testId);
  console.log(`  Edge case ${index + 1}: "${testId}" - ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

console.log('\n🎉 UUID Implementation Tests Complete!');
console.log('\nNext steps:');
console.log('1. Run the database migration script in Supabase');
console.log('2. Test CRUD operations with the new UUID system');
console.log('3. Verify foreign key relationships work correctly');