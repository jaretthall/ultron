import { Project, Task, ProjectStatus, TaskStatus, TaskPriority } from '../types';

export interface ProductivityMetrics {
  taskCompletionRate: number;
  averageTaskCompletionTime: number;
  projectCompletionRate: number;
  timeEstimationAccuracy: number;
  priorityDistribution: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  productivityScore: number;
  focusTimeUtilization: number;
  deadlineMissRate: number;
  taskVelocity: number;
}

export interface PeriodMetrics {
  period: string;
  tasksCompleted: number;
  projectsCompleted: number;
  hoursWorked: number;
  completionRate: number;
}

export interface GoalMetrics {
  totalGoals: number;
  completedGoals: number;
  goalCompletionRate: number;
  projectsWithGoals: number;
  averageGoalsPerProject: number;
  goalProgressDistribution: {
    notStarted: number;
    inProgress: number;
    completed: number;
  };
}

export interface TrendData {
  daily: PeriodMetrics[];
  weekly: PeriodMetrics[];
  monthly: PeriodMetrics[];
}

export interface AnalyticsData {
  productivity: ProductivityMetrics;
  trends: TrendData;
  goals: GoalMetrics;
  workloadInsights: {
    totalTasksInProgress: number;
    averageTasksPerProject: number;
    mostActiveProjects: Array<{ project: Project; taskCount: number }>;
    upcomingDeadlines: Array<{ entity: Project | Task; deadline: string; daysUntil: number }>;
    burnoutRisk: 'low' | 'medium' | 'high';
    contextSwitchFrequency: number;
    energyLevelDistribution: {
      low: number;
      medium: number;
      high: number;
    };
  };
  performanceInsights: {
    topPerformingDays: string[];
    bottleneckAnalysis: string[];
    improvementSuggestions: string[];
    consistencyScore: number;
  };
}

export class AnalyticsService {
  /**
   * Calculate comprehensive analytics data from projects and tasks
   */
  static calculateAnalytics(projects: Project[], tasks: Task[]): AnalyticsData {
    const productivity = this.calculateProductivityMetrics(projects, tasks);
    const trends = this.calculateTrends(projects, tasks);
    const goals = this.calculateGoalMetrics(projects);
    const workloadInsights = this.calculateWorkloadInsights(projects, tasks);
    const performanceInsights = this.calculatePerformanceInsights(projects, tasks);

    return {
      productivity,
      trends,
      goals,
      workloadInsights,
      performanceInsights,
    };
  }

  /**
   * Calculate productivity metrics
   */
  private static calculateProductivityMetrics(projects: Project[], tasks: Task[]): ProductivityMetrics {
    const completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED);
    const totalTasks = tasks.length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    const completedProjects = projects.filter(project => project.status === ProjectStatus.COMPLETED);
    const totalProjects = projects.length;
    const projectCompletionRate = totalProjects > 0 ? (completedProjects.length / totalProjects) * 100 : 0;

    // Calculate average task completion time (mock data for now - would need historical data)
    const averageTaskCompletionTime = this.calculateAverageCompletionTime(completedTasks);

    // Time estimation accuracy (would need actual time tracking data)
    const timeEstimationAccuracy = this.calculateTimeEstimationAccuracy(completedTasks);

    // Priority distribution
    const priorityDistribution = this.calculatePriorityDistribution(tasks);

    // Enhanced metrics
    const productivityScore = this.calculateProductivityScore(taskCompletionRate, projectCompletionRate, timeEstimationAccuracy);
    const focusTimeUtilization = this.calculateFocusTimeUtilization(tasks);
    const deadlineMissRate = this.calculateDeadlineMissRate(tasks);
    const taskVelocity = this.calculateTaskVelocity(completedTasks);

