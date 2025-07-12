import { ProjectContext, TaskPriority } from '../../types';

// Project Templates
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  context: string;
  goals: string[];
  tags: string[];
  project_context: ProjectContext;
  business_relevance: number;
  preferred_time_slots: string[];
  estimated_duration_weeks?: number;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'web-development',
    name: '🌐 Web Development Project',
    description: 'Full-stack web application development',
    context: 'Develop a modern web application with responsive design, user authentication, database integration, and deployment. Focus on clean code, user experience, and scalability.',
    goals: [
      'Design and create wireframes',
      'Set up development environment',
      'Implement frontend user interface',
      'Develop backend API and database',
      'Integrate authentication system',
      'Conduct testing and debugging',
      'Deploy to production environment',
      'Document codebase and API'
    ],
    tags: ['web', 'development', 'frontend', 'backend', 'full-stack'],
    project_context: ProjectContext.BUSINESS,
    business_relevance: 8,
    preferred_time_slots: ['morning', 'afternoon'],
    estimated_duration_weeks: 8
  },
  {
    id: 'marketing-campaign',
    name: '📢 Marketing Campaign',
    description: 'Comprehensive marketing campaign planning and execution',
    context: 'Plan and execute a multi-channel marketing campaign to increase brand awareness, generate leads, and drive conversions. Include content creation, social media strategy, and performance tracking.',
    goals: [
      'Define target audience and personas',
      'Create content calendar and strategy',
      'Design marketing materials and assets',
      'Set up social media campaigns',
      'Implement email marketing sequences',
      'Track and analyze campaign performance',
      'Optimize based on metrics and feedback',
      'Report on ROI and campaign results'
    ],
    tags: ['marketing', 'campaign', 'social-media', 'content', 'analytics'],
    project_context: ProjectContext.BUSINESS,
    business_relevance: 9,
    preferred_time_slots: ['morning', 'afternoon'],
    estimated_duration_weeks: 6
  },
  {
    id: 'client-onboarding',
    name: '🤝 Client Onboarding Process',
    description: 'Streamlined client onboarding and relationship setup',
    context: 'Establish a systematic approach to onboarding new clients, including documentation, communication protocols, project setup, and relationship management to ensure successful project delivery.',
    goals: [
      'Create client onboarding checklist',
      'Set up project communication channels',
      'Gather client requirements and expectations',
      'Establish project timelines and milestones',
      'Create project documentation templates',
      'Set up regular check-in schedules',
      'Implement feedback collection system',
      'Document best practices and lessons learned'
    ],
    tags: ['client', 'onboarding', 'process', 'documentation', 'communication'],
    project_context: ProjectContext.BUSINESS,
    business_relevance: 7,
    preferred_time_slots: ['morning', 'midday'],
    estimated_duration_weeks: 3
  },
  {
    id: 'product-launch',
    name: '🚀 Product Launch',
    description: 'Comprehensive product launch strategy and execution',
    context: 'Plan and execute a successful product launch including market research, positioning, launch strategy, marketing materials, and post-launch optimization.',
    goals: [
      'Conduct market research and competitor analysis',
      'Define product positioning and messaging',
      'Create launch timeline and milestones',
      'Develop marketing and promotional materials',
      'Set up analytics and tracking systems',
      'Execute launch strategy across channels',
      'Monitor performance and gather feedback',
      'Iterate and optimize based on results'
    ],
    tags: ['product', 'launch', 'marketing', 'strategy', 'analytics'],
    project_context: ProjectContext.BUSINESS,
    business_relevance: 10,
    preferred_time_slots: ['morning', 'afternoon'],
    estimated_duration_weeks: 10
  },
  {
    id: 'process-improvement',
    name: '⚙️ Process Improvement Initiative',
    description: 'Analyze and optimize existing business processes',
    context: 'Systematically review current business processes, identify inefficiencies, design improvements, and implement optimized workflows to increase productivity and reduce costs.',
    goals: [
      'Map current processes and workflows',
      'Identify bottlenecks and inefficiencies',
      'Research best practices and solutions',
      'Design improved process workflows',
      'Create implementation plan and timeline',
      'Train team on new processes',
      'Monitor and measure improvements',
      'Document new standard operating procedures'
    ],
    tags: ['process', 'improvement', 'optimization', 'efficiency', 'workflow'],
    project_context: ProjectContext.BUSINESS,
    business_relevance: 8,
    preferred_time_slots: ['morning', 'afternoon'],
    estimated_duration_weeks: 4
  },
  {
    id: 'personal-learning',
    name: '📚 Personal Learning Project',
    description: 'Structured approach to learning new skills or knowledge',
    context: 'Develop expertise in a new area through structured learning, practical application, and knowledge consolidation. Focus on building transferable skills and documenting progress.',
    goals: [
      'Define learning objectives and outcomes',
      'Research and select learning resources',
      'Create study schedule and milestones',
      'Practice through hands-on projects',
      'Join communities and seek mentorship',
      'Document learning and create notes',
      'Apply knowledge in real-world scenarios',
      'Share learning and teach others'
    ],
    tags: ['learning', 'skill-development', 'personal', 'growth', 'education'],
    project_context: ProjectContext.PERSONAL,
    business_relevance: 6,
    preferred_time_slots: ['evening', 'early-morning'],
    estimated_duration_weeks: 12
  },
  {
    id: 'digital-transformation',
    name: '🚀 Digital Transformation Initiative',
    description: 'Modern digital infrastructure update to remain competitive',
    context: 'Modern businesses require digital infrastructure updates to remain competitive. This template addresses the gap between current manual processes and automated solutions, directly impacting customer satisfaction and operational costs.',
    goals: [
      'Audit current digital touchpoints and identify 5+ automation opportunities',
      'Implement 3 key process automations with measurable time savings',
      'Train 80% of team members on new digital tools within 4 weeks',
      'Reduce manual data entry by 60% through system integration',
      'Establish KPI dashboard for ongoing performance monitoring',
      'Create documentation for 100% of new processes',
      'Achieve 90% user adoption rate within 6 weeks of launch'
    ],
    tags: ['digital-transformation', 'automation', 'efficiency', 'roi-focused'],
    project_context: ProjectContext.BUSINESS,
    business_relevance: 8,
    preferred_time_slots: ['morning', 'tuesday', 'wednesday', 'thursday'],
    estimated_duration_weeks: 10
  },
  {
    id: 'customer-experience',
    name: '🎯 Customer Experience Optimization',
    description: 'Data-driven improvements to customer touchpoints for revenue growth',
    context: 'Customer experience directly correlates with revenue retention and growth. This template focuses on data-driven improvements to customer touchpoints, addressing pain points that impact business metrics.',
    goals: [
      'Complete comprehensive customer journey mapping for 3 primary personas',
      'Identify and prioritize 8-10 friction points in current experience',
      'Implement 5 high-impact UX improvements with A/B testing',
      'Reduce customer support tickets by 25% through proactive solutions',
      'Increase Net Promoter Score by 15 points within 8 weeks',
      'Launch customer feedback loop system with 70%+ response rate',
      'Document best practices for ongoing CX optimization'
    ],
    tags: ['customer-experience', 'ux-optimization', 'revenue-growth', 'data-driven'],
    project_context: ProjectContext.BUSINESS,
    business_relevance: 9,
    preferred_time_slots: ['afternoon', 'monday', 'tuesday', 'wednesday'],
    estimated_duration_weeks: 8
  },
  {
    id: 'operational-excellence',
    name: '⚡ Operational Excellence Program',
    description: 'Systematic process optimization and performance measurement',
    context: 'Operational inefficiencies compound over time, creating hidden costs and employee frustration. This template systematically addresses process optimization, resource allocation, and performance measurement.',
    goals: [
      'Conduct time-and-motion studies for 5 core business processes',
      'Eliminate or streamline 3 redundant processes completely',
      'Implement standardized workflows for 80% of routine operations',
      'Reduce average task completion time by 25% across key processes',
      'Establish performance metrics dashboard with real-time visibility',
      'Train team leads on process improvement methodologies',
      'Create sustainable continuous improvement culture with monthly reviews'
    ],
    tags: ['operational-excellence', 'process-optimization', 'cost-reduction', 'productivity'],
    project_context: ProjectContext.BUSINESS,
    business_relevance: 7,
    preferred_time_slots: ['morning', 'thursday', 'friday'],
    estimated_duration_weeks: 11
  }
];

