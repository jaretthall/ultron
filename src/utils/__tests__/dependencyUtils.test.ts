import {
  buildDependencyGraph,
  getBlockedTasksFromGraph,
  getAvailableTasksFromGraph,
  detectCircularDependencies,
  calculateCriticalPath,
  getSuggestedTaskOrder,
  getTaskDependencyStats,
  validateDependencies
} from '../dependencyUtils';
import { Task, TaskStatus, TaskPriority } from '../../../types';

// Mock tasks for testing
const createMockTask = (
  id: string,
  title: string,
  status: TaskStatus = TaskStatus.TODO,
  priority: TaskPriority = TaskPriority.MEDIUM,
  dependencies: string[] = [],
  due_date?: string
): Task => ({
  id,
  title,
  description: `Description for ${title}`,
  status,
  priority,
  dependencies,
  due_date,
  estimated_hours: 2,
  tags: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

describe('Dependency Utils', () => {
  describe('buildDependencyGraph', () => {
    it('should build a basic dependency graph', () => {
      const tasks = [
        createMockTask('task1', 'Task 1'),
        createMockTask('task2', 'Task 2', TaskStatus.TODO, TaskPriority.HIGH, ['task1']),
        createMockTask('task3', 'Task 3', TaskStatus.COMPLETED)
      ];

      const graph = buildDependencyGraph(tasks);

      expect(graph.nodes.size).toBe(3);
      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0]).toEqual({ from: 'task1', to: 'task2' });
    });

    it('should correctly identify blocked and available tasks', () => {
      const tasks = [
        createMockTask('task1', 'Task 1', TaskStatus.TODO),
        createMockTask('task2', 'Task 2', TaskStatus.TODO, TaskPriority.HIGH, ['task1']),
        createMockTask('task3', 'Task 3', TaskStatus.COMPLETED),
        createMockTask('task4', 'Task 4', TaskStatus.TODO, TaskPriority.HIGH, ['task3'])
      ];

      const graph = buildDependencyGraph(tasks);
      
      const task1Node = graph.nodes.get('task1');
      const task2Node = graph.nodes.get('task2');
      const task3Node = graph.nodes.get('task3');
      const task4Node = graph.nodes.get('task4');

      expect(task1Node?.isAvailable).toBe(true);
      expect(task1Node?.isBlocked).toBe(false);
      
      expect(task2Node?.isAvailable).toBe(false);
      expect(task2Node?.isBlocked).toBe(true);
      
      expect(task3Node?.isAvailable).toBe(false); // Completed tasks are not "available"
      expect(task3Node?.isBlocked).toBe(false);
      
      expect(task4Node?.isAvailable).toBe(true); // Dependency is completed
      expect(task4Node?.isBlocked).toBe(false);
    });

    it('should build dependents correctly', () => {
      const tasks = [
        createMockTask('task1', 'Task 1'),
        createMockTask('task2', 'Task 2', TaskStatus.TODO, TaskPriority.HIGH, ['task1']),
        createMockTask('task3', 'Task 3', TaskStatus.TODO, TaskPriority.HIGH, ['task1'])
      ];

      const graph = buildDependencyGraph(tasks);
      const task1Node = graph.nodes.get('task1');

      expect(task1Node?.dependents).toHaveLength(2);
      expect(task1Node?.dependents.map(t => t.id)).toContain('task2');
      expect(task1Node?.dependents.map(t => t.id)).toContain('task3');
    });
  });

  describe('getBlockedTasksFromGraph', () => {
    it('should return only blocked tasks', () => {
      const tasks = [
        createMockTask('task1', 'Task 1', TaskStatus.TODO),
        createMockTask('task2', 'Task 2', TaskStatus.TODO, TaskPriority.HIGH, ['task1']),
        createMockTask('task3', 'Task 3', TaskStatus.COMPLETED),
        createMockTask('task4', 'Task 4', TaskStatus.TODO, TaskPriority.HIGH, ['task3'])
      ];

      const graph = buildDependencyGraph(tasks);
      const blockedTasks = getBlockedTasksFromGraph(graph);

      expect(blockedTasks).toHaveLength(1);
      expect(blockedTasks[0].id).toBe('task2');
    });
  });

  describe('getAvailableTasksFromGraph', () => {
    it('should return only available tasks', () => {
      const tasks = [
        createMockTask('task1', 'Task 1', TaskStatus.TODO),
        createMockTask('task2', 'Task 2', TaskStatus.TODO, TaskPriority.HIGH, ['task1']),
        createMockTask('task3', 'Task 3', TaskStatus.COMPLETED),
        createMockTask('task4', 'Task 4', TaskStatus.TODO, TaskPriority.HIGH, ['task3'])
      ];

      const graph = buildDependencyGraph(tasks);
      const availableTasks = getAvailableTasksFromGraph(graph);

      expect(availableTasks).toHaveLength(2);
      expect(availableTasks.map(t => t.id)).toContain('task1');
      expect(availableTasks.map(t => t.id)).toContain('task4');
    });
  });

  describe('detectCircularDependencies', () => {
    it('should detect simple circular dependency', () => {
      const tasks = [
        createMockTask('task1', 'Task 1', TaskStatus.TODO, TaskPriority.MEDIUM, ['task2']),
        createMockTask('task2', 'Task 2', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1'])
      ];

      const cycles = detectCircularDependencies(tasks);
      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toContain('task1');
      expect(cycles[0]).toContain('task2');
    });

    it('should detect complex circular dependency', () => {
      const tasks = [
        createMockTask('task1', 'Task 1', TaskStatus.TODO, TaskPriority.MEDIUM, ['task3']),
        createMockTask('task2', 'Task 2', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1']),
        createMockTask('task3', 'Task 3', TaskStatus.TODO, TaskPriority.MEDIUM, ['task2'])
      ];

      const cycles = detectCircularDependencies(tasks);
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should return empty array for acyclic graph', () => {
      const tasks = [
        createMockTask('task1', 'Task 1'),
        createMockTask('task2', 'Task 2', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1']),
        createMockTask('task3', 'Task 3', TaskStatus.TODO, TaskPriority.MEDIUM, ['task2'])
      ];

      const cycles = detectCircularDependencies(tasks);
      expect(cycles).toHaveLength(0);
    });
  });

  describe('calculateCriticalPath', () => {
    it('should find the longest dependency chain', () => {
      const tasks = [
        createMockTask('task1', 'Task 1'),
        createMockTask('task2', 'Task 2', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1']),
        createMockTask('task3', 'Task 3', TaskStatus.TODO, TaskPriority.MEDIUM, ['task2']),
        createMockTask('task4', 'Task 4', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1'])
      ];

      const criticalPath = calculateCriticalPath(tasks);
      
      // Should find the longest path: task1 -> task2 -> task3
      expect(criticalPath).toHaveLength(3);
      expect(criticalPath.map(t => t.id)).toEqual(['task1', 'task2', 'task3']);
    });

    it('should handle tasks with no dependencies', () => {
      const tasks = [
        createMockTask('task1', 'Task 1'),
        createMockTask('task2', 'Task 2'),
        createMockTask('task3', 'Task 3')
      ];

      const criticalPath = calculateCriticalPath(tasks);
      expect(criticalPath).toHaveLength(1);
    });
  });

  describe('getSuggestedTaskOrder', () => {
    it('should prioritize available tasks by composite score', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tasks = [
        createMockTask('task1', 'Low Priority Task', TaskStatus.TODO, TaskPriority.LOW),
        createMockTask('task2', 'Urgent Task', TaskStatus.TODO, TaskPriority.URGENT, [], tomorrow.toISOString()),
        createMockTask('task3', 'Blocked Task', TaskStatus.TODO, TaskPriority.HIGH, ['task1']),
        createMockTask('task4', 'High Priority Available', TaskStatus.TODO, TaskPriority.HIGH)
      ];

      const suggestedOrder = getSuggestedTaskOrder(tasks);
      
      // Should prioritize available tasks, with urgent and high priority first
      expect(suggestedOrder).toHaveLength(3); // task3 is blocked, so not included
      expect(suggestedOrder[0].id).toBe('task2'); // Urgent with due date
      expect(suggestedOrder[1].id).toBe('task4'); // High priority
      expect(suggestedOrder[2].id).toBe('task1'); // Low priority
    });

    it('should consider dependency impact in scoring', () => {
      const tasks = [
        createMockTask('task1', 'Blocking Task', TaskStatus.TODO, TaskPriority.LOW),
        createMockTask('task2', 'Dependent Task 1', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1']),
        createMockTask('task3', 'Dependent Task 2', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1']),
        createMockTask('task4', 'Independent High Priority', TaskStatus.TODO, TaskPriority.HIGH)
      ];

      const suggestedOrder = getSuggestedTaskOrder(tasks);
      
      // task4 should be first due to HIGH priority (75 points) vs task1 (25 + 20 = 45 points)
      expect(suggestedOrder[0].id).toBe('task4');
      // task1 should be second due to dependency impact boosting its score
      expect(suggestedOrder[1].id).toBe('task1');
    });
  });

  describe('getTaskDependencyStats', () => {
    it('should calculate correct dependency statistics', () => {
      const tasks = [
        createMockTask('task1', 'Root Task'),
        createMockTask('task2', 'Level 1', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1']),
        createMockTask('task3', 'Level 2', TaskStatus.TODO, TaskPriority.MEDIUM, ['task2']),
        createMockTask('task4', 'Another Level 1', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1'])
      ];

      const stats = getTaskDependencyStats('task1', tasks);
      
      expect(stats.directDependencies).toBe(0);
      expect(stats.totalDependencies).toBe(0);
      expect(stats.directDependents).toBe(2); // task2 and task4
      expect(stats.totalDependents).toBe(3); // task2, task3, task4
      expect(stats.isBlocked).toBe(false);
    });

    it('should identify blocking tasks correctly', () => {
      const tasks = [
        createMockTask('task1', 'Incomplete Dependency', TaskStatus.TODO),
        createMockTask('task2', 'Completed Dependency', TaskStatus.COMPLETED),
        createMockTask('task3', 'Blocked Task', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1', 'task2'])
      ];

      const stats = getTaskDependencyStats('task3', tasks);
      
      expect(stats.directDependencies).toBe(2);
      expect(stats.isBlocked).toBe(true);
      expect(stats.blockingTasks).toHaveLength(1);
      expect(stats.blockingTasks[0].id).toBe('task1');
    });
  });

  describe('validateDependencies', () => {
    it('should detect missing dependency references', () => {
      const tasks = [
        createMockTask('task1', 'Task 1', TaskStatus.TODO, TaskPriority.MEDIUM, ['nonexistent'])
      ];

      const validation = validateDependencies(tasks);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toContain('non-existent dependency');
    });

    it('should detect self-dependencies', () => {
      const tasks = [
        createMockTask('task1', 'Task 1', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1'])
      ];

      const validation = validateDependencies(tasks);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(2); // Both circular dependency and self-dependency errors
      expect(validation.errors.some(error => error.includes('depends on itself'))).toBe(true);
    });

    it('should detect circular dependencies', () => {
      const tasks = [
        createMockTask('task1', 'Task 1', TaskStatus.TODO, TaskPriority.MEDIUM, ['task2']),
        createMockTask('task2', 'Task 2', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1'])
      ];

      const validation = validateDependencies(tasks);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Circular dependency'))).toBe(true);
    });

    it('should warn about tasks with many dependencies', () => {
      const dependencies = Array.from({ length: 12 }, (_, i) => `dep${i}`);
      const tasks = [
        createMockTask('task1', 'Task with many deps', TaskStatus.TODO, TaskPriority.MEDIUM, dependencies),
        ...dependencies.map(id => createMockTask(id, `Dependency ${id}`))
      ];

      const validation = validateDependencies(tasks);
      
      expect(validation.warnings.some(warning => warning.includes('many dependencies'))).toBe(true);
    });

    it('should warn about high percentage of blocked tasks', () => {
      const tasks = [
        createMockTask('task1', 'Available Task'),
        createMockTask('task2', 'Blocked Task 1', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1']),
        createMockTask('task3', 'Blocked Task 2', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1']),
        createMockTask('task4', 'Blocked Task 3', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1'])
      ];

      const validation = validateDependencies(tasks);
      
      expect(validation.warnings.some(warning => warning.includes('High percentage of tasks are blocked'))).toBe(true);
    });

    it('should pass validation for valid dependency structure', () => {
      const tasks = [
        createMockTask('task1', 'Task 1'),
        createMockTask('task2', 'Task 2', TaskStatus.TODO, TaskPriority.MEDIUM, ['task1']),
        createMockTask('task3', 'Task 3', TaskStatus.COMPLETED)
      ];

      const validation = validateDependencies(tasks);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
}); 