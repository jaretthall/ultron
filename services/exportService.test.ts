
import { calculateCompletionPercentage } from './exportService'; // Assuming this is the correct path and it's exported
import { Task, TaskStatus, TaskPriority } from '../types';

// Mock Task type definition locally if not easily importable or to keep test self-contained
const mockTask = (id: string, projectId: string, status: TaskStatus): Task => ({
  id,
  project_id: projectId,
  title: `Task ${id}`,
  description: 'A test task',
  priority: TaskPriority.MEDIUM,
  estimated_hours: 1,
  status,
  dependencies: [],
  tags: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe('exportService utilities', () => {
  describe('calculateCompletionPercentage', () => {
    const projectId1 = 'proj1';
    const projectId2 = 'proj2';

    it('should return 0 if there are no tasks for the project', () => {
      const tasks: Task[] = [
        mockTask('t1', projectId2, TaskStatus.COMPLETED),
      ];
      expect(calculateCompletionPercentage(projectId1, tasks)).toBe(0);
    });

    it('should return 0 if there are tasks but none are completed', () => {
      const tasks: Task[] = [
        mockTask('t1', projectId1, TaskStatus.TODO),
        mockTask('t2', projectId1, TaskStatus.IN_PROGRESS),
      ];
      expect(calculateCompletionPercentage(projectId1, tasks)).toBe(0);
    });

    it('should return 100 if all tasks for the project are completed', () => {
      const tasks: Task[] = [
        mockTask('t1', projectId1, TaskStatus.COMPLETED),
        mockTask('t2', projectId1, TaskStatus.COMPLETED),
        mockTask('t3', projectId2, TaskStatus.TODO), // Task for another project
      ];
      expect(calculateCompletionPercentage(projectId1, tasks)).toBe(100);
    });

    it('should return the correct percentage for partially completed tasks', () => {
      const tasks: Task[] = [
        mockTask('t1', projectId1, TaskStatus.COMPLETED),
        mockTask('t2', projectId1, TaskStatus.TODO),
        mockTask('t3', projectId1, TaskStatus.COMPLETED),
        mockTask('t4', projectId1, TaskStatus.IN_PROGRESS),
      ];
      // 2 out of 4 tasks are completed
      expect(calculateCompletionPercentage(projectId1, tasks)).toBe(50);
    });

    it('should round the percentage to the nearest whole number', () => {
      const tasks: Task[] = [
        mockTask('t1', projectId1, TaskStatus.COMPLETED),
        mockTask('t2', projectId1, TaskStatus.TODO),
        mockTask('t3', projectId1, TaskStatus.TODO),
      ];
      // 1 out of 3 tasks is completed (33.33...%)
      expect(calculateCompletionPercentage(projectId1, tasks)).toBe(33);
    });

    it('should handle an empty task list gracefully', () => {
      expect(calculateCompletionPercentage(projectId1, [])).toBe(0);
    });
  });

  // Add more tests for other utility functions from exportService here
  // e.g., enrichProjects, groupTasksByPriority, etc.
  // For brevity, only calculateCompletionPercentage is fully tested here.
});