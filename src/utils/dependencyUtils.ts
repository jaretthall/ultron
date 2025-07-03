import { Task, TaskStatus, TaskPriority } from '../../types';

// ========== DEPENDENCY GRAPH UTILITIES ==========

export interface TaskNode {
  id: string;
  title: string;
  status: TaskStatus;
  dependencies: string[];
  dependents: Task[];
  isBlocked: boolean;
  isAvailable: boolean;
}

export interface DependencyGraph {
  nodes: Map<string, TaskNode>;
  edges: Array<{ from: string; to: string }>;
}

/**
 * Build a comprehensive dependency graph from tasks
 */
export function buildDependencyGraph(allTasks: Task[]): DependencyGraph {
  const nodes = new Map<string, TaskNode>();
  const edges: Array<{ from: string; to: string }> = [];

  // Initialize nodes
  allTasks.forEach(task => {
    nodes.set(task.id, {
      id: task.id,
      title: task.title,
      status: task.status,
      dependencies: task.dependencies,
      dependents: [],
      isBlocked: false,
      isAvailable: true
    });
  });

  // Build edges and dependents
  allTasks.forEach(task => {
    task.dependencies.forEach((depId: string) => {
      edges.push({ from: depId, to: task.id });
      
      // Add to dependents
      const depNode = nodes.get(depId);
      if (depNode) {
        const fullTask = allTasks.find(t => t.id === task.id);
        if (fullTask) {
          depNode.dependents.push(fullTask);
        }
      }
    });
  });

  // Calculate blocked and available status
  nodes.forEach(node => {
    if (node.status !== TaskStatus.COMPLETED) {
      // Check if blocked by incomplete dependencies
      const hasIncompleteDeps = node.dependencies.some(depId => {
        const depNode = nodes.get(depId);
        return depNode && depNode.status !== TaskStatus.COMPLETED;
      });
      
      node.isBlocked = hasIncompleteDeps;
      node.isAvailable = !hasIncompleteDeps;
    } else {
      node.isBlocked = false;
      node.isAvailable = false; // Completed tasks are not "available" for work
    }
  });

  return { nodes, edges };
}

/**
 * Get all blocked tasks from a dependency graph
 */
export function getBlockedTasksFromGraph(graph: DependencyGraph): TaskNode[] {
  return Array.from(graph.nodes.values()).filter(node => node.isBlocked);
}

/**
 * Get all available tasks from a dependency graph
 */
export function getAvailableTasksFromGraph(graph: DependencyGraph): TaskNode[] {
  return Array.from(graph.nodes.values()).filter(node => node.isAvailable);
}

/**
 * Detect circular dependencies in the dependency graph
 */
export function detectCircularDependencies(allTasks: Task[]): string[][] {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];

  const dfs = (taskId: string, path: string[]): void => {
    if (recursionStack.has(taskId)) {
      // Found a cycle
      const cycleStart = path.indexOf(taskId);
      if (cycleStart !== -1) {
        cycles.push([...path.slice(cycleStart), taskId]);
      }
      return;
    }

    if (visited.has(taskId)) return;

    visited.add(taskId);
    recursionStack.add(taskId);

    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      task.dependencies.forEach((depId: string) => {
        dfs(depId, [...path, taskId]);
      });
    }

    recursionStack.delete(taskId);
  };

  allTasks.forEach(task => {
    if (!visited.has(task.id)) {
      dfs(task.id, []);
    }
  });

  return cycles;
}

/**
 * Calculate the critical path in a project (longest dependency chain)
 */
export function calculateCriticalPath(allTasks: Task[]): Task[] {
  const graph = buildDependencyGraph(allTasks);
  const taskMap = new Map(allTasks.map(t => [t.id, t]));
  
  // Find the longest path using DFS
  const visited = new Set<string>();
  let longestPath: Task[] = [];

  const dfs = (taskId: string, currentPath: Task[]): Task[] => {
    if (visited.has(taskId)) return currentPath;
    
    const task = taskMap.get(taskId);
    if (!task) return currentPath;

    visited.add(taskId);
    const newPath = [...currentPath, task];
    
    const node = graph.nodes.get(taskId);
    if (!node || node.dependents.length === 0) {
      return newPath;
    }

    let maxPath = newPath;
    node.dependents.forEach(dependent => {
      const path = dfs(dependent.id, newPath);
      if (path.length > maxPath.length) {
        maxPath = path;
      }
    });

    return maxPath;
  };

  // Start from tasks with no dependencies
  graph.nodes.forEach((node, taskId) => {
    if (node.dependencies.length === 0 && !visited.has(taskId)) {
      const path = dfs(taskId, []);
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    }
  });

  return longestPath;
}

/**
 * Get suggested task order based on dependencies and priorities
 */