// Task Templates
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  context: string;
  priority: TaskPriority;
  estimated_hours: number;
  tags: string[];
  project_context?: ProjectContext;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'code-review',
    name: '👀 Code Review',
    description: 'Review code changes for quality and best practices',
    context: 'Thoroughly review code changes, check for bugs, ensure adherence to coding standards, verify functionality, and provide constructive feedback to maintain code quality.',
    priority: TaskPriority.HIGH,
    estimated_hours: 2,
    tags: ['review', 'code', 'quality', 'feedback'],
    project_context: ProjectContext.BUSINESS
  },
  {
    id: 'bug-fix',
    name: '🐛 Bug Fix',
    description: 'Identify and resolve software bugs',
    context: 'Reproduce the bug, analyze root cause, implement fix, test thoroughly, and ensure no regression. Document the solution and update relevant documentation.',
    priority: TaskPriority.HIGH,
    estimated_hours: 3,
    tags: ['bug', 'fix', 'debugging', 'testing'],
    project_context: ProjectContext.BUSINESS
  },
  {
    id: 'feature-implementation',
    name: '✨ Feature Implementation',
    description: 'Develop and implement new software feature',
    context: 'Design feature architecture, implement functionality, write tests, ensure integration with existing codebase, and document the new feature for future reference.',
    priority: TaskPriority.MEDIUM,
    estimated_hours: 6,
    tags: ['feature', 'development', 'implementation', 'testing'],
    project_context: ProjectContext.BUSINESS
  },
  {
    id: 'meeting-preparation',
    name: '📋 Meeting Preparation',
    description: 'Prepare for upcoming meeting or presentation',
    context: 'Review agenda, prepare talking points, gather necessary materials, research attendees, prepare slides or documents, and anticipate questions or discussion points.',
    priority: TaskPriority.MEDIUM,
    estimated_hours: 1,
    tags: ['meeting', 'preparation', 'presentation', 'planning'],
    project_context: ProjectContext.BUSINESS
  },
  {
    id: 'documentation',
    name: '📝 Documentation',
    description: 'Create or update project documentation',
    context: 'Write clear, comprehensive documentation including setup instructions, API references, user guides, or technical specifications. Ensure documentation is current and accessible.',
    priority: TaskPriority.MEDIUM,
    estimated_hours: 4,
    tags: ['documentation', 'writing', 'technical', 'reference'],
    project_context: ProjectContext.BUSINESS
  },
  {
    id: 'research',
    name: '🔍 Research Task',
    description: 'Conduct research on specific topic or solution',
    context: 'Gather information from reliable sources, analyze findings, compare options, document insights, and provide recommendations based on research findings.',
    priority: TaskPriority.LOW,
    estimated_hours: 3,
    tags: ['research', 'analysis', 'investigation', 'recommendations'],
    project_context: ProjectContext.BUSINESS
  },
  {
    id: 'client-communication',
    name: '📞 Client Communication',
    description: 'Communicate with client about project status',
    context: 'Prepare status update, address client concerns, discuss next steps, gather feedback, and maintain positive client relationship through professional communication.',
    priority: TaskPriority.HIGH,
    estimated_hours: 1,
    tags: ['client', 'communication', 'update', 'relationship'],
    project_context: ProjectContext.BUSINESS
  },
  {
    id: 'testing',
    name: '🧪 Testing',
    description: 'Conduct testing of software or processes',
    context: 'Create test cases, execute tests, document results, identify issues, verify fixes, and ensure quality standards are met before deployment or release.',
    priority: TaskPriority.HIGH,
    estimated_hours: 4,
    tags: ['testing', 'quality', 'verification', 'validation'],
    project_context: ProjectContext.BUSINESS
  },
  {
    id: 'system-integration',
    name: '🔗 System Integration Setup',
    description: 'Critical technical implementation affecting multiple workflows',
    context: 'Critical technical implementation that affects multiple workflows. Dependencies include API access, stakeholder approval, and testing environment setup. Failure to complete impacts project timeline significantly.',
    priority: TaskPriority.HIGH,
    estimated_hours: 5,
    tags: ['integration', 'technical', 'api', 'critical'],
    project_context: ProjectContext.BUSINESS
  },
  {
    id: 'stakeholder-presentation',
    name: '📊 Stakeholder Presentation Prep',
    description: 'Executive presentation requiring business case and data visualization',
    context: 'Executive presentation requiring clear business case, visual data representation, and anticipated Q&A preparation. Success directly impacts project funding and resource allocation.',
    priority: TaskPriority.HIGH,
    estimated_hours: 3,
    tags: ['presentation', 'stakeholder', 'executive', 'business-case'],
    project_context: ProjectContext.BUSINESS
  },
  {
    id: 'process-documentation',
    name: '📋 Process Documentation Update',
    description: 'Essential documentation for knowledge transfer and compliance',
    context: 'Essential for knowledge transfer and compliance, but can be scheduled flexibly. Required for audit readiness and team onboarding. Quality more important than speed.',
    priority: TaskPriority.MEDIUM,
    estimated_hours: 2,
    tags: ['documentation', 'process', 'compliance', 'knowledge-transfer'],
    project_context: ProjectContext.BUSINESS
  },
  {
    id: 'data-analysis',
    name: '📈 Data Analysis Deep Dive',
    description: 'Comprehensive analysis to inform strategic decisions',
    context: 'Comprehensive analysis to inform strategic decisions. Requires uninterrupted time for pattern recognition and insight development. Results feed into executive reporting.',
    priority: TaskPriority.MEDIUM,
    estimated_hours: 6,
    tags: ['analysis', 'data', 'strategic', 'insights'],
    project_context: ProjectContext.BUSINESS
  }
];