    return {
      taskCompletionRate,
      averageTaskCompletionTime,
      projectCompletionRate,
      timeEstimationAccuracy,
      priorityDistribution,
      productivityScore,
      focusTimeUtilization,
      deadlineMissRate,
      taskVelocity,
    };
  }

  /**
   * Calculate trend data for different time periods
   */
  private static calculateTrends(_projects: Project[], tasks: Task[]): TrendData {
    
    // Generate daily trends for the last 30 days
    const daily = this.generatePeriodMetrics(tasks, 30, 'day');
    
    // Generate weekly trends for the last 12 weeks
    const weekly = this.generatePeriodMetrics(tasks, 12, 'week');
    
    // Generate monthly trends for the last 12 months
    const monthly = this.generatePeriodMetrics(tasks, 12, 'month');

    return { daily, weekly, monthly };
  }

  /**
   * Calculate goal-related metrics
   */
  private static calculateGoalMetrics(projects: Project[]): GoalMetrics {
    let totalGoals = 0;
    let completedGoals = 0;
    let projectsWithGoals = 0;
    
    const goalProgressDistribution = {
      notStarted: 0,
      inProgress: 0,
      completed: 0,
    };

    projects.forEach(project => {
      if (project.goals && project.goals.length > 0) {
        projectsWithGoals++;
        totalGoals += project.goals.length;
        
        // For simulation purposes, assume some goals are completed based on project status
        if (project.status === ProjectStatus.COMPLETED) {
          completedGoals += project.goals.length;
          goalProgressDistribution.completed += project.goals.length;
        } else if (project.status === ProjectStatus.ACTIVE) {
          const partialCompletion = Math.floor(project.goals.length * 0.3);
          completedGoals += partialCompletion;
          goalProgressDistribution.inProgress += project.goals.length - partialCompletion;
          goalProgressDistribution.completed += partialCompletion;
        } else {
          goalProgressDistribution.notStarted += project.goals.length;
        }
      }
    });

    const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
    const averageGoalsPerProject = projectsWithGoals > 0 ? totalGoals / projectsWithGoals : 0;

    return {
      totalGoals,
      completedGoals,
      goalCompletionRate,
      projectsWithGoals,
      averageGoalsPerProject,
      goalProgressDistribution,
    };
  }

  /**
   * Calculate workload insights
   */
  private static calculateWorkloadInsights(projects: Project[], tasks: Task[]) {
    const activeTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS);
    const totalTasksInProgress = activeTasks.length;
    const averageTasksPerProject = projects.length > 0 ? tasks.length / projects.length : 0;

    // Most active projects
    const projectTaskCounts: { [key: string]: number } = {};
    tasks.forEach(task => {
      if (task.project_id) {
        projectTaskCounts[task.project_id] = (projectTaskCounts[task.project_id] || 0) + 1;
      }
    });

    const mostActiveProjects = projects
      .filter(project => projectTaskCounts[project.id] > 0)
      .map(project => ({
        project,
        taskCount: projectTaskCounts[project.id] || 0,
      }))
      .sort((a, b) => b.taskCount - a.taskCount);

    // Upcoming deadlines
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines: Array<{ entity: Project | Task; deadline: string; daysUntil: number }> = [];

         projects.forEach(project => {
       if (project.deadline) {
         const deadlineDate = new Date(project.deadline);
         if (deadlineDate >= now && deadlineDate <= sevenDaysFromNow) {
           const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
           upcomingDeadlines.push({ entity: project, deadline: project.deadline, daysUntil });
         }
       }
     });

     tasks.forEach(task => {
       if (task.due_date) {
         const deadlineDate = new Date(task.due_date);
         if (deadlineDate >= now && deadlineDate <= sevenDaysFromNow) {
           const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
           upcomingDeadlines.push({ entity: task, deadline: task.due_date, daysUntil });
         }
       }
     });

    // Enhanced insights
    const burnoutRisk = this.calculateBurnoutRisk(totalTasksInProgress, activeTasks);
    const contextSwitchFrequency = this.calculateContextSwitchFrequency(projects, tasks);
    const energyLevelDistribution = this.calculateEnergyLevelDistribution(tasks);

    return {
      totalTasksInProgress,
      averageTasksPerProject,
      mostActiveProjects,
      upcomingDeadlines: upcomingDeadlines.sort((a, b) => a.daysUntil - b.daysUntil),
      burnoutRisk,
      contextSwitchFrequency,
      energyLevelDistribution,
    };
  }

  /**
   * Calculate performance insights
   */
  private static calculatePerformanceInsights(_projects: Project[], _tasks: Task[]) {
    // Mock data for demonstration - in real implementation, this would analyze historical patterns
    const topPerformingDays = ['Monday', 'Wednesday', 'Friday'];
    const bottleneckAnalysis = [
      'High dependency chains in active projects',
      'Context switching between business and personal tasks',
      'Insufficient time allocation for high-energy tasks'
    ];
    const improvementSuggestions = [
      'Consider batching similar tasks to reduce context switching',
      'Schedule high-energy tasks during peak focus hours',
      'Break down large tasks into smaller, manageable chunks'
    ];
    const consistencyScore = Math.floor(Math.random() * 30) + 70; // 70-100%

    return {
      topPerformingDays,
      bottleneckAnalysis,
      improvementSuggestions,
      consistencyScore,
    };
  }

  /**
   * Generate period metrics for trend analysis
   */
  private static generatePeriodMetrics(_tasks: Task[], periods: number, periodType: 'day' | 'week' | 'month'): PeriodMetrics[] {
    const metrics: PeriodMetrics[] = [];
    const now = new Date();

    for (let i = periods - 1; i >= 0; i--) {
      const periodDate = new Date(now);
      
      if (periodType === 'day') {
        periodDate.setDate(now.getDate() - i);
      } else if (periodType === 'week') {
        periodDate.setDate(now.getDate() - (i * 7));
      } else if (periodType === 'month') {
        periodDate.setMonth(now.getMonth() - i);
      }

      const periodString = periodDate.toISOString().split('T')[0];
      
      // Mock data for now - in reality, this would analyze historical completion data
      const tasksCompleted = Math.floor(Math.random() * 10) + 1;
      const projectsCompleted = Math.floor(Math.random() * 2);
      const hoursWorked = Math.floor(Math.random() * 8) + 1;
      const completionRate = Math.floor(Math.random() * 40) + 60; // 60-100%

      metrics.push({
        period: periodString,
        tasksCompleted,
        projectsCompleted,
        hoursWorked,
        completionRate,
      });
    }

    return metrics;
  }

  /**
   * Calculate average task completion time
   */
  private static calculateAverageCompletionTime(completedTasks: Task[]): number {
    if (completedTasks.length === 0) return 0;
    
    // Mock calculation - would need actual completion dates
    const totalHours = completedTasks.reduce((sum, task) => sum + task.estimated_hours, 0);
    return totalHours / completedTasks.length;
  }

  /**
   * Calculate time estimation accuracy
   */
  private static calculateTimeEstimationAccuracy(_completedTasks: Task[]): number {
    // Mock calculation - would need actual time tracking data
    // For now, return a random accuracy between 70-95%
    return Math.floor(Math.random() * 25) + 70;
  }

  /**
   * Calculate priority distribution
   */
  private static calculatePriorityDistribution(tasks: Task[]) {
    const total = tasks.length;
    if (total === 0) {
      return { urgent: 0, high: 0, medium: 0, low: 0 };
    }

    const urgent = tasks.filter(task => task.priority === TaskPriority.URGENT).length;
    const high = tasks.filter(task => task.priority === TaskPriority.HIGH).length;
    const medium = tasks.filter(task => task.priority === TaskPriority.MEDIUM).length;
    const low = tasks.filter(task => task.priority === TaskPriority.LOW).length;

    return {
      urgent: (urgent / total) * 100,
      high: (high / total) * 100,
      medium: (medium / total) * 100,
      low: (low / total) * 100,
    };
  }

  // Enhanced calculation methods
  private static calculateProductivityScore(taskCompletion: number, projectCompletion: number, timeAccuracy: number): number {
    return Math.round((taskCompletion * 0.4 + projectCompletion * 0.3 + timeAccuracy * 0.3));
  }

  private static calculateFocusTimeUtilization(tasks: Task[]): number {
    const highEnergyTasks = tasks.filter(task => task.energy_level === 'high').length;
    const totalTasks = tasks.length;
    return totalTasks > 0 ? Math.round((highEnergyTasks / totalTasks) * 100) : 0;
  }

  private static calculateDeadlineMissRate(tasks: Task[]): number {
    const tasksWithDeadlines = tasks.filter(task => task.due_date);
    if (tasksWithDeadlines.length === 0) return 0;
    
    const now = new Date();
    const missedDeadlines = tasksWithDeadlines.filter(task => 
      task.due_date && 
      new Date(task.due_date) < now && 
      task.status !== TaskStatus.COMPLETED
    ).length;
    
    return Math.round((missedDeadlines / tasksWithDeadlines.length) * 100);
  }

  private static calculateTaskVelocity(_completedTasks: Task[]): number {
    // Simulate weekly velocity - in real implementation, analyze completion timestamps
    return Math.floor(Math.random() * 10) + 5; // 5-15 tasks per week
  }

  private static calculateBurnoutRisk(totalTasksInProgress: number, activeTasks: Task[]): 'low' | 'medium' | 'high' {
    const urgentTasks = activeTasks.filter(task => task.priority === TaskPriority.URGENT).length;
    const riskScore = totalTasksInProgress * 0.5 + urgentTasks * 2;
    
    if (riskScore > 15) return 'high';
    if (riskScore > 8) return 'medium';
    return 'low';
  }

  private static calculateContextSwitchFrequency(projects: Project[], _tasks: Task[]): number {
    const businessProjects = projects.filter(p => p.context === 'business').length;
    const personalProjects = projects.filter(p => p.context === 'personal').length;
    return Math.min(businessProjects, personalProjects) * 2; // Estimate switches per day
  }

  private static calculateEnergyLevelDistribution(tasks: Task[]) {
    const total = tasks.length;
    if (total === 0) return { low: 0, medium: 0, high: 0 };
    
    const lowEnergy = tasks.filter(task => task.energy_level === 'low').length;
    const mediumEnergy = tasks.filter(task => task.energy_level === 'medium').length;
    const highEnergy = tasks.filter(task => task.energy_level === 'high').length;
    
    return {
      low: Math.round((lowEnergy / total) * 100),
      medium: Math.round((mediumEnergy / total) * 100),
      high: Math.round((highEnergy / total) * 100),
    };
  }

  /**
   * Generate a comprehensive performance report
   */
  static generatePerformanceReport(projects: Project[], tasks: Task[]): {
    executiveSummary: string;
    keyInsights: string[];
    recommendations: string[];
    strengths: string[];
    areasForImprovement: string[];
    trend: 'improving' | 'stable' | 'declining';
  } {
    const analytics = this.calculateAnalytics(projects, tasks);
    const { productivity, goals, workloadInsights, performanceInsights } = analytics;

    // Generate executive summary
    const executiveSummary = `Performance analysis reveals a productivity score of ${productivity.productivityScore}% with ${productivity.taskCompletionRate.toFixed(1)}% task completion rate. Current workload includes ${workloadInsights.totalTasksInProgress} active tasks across ${projects.filter(p => p.status === 'active').length} projects, with ${workloadInsights.burnoutRisk} burnout risk assessment.`;

    // Generate key insights
    const keyInsights = [
      `Task velocity: ${productivity.taskVelocity} tasks completed per week`,
      `Focus time utilization at ${productivity.focusTimeUtilization}%, indicating ${productivity.focusTimeUtilization > 60 ? 'good' : 'poor'} high-energy task allocation`,
      `${productivity.deadlineMissRate}% deadline miss rate ${productivity.deadlineMissRate > 10 ? 'suggests need for better time management' : 'shows strong deadline adherence'}`,
      `${workloadInsights.contextSwitchFrequency} context switches per day may impact focus`,
      `Goal achievement at ${goals.goalCompletionRate.toFixed(1)}% across ${goals.projectsWithGoals} projects with defined goals`
    ];

    // Generate recommendations
    const recommendations = [
      ...performanceInsights.improvementSuggestions,
      productivity.deadlineMissRate > 15 ? 'Consider implementing stricter deadline tracking and buffer time allocation' : null,
      workloadInsights.burnoutRisk === 'high' ? 'Reduce current workload and prioritize high-impact tasks only' : null,
      productivity.focusTimeUtilization < 40 ? 'Increase allocation of high-energy tasks during peak focus hours' : null,
      workloadInsights.contextSwitchFrequency > 6 ? 'Implement time-blocking to reduce context switching overhead' : null
    ].filter(Boolean) as string[];

    // Identify strengths
    const strengths = [
      productivity.taskCompletionRate > 70 ? 'Strong task completion rate' : null,
      productivity.timeEstimationAccuracy > 75 ? 'Accurate time estimation skills' : null,
      goals.goalCompletionRate > 60 ? 'Effective goal achievement' : null,
      productivity.deadlineMissRate < 10 ? 'Excellent deadline management' : null,
      performanceInsights.consistencyScore > 80 ? 'High consistency in performance' : null,
      workloadInsights.burnoutRisk === 'low' ? 'Well-managed workload balance' : null
    ].filter(Boolean) as string[];

    // Identify areas for improvement
    const areasForImprovement = [
      productivity.taskCompletionRate < 60 ? 'Task completion rate needs improvement' : null,
      productivity.focusTimeUtilization < 50 ? 'Optimize high-energy task scheduling' : null,
      goals.goalCompletionRate < 50 ? 'Goal achievement requires more focus' : null,
      productivity.deadlineMissRate > 15 ? 'Deadline management needs attention' : null,
      workloadInsights.burnoutRisk === 'high' ? 'Workload management requires immediate attention' : null,
      workloadInsights.contextSwitchFrequency > 8 ? 'Reduce context switching for better focus' : null
    ].filter(Boolean) as string[];

    // Determine trend (simplified logic)
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (productivity.productivityScore > 75 && productivity.deadlineMissRate < 10) {
      trend = 'improving';
    } else if (productivity.productivityScore < 50 || workloadInsights.burnoutRisk === 'high') {
      trend = 'declining';
    }

    return {
      executiveSummary,
      keyInsights,
      recommendations: recommendations.slice(0, 5), // Limit to top 5
      strengths: strengths.slice(0, 4), // Limit to top 4
      areasForImprovement: areasForImprovement.slice(0, 4), // Limit to top 4
      trend
    };
  }
} 