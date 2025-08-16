import { ProjectContext } from '../../types';

// Project Template Interface
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  context: string;
  goals: string[];
  tags: string[];
  project_context?: ProjectContext;
  business_relevance: number;
  preferred_time_slots: string[];
  estimated_duration_weeks: number;
}

// Project Templates (simplified list)
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'business-strategy',
    name: '🎯 Business Strategy Project',
    description: 'Strategic planning and business development initiative',
    context: 'A comprehensive project focused on developing and implementing strategic business initiatives to drive growth and competitive advantage.',
    goals: [
      'Conduct market analysis and competitive landscape research',
      'Define strategic objectives and key performance indicators',
      'Develop implementation roadmap with clear milestones',
      'Create measurement framework for tracking progress'
    ],
    tags: ['strategy', 'business', 'planning', 'growth'],
    project_context: ProjectContext.BUSINESS,
    business_relevance: 9,
    preferred_time_slots: ['morning', 'tuesday', 'wednesday'],
    estimated_duration_weeks: 12
  },
  {
    id: 'product-development',
    name: '🚀 Product Development',
    description: 'End-to-end product development from concept to launch',
    context: 'A structured approach to developing new products or features, including research, design, development, and launch phases.',
    goals: [
      'Define product requirements and specifications',
      'Create design mockups and prototypes',
      'Develop minimum viable product (MVP)',
      'Plan and execute product launch strategy'
    ],
    tags: ['product', 'development', 'innovation', 'launch'],
    project_context: ProjectContext.BUSINESS,
    business_relevance: 8,
    preferred_time_slots: ['morning', 'afternoon'],
    estimated_duration_weeks: 16
  },
  {
    id: 'personal-learning',
    name: '📚 Personal Learning Project',
    description: 'Structured approach to learning new skills or knowledge',
    context: 'A systematic approach to acquiring new skills, knowledge, or certifications for personal or professional development.',
    goals: [
      'Identify learning objectives and success criteria',
      'Create study schedule and resource list',
      'Complete practical exercises and projects',
      'Apply new knowledge in real-world scenarios'
    ],
    tags: ['learning', 'education', 'skills', 'growth'],
    project_context: ProjectContext.PERSONAL,
    business_relevance: 3,
    preferred_time_slots: ['evening', 'weekend'],
    estimated_duration_weeks: 8
  },
  {
    id: 'health-fitness',
    name: '💪 Health & Fitness Goal',
    description: 'Comprehensive health and fitness improvement program',
    context: 'A holistic approach to improving physical health, fitness levels, and overall well-being through structured planning and consistent execution.',
    goals: [
      'Set specific, measurable fitness targets',
      'Create workout routine and nutrition plan',
      'Track progress and adjust plan as needed',
      'Establish sustainable healthy habits'
    ],
    tags: ['health', 'fitness', 'wellness', 'habits'],
    project_context: ProjectContext.PERSONAL,
    business_relevance: 2,
    preferred_time_slots: ['morning', 'evening'],
    estimated_duration_weeks: 12
  }
];

// Schedule Template Interface
export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  theme: string;
  tags: string[];
  schedule: string;
  time_blocks: {
    start_time: string;
    end_time: string;
    activity: string;
    type: 'work' | 'break' | 'personal';
  }[];
}

// Schedule Templates
export const SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    id: 'focused-work-day',
    name: '🎯 Focused Work Day',
    description: 'Deep work blocks with strategic breaks for maximum productivity',
    theme: 'productivity',
    tags: ['focus', 'deep-work', 'productivity'],
    schedule: '09:00-11:00 Deep Work\n11:00-11:15 Break\n11:15-12:30 Meetings\n12:30-13:30 Lunch\n13:30-15:30 Deep Work\n15:30-15:45 Break\n15:45-17:00 Admin Tasks',
    time_blocks: [
      { start_time: '09:00', end_time: '11:00', activity: 'Deep Work Block 1', type: 'work' },
      { start_time: '11:00', end_time: '11:15', activity: 'Break', type: 'break' },
      { start_time: '11:15', end_time: '12:30', activity: 'Meetings & Communication', type: 'work' },
      { start_time: '12:30', end_time: '13:30', activity: 'Lunch', type: 'break' },
      { start_time: '13:30', end_time: '15:30', activity: 'Deep Work Block 2', type: 'work' },
      { start_time: '15:30', end_time: '15:45', activity: 'Break', type: 'break' },
      { start_time: '15:45', end_time: '17:00', activity: 'Administrative Tasks', type: 'work' }
    ]
  },
  {
    id: 'balanced-day',
    name: '⚖️ Balanced Work-Life Day',
    description: 'Balanced schedule mixing work, personal time, and wellness',
    theme: 'balance',
    tags: ['work-life-balance', 'wellness', 'flexible'],
    schedule: '08:00-09:00 Morning Routine\n09:00-12:00 Work Block\n12:00-13:00 Lunch\n13:00-16:00 Work Block\n16:00-16:15 Break\n16:15-17:30 Wrap-up\n17:30-19:00 Personal Time',
    time_blocks: [
      { start_time: '08:00', end_time: '09:00', activity: 'Morning Routine', type: 'personal' },
      { start_time: '09:00', end_time: '12:00', activity: 'Morning Work Block', type: 'work' },
      { start_time: '12:00', end_time: '13:00', activity: 'Lunch & Walk', type: 'break' },
      { start_time: '13:00', end_time: '16:00', activity: 'Afternoon Work Block', type: 'work' },
      { start_time: '16:00', end_time: '16:15', activity: 'Break', type: 'break' },
      { start_time: '16:15', end_time: '17:30', activity: 'Wrap-up & Planning', type: 'work' },
      { start_time: '17:30', end_time: '19:00', activity: 'Personal Time', type: 'personal' }
    ]
  }
];

// AI Export Template Interface
export interface AIExportTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  format: 'markdown' | 'json' | 'csv';
}

// AI Export Templates
export const AI_EXPORT_TEMPLATES: AIExportTemplate[] = [
  {
    id: 'project-summary',
    name: 'Project Summary Report',
    description: 'Comprehensive overview of all projects with progress and insights',
    prompt: 'Generate a comprehensive project summary report including status, progress, key achievements, and recommendations for each project.',
    format: 'markdown'
  },
  {
    id: 'task-analysis',
    name: 'Task Analysis & Optimization',
    description: 'Detailed analysis of task patterns and productivity recommendations',
    prompt: 'Analyze task completion patterns, identify bottlenecks, and provide specific recommendations for improving productivity and workflow efficiency.',
    format: 'markdown'
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review Report',
    description: 'Weekly accomplishments and areas for improvement',
    prompt: 'Create a weekly review summarizing accomplishments, challenges faced, lessons learned, and action items for the upcoming week.',
    format: 'markdown'
  }
]; 