// AI Export Templates
export interface AIExportTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  filters: {
    context?: ProjectContext;
    priority?: TaskPriority;
    status?: string;
    timeframe?: string;
  };
  outputFormat: string;
}

export const AI_EXPORT_TEMPLATES: AIExportTemplate[] = [
  {
    id: 'daily-schedule',
    name: '📅 Daily Schedule',
    description: 'Generate detailed hourly schedule for today',
    prompt: 'Create a detailed hourly schedule for today focusing on business tasks. Schedule business tasks between 8:00 AM and 5:00 PM on weekdays only. Prioritize high-priority tasks and consider task dependencies.',
    filters: {
      context: ProjectContext.BUSINESS,
      timeframe: 'today'
    },
    outputFormat: 'markdown'
  },
  {
    id: 'weekly-planning',
    name: '📊 Weekly Planning',
    description: 'Generate weekly project overview and planning',
    prompt: 'Analyze current projects and tasks to create a comprehensive weekly plan. Focus on project priorities, task dependencies, and optimal time allocation across the business week.',
    filters: {
      context: ProjectContext.BUSINESS,
      timeframe: 'week'
    },
    outputFormat: 'markdown'
  },
  {
    id: 'project-analysis',
    name: '📈 Project Analysis',
    description: 'Analyze project health and suggest improvements',
    prompt: 'Review all active projects and provide analysis of project health, progress, bottlenecks, and recommendations for improvement. Focus on business impact and resource optimization.',
    filters: {
      context: ProjectContext.BUSINESS,
      status: 'active'
    },
    outputFormat: 'markdown'
  },
  {
    id: 'task-optimization',
    name: '⚡ Task Optimization',
    description: 'Optimize task prioritization and scheduling',
    prompt: 'Analyze current tasks and provide recommendations for better prioritization, time estimation, and scheduling. Focus on high-impact tasks and efficient workflow organization.',
    filters: {
      timeframe: 'current'
    },
    outputFormat: 'markdown'
  },
  {
    id: 'daily-planning-assistant',
    name: '🗓️ Daily Planning Assistant',
    description: 'Structured daily agenda with priority ranking and energy optimization',
    prompt: 'Based on my current projects and tasks, help me plan tomorrow\'s schedule. Consider: My energy levels peak between 9-11 AM and 2-4 PM, I prefer creative work in the afternoon, I need 30-minute buffer between meetings, and high-priority items should be scheduled first. Please create a structured daily agenda with time blocks.',
    filters: {
      context: ProjectContext.BUSINESS,
      timeframe: 'tomorrow'
    },
    outputFormat: 'markdown'
  },
  {
    id: 'weekly-strategic-review',
    name: '📊 Weekly Strategic Review',
    description: 'Executive summary with metrics and strategic recommendations',
    prompt: 'Generate a strategic weekly review covering: Progress against key project milestones, Resource allocation effectiveness, Emerging risks and opportunities, and Recommended priority adjustments for next week. Focus on business impact and strategic decision-making.',
    filters: {
      context: ProjectContext.BUSINESS,
      timeframe: 'week'
    },
    outputFormat: 'markdown'
  },
  {
    id: 'project-health-analysis',
    name: '📈 Project Health Analysis',
    description: 'Detailed project health report with strategic recommendations',
    prompt: 'Analyze project performance and provide strategic recommendations covering: Timeline adherence and milestone completion, Resource utilization and efficiency, Risk factors and mitigation strategies, Stakeholder satisfaction and engagement, and ROI tracking and business value delivery.',
    filters: {
      context: ProjectContext.BUSINESS,
      status: 'active'
    },
    outputFormat: 'markdown'
  }
];