export function getSuggestedTaskOrder(allTasks: Task[]): Task[] {
  const graph = buildDependencyGraph(allTasks);
  const availableTasks = getAvailableTasksFromGraph(graph);
  
  // Sort available tasks by a composite score
  const scoredTasks = availableTasks.map(node => {
    const task = allTasks.find(t => t.id === node.id)!;
    let score = 0;
    
    // Priority score
    const priorityScores: Record<TaskPriority, number> = { 
      urgent: 100, high: 75, medium: 50, low: 25 
    };
    score += priorityScores[task.priority];
    
    // Dependency impact (how many tasks this unblocks)
    score += node.dependents.length * 10;
    
    // Due date urgency
    if (task.due_date) {
      const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 0) score += 50;
      else if (daysUntilDue <= 3) score += 30;
      else if (daysUntilDue <= 7) score += 15;
    }
    
    return { task, score };
  });
  
  return scoredTasks
    .sort((a, b) => b.score - a.score)
    .map(item => item.task);
}

/**
 * Calculate dependency statistics for a task
 */
export function getTaskDependencyStats(taskId: string, allTasks: Task[]): {
  directDependencies: number;
  totalDependencies: number;
  directDependents: number;
  totalDependents: number;
  isBlocked: boolean;
  blockingTasks: Task[];
} {
  const graph = buildDependencyGraph(allTasks);
  const node = graph.nodes.get(taskId);
  
  if (!node) {
    return {
      directDependencies: 0,
      totalDependencies: 0,
      directDependents: 0,
      totalDependents: 0,
      isBlocked: false,
      blockingTasks: []
    };
  }

  // Calculate total dependencies (recursive)
  const getAllDependencies = (id: string, visited = new Set<string>()): Set<string> => {
    if (visited.has(id)) return new Set();
    visited.add(id);
    
    const nodeRef = graph.nodes.get(id);
    if (!nodeRef) return new Set();
    
    const deps = new Set<string>(nodeRef.dependencies);
    nodeRef.dependencies.forEach(depId => {
      const subDeps = getAllDependencies(depId, visited);
      subDeps.forEach(subDepId => deps.add(subDepId));
    });
    
    return deps;
  };

  // Calculate total dependents (recursive)
  const getAllDependents = (id: string, visited = new Set<string>()): Set<string> => {
    if (visited.has(id)) return new Set();
    visited.add(id);
    
    const nodeRef = graph.nodes.get(id);
    if (!nodeRef) return new Set();
    
    const deps = new Set<string>(nodeRef.dependents.map(t => t.id));
    nodeRef.dependents.forEach(dep => {
      const subDeps = getAllDependents(dep.id, visited);
      subDeps.forEach(subDepId => deps.add(subDepId));
    });
    
    return deps;
  };

  const totalDeps = getAllDependencies(taskId);
  const totalDependents = getAllDependents(taskId);
  
  const blockingTasks = node.dependencies
    .map(depId => allTasks.find(t => t.id === depId))
    .filter((task): task is Task => task !== undefined && task.status !== TaskStatus.COMPLETED);

  return {
    directDependencies: node.dependencies.length,
    totalDependencies: totalDeps.size,
    directDependents: node.dependents.length,
    totalDependents: totalDependents.size,
    isBlocked: node.isBlocked,
    blockingTasks
  };
}

/**
 * Validate dependency relationships
 */
export function validateDependencies(allTasks: Task[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const taskMap = new Map(allTasks.map(t => [t.id, t]));

  // Check for missing dependency references
  allTasks.forEach(task => {
    task.dependencies.forEach((depId: string) => {
      if (!taskMap.has(depId)) {
        errors.push(`Task "${task.title}" references non-existent dependency: ${depId}`);
      }
    });
  });

  // Check for circular dependencies
  const cycles = detectCircularDependencies(allTasks);
  cycles.forEach(cycle => {
    const cycleNames = cycle.map(id => taskMap.get(id)?.title || id).join(' → ');
    errors.push(`Circular dependency detected: ${cycleNames}`);
  });

  // Check for self-dependencies
  allTasks.forEach(task => {
    if (task.dependencies.includes(task.id)) {
      errors.push(`Task "${task.title}" depends on itself`);
    }
  });

  // Warnings for potential issues
  allTasks.forEach(task => {
    if (task.dependencies.length > 10) {
      warnings.push(`Task "${task.title}" has many dependencies (${task.dependencies.length}), consider breaking it down`);
    }
  });

  const blockedTasks = getBlockedTasksFromGraph(buildDependencyGraph(allTasks));
  if (blockedTasks.length > allTasks.filter(t => t.status !== TaskStatus.COMPLETED).length * 0.5) {
    warnings.push(`High percentage of tasks are blocked (${blockedTasks.length}), review dependency structure`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
} 