// Schedule Templates
export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  schedule: string;
  tags: string[];
  theme: string;
}

export const SCHEDULE_TEMPLATES: ScheduleTemplate[] = [
  {
    id: 'focused-work-day',
    name: '🎯 Focused Work Day',
    description: 'Deep work blocks with minimal meetings',
    theme: 'Deep Focus',
    tags: ['focus', 'productivity', 'deep-work'],
    schedule: `# Today's Schedule - Focused Work Day

## Morning (8:00 AM - 12:00 PM)
- [ ] 8:00 AM - Morning routine and coffee ☕
- [ ] 8:30 AM - Review daily priorities and goals
- [ ] 9:00 AM - **Deep Work Block 1** (90 min) - High-priority project work
- [ ] 10:30 AM - Break (15 min)
- [ ] 10:45 AM - **Deep Work Block 2** (75 min) - Continued focus work
- [ ] 12:00 PM - Lunch break

## Afternoon (1:00 PM - 5:00 PM)
- [ ] 1:00 PM - **Deep Work Block 3** (90 min) - Complex problem solving
- [ ] 2:30 PM - Break (15 min)
- [ ] 2:45 PM - **Deep Work Block 4** (75 min) - Implementation work
- [ ] 4:00 PM - Quick check-ins and communication
- [ ] 4:30 PM - Plan tomorrow and wrap up
- [ ] 5:00 PM - End of work day

## Evening (6:00 PM+)
- [ ] 6:00 PM - Personal time and relaxation
- [ ] 7:00 PM - Exercise or outdoor activity
- [ ] 8:00 PM - Dinner and family time`
  },
  {
    id: 'meeting-heavy-day',
    name: '🗣️ Meeting Heavy Day',
    description: 'Structured day with multiple meetings and collaboration',
    theme: 'Collaboration',
    tags: ['meetings', 'collaboration', 'communication'],
    schedule: `# Today's Schedule - Meeting Heavy Day

## Morning (8:00 AM - 12:00 PM)
- [ ] 8:00 AM - Morning routine and preparation
- [ ] 8:30 AM - Review meeting agendas and prep materials
- [ ] 9:00 AM - **Team Standup** (30 min) - Project updates
- [ ] 9:30 AM - Work block (60 min) - Priority tasks
- [ ] 10:30 AM - **Client Check-in** (45 min) - Project discussion
- [ ] 11:15 AM - Break (15 min)
- [ ] 11:30 AM - **Strategy Meeting** (30 min) - Planning session
- [ ] 12:00 PM - Lunch break

## Afternoon (1:00 PM - 5:00 PM)
- [ ] 1:00 PM - **Project Review** (60 min) - Progress assessment
- [ ] 2:00 PM - Work block (45 min) - Meeting follow-ups
- [ ] 2:45 PM - Break (15 min)
- [ ] 3:00 PM - **Brainstorming Session** (60 min) - Creative collaboration
- [ ] 4:00 PM - **One-on-One** (30 min) - Team member check-in
- [ ] 4:30 PM - Email and communication catch-up
- [ ] 5:00 PM - End of work day

## Evening (6:00 PM+)
- [ ] 6:00 PM - Decompress and transition
- [ ] 7:00 PM - Personal activities
- [ ] 8:00 PM - Dinner and relaxation`
  },
  {
    id: 'creative-day',
    name: '🎨 Creative Day',
    description: 'Optimized for creative work and innovation',
    theme: 'Creativity',
    tags: ['creative', 'innovation', 'design'],
    schedule: `# Today's Schedule - Creative Day

## Morning (8:00 AM - 12:00 PM)
- [ ] 8:00 AM - Inspiring morning routine (music, coffee, journal)
- [ ] 8:30 AM - Creative inspiration review (articles, designs, ideas)
- [ ] 9:00 AM - **Creative Sprint 1** (90 min) - Brainstorming and ideation
- [ ] 10:30 AM - Energizing break (walk, stretch, fresh air)
- [ ] 10:45 AM - **Creative Sprint 2** (75 min) - Design and prototyping
- [ ] 12:00 PM - Lunch break (somewhere inspiring)

## Afternoon (1:00 PM - 5:00 PM)
- [ ] 1:00 PM - **Creative Sprint 3** (90 min) - Implementation and refinement
- [ ] 2:30 PM - Break (15 min)
- [ ] 2:45 PM - **Creative Review** (45 min) - Feedback and iteration
- [ ] 3:30 PM - **Collaboration Time** (60 min) - Share and get input
- [ ] 4:30 PM - Organize creative assets and plan next steps
- [ ] 5:00 PM - End of work day

## Evening (6:00 PM+)
- [ ] 6:00 PM - Creative hobby or side project
- [ ] 7:00 PM - Inspiration time (museums, books, nature)
- [ ] 8:00 PM - Dinner and personal time`
  },
  {
    id: 'catch-up-day',
    name: '📧 Catch-up Day',
    description: 'Organized day for catching up on communications and admin tasks',
    theme: 'Organization',
    tags: ['admin', 'communication', 'organization'],
    schedule: `# Today's Schedule - Catch-up Day

## Morning (8:00 AM - 12:00 PM)
- [ ] 8:00 AM - Morning routine and coffee
- [ ] 8:30 AM - **Email Batch 1** (45 min) - Urgent communications
- [ ] 9:15 AM - **Administrative Tasks** (60 min) - Paperwork and processes
- [ ] 10:15 AM - Break (15 min)
- [ ] 10:30 AM - **Project Updates** (60 min) - Status reports and documentation
- [ ] 11:30 AM - **Planning Session** (30 min) - Organize upcoming work
- [ ] 12:00 PM - Lunch break

## Afternoon (1:00 PM - 5:00 PM)
- [ ] 1:00 PM - **Email Batch 2** (45 min) - Follow-ups and responses
- [ ] 1:45 PM - **Task Cleanup** (60 min) - Small tasks and loose ends
- [ ] 2:45 PM - Break (15 min)
- [ ] 3:00 PM - **File Organization** (45 min) - Digital and physical cleanup
- [ ] 3:45 PM - **System Updates** (30 min) - Tools and process improvements
- [ ] 4:15 PM - **Week Planning** (45 min) - Prepare for upcoming week
- [ ] 5:00 PM - End of work day

## Evening (6:00 PM+)
- [ ] 6:00 PM - Personal admin tasks
- [ ] 7:00 PM - Relaxation and personal time
- [ ] 8:00 PM - Dinner and family time`
  },
  {
    id: 'creative-strategy-day',
    name: '🚀 Creative Strategy Day',
    description: 'Innovation, planning, and strategic thinking optimized for peak energy',
    theme: 'Strategic Innovation',
    tags: ['strategy', 'innovation', 'creative', 'planning'],
    schedule: `# Today's Schedule - Creative Strategy Day

## Morning (9:00 AM - 1:00 PM)
- [ ] 9:00 AM - **Strategic Planning Session** (90 min) - Peak energy for complex thinking
- [ ] 10:30 AM - Break/movement (15 min)
- [ ] 10:45 AM - **Creative Problem-Solving** (75 min) - Innovation and ideation
- [ ] 12:00 PM - Lunch break (60 min)

## Afternoon (1:00 PM - 5:00 PM)
- [ ] 1:00 PM - **Collaborative Brainstorming** (90 min) - Team innovation session
- [ ] 2:30 PM - Break (15 min)
- [ ] 2:45 PM - **Design/Creative Implementation** (75 min) - Prototype and iterate
- [ ] 4:00 PM - **Administrative Catch-up** (30 min) - Essential tasks only
- [ ] 4:30 PM - **Next-Day Preparation** (30 min) - Strategic planning for tomorrow

## Evening (6:00 PM+)
- [ ] 6:00 PM - Personal creative time
- [ ] 7:00 PM - Inspiration and learning
- [ ] 8:00 PM - Dinner and personal time`
  },
  {
    id: 'execution-focus-day',
    name: '⚡ Execution Focus Day',
    description: 'High-impact implementation and delivery with sustained concentration',
    theme: 'Implementation Excellence',
    tags: ['execution', 'implementation', 'delivery', 'focus'],
    schedule: `# Today's Schedule - Execution Focus Day

## Morning (8:30 AM - 1:00 PM)
- [ ] 8:30 AM - **Complex Technical Work** (90 min) - Peak focus for challenging tasks
- [ ] 10:00 AM - Break (15 min)
- [ ] 10:15 AM - **Project Implementation** (105 min) - Core deliverable work
- [ ] 12:00 PM - Lunch break (60 min)

## Afternoon (1:00 PM - 5:00 PM)
- [ ] 1:00 PM - **Documentation & Process Work** (60 min) - Knowledge capture
- [ ] 2:00 PM - **Quality Review & Testing** (90 min) - Ensure excellence
- [ ] 3:30 PM - Break (15 min)
- [ ] 3:45 PM - **Communication & Updates** (45 min) - Stakeholder alignment
- [ ] 4:30 PM - **Administrative Tasks** (30 min) - Essential housekeeping

## Evening (6:00 PM+)
- [ ] 6:00 PM - Personal productivity time
- [ ] 7:00 PM - Exercise and wellness
- [ ] 8:00 PM - Dinner and family time`
  },
  {
    id: 'collaboration-day',
    name: '🤝 Collaboration Day',
    description: 'High-energy teamwork and stakeholder management',
    theme: 'Team Synergy',
    tags: ['collaboration', 'meetings', 'teamwork', 'stakeholder'],
    schedule: `# Today's Schedule - Collaboration Day

## Morning (9:00 AM - 1:00 PM)
- [ ] 9:00 AM - **Team Standup & Planning** (60 min) - Align on priorities
- [ ] 10:00 AM - Break (15 min)
- [ ] 10:15 AM - **Strategic Stakeholder Meetings** (105 min) - Key decisions and alignment
- [ ] 12:00 PM - Lunch break (60 min)

## Afternoon (1:00 PM - 5:00 PM)
- [ ] 1:00 PM - **Project Collaboration Sessions** (90 min) - Working together on deliverables
- [ ] 2:30 PM - Break (15 min)
- [ ] 2:45 PM - **Cross-Functional Working Sessions** (75 min) - Department coordination
- [ ] 4:00 PM - **Follow-up Communications** (30 min) - Action items and next steps
- [ ] 4:30 PM - **Individual Reflection & Planning** (30 min) - Process insights

## Evening (6:00 PM+)
- [ ] 6:00 PM - Personal reflection time
- [ ] 7:00 PM - Social activities or networking
- [ ] 8:00 PM - Dinner and personal time`
  },
  {
    id: 'analysis-review-day',
    name: '📊 Analysis & Review Day',
    description: 'Deep analytical work and strategic assessment',
    theme: 'Strategic Analysis',
    tags: ['analysis', 'review', 'data', 'strategy'],
    schedule: `# Today's Schedule - Analysis & Review Day

## Morning (8:30 AM - 1:00 PM)
- [ ] 8:30 AM - **Deep Data Analysis** (120 min) - Peak concentration for complex analysis
- [ ] 10:30 AM - Break (15 min)
- [ ] 10:45 AM - **Performance Metrics Review** (75 min) - KPI analysis and insights
- [ ] 12:00 PM - Lunch break (60 min)

## Afternoon (1:00 PM - 5:00 PM)
- [ ] 1:00 PM - **Strategic Assessment & Planning** (90 min) - High-level strategic thinking
- [ ] 2:30 PM - Break (15 min)
- [ ] 2:45 PM - **Report Preparation & Insights** (75 min) - Synthesize findings
- [ ] 4:00 PM - **Stakeholder Communication** (30 min) - Share insights and recommendations
- [ ] 4:30 PM - **Next-Week Strategic Planning** (30 min) - Future-focused preparation

## Evening (6:00 PM+)
- [ ] 6:00 PM - Personal learning and development
- [ ] 7:00 PM - Reading and research
- [ ] 8:00 PM - Dinner and personal time`
  }
]; 