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

// Flow-Optimized Task Templates
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  context: string;
  priority: TaskPriority;
  estimated_hours: number;
  tags: string[];
  project_context?: ProjectContext;
  
  // Flow-based optimization fields
  microGoals: string;
  challengeLevel: number; // 1-10 scale (4-6 optimal)
  engagementStrategy: 'sleep-to-flow' | 'lower-hurdle' | 'time-constraint' | 'response-inhibition';
  minimumFlowHours: number;
  minimumFlowMinutes: number;
  energyLevel: 1 | 2 | 3; // low, medium, high
  procrastinationTips: string;
}

// ==========================================
// DEEP WORK TEMPLATES (High Cognitive Load)
// ==========================================

const deepWorkTemplates: TaskTemplate[] = [
  {
    id: "strategic-planning-session",
    name: "🎯 Strategic Planning Session",
    description: "Develop comprehensive strategic plans, roadmaps, or business initiatives requiring deep analytical thinking.",
    context: "Strategic planning requires sustained cognitive load and creative problem-solving. This template structures the work to maintain flow while tackling complex, ambiguous challenges that could easily trigger approach-avoidance conflict.",
    priority: TaskPriority.HIGH,
    estimated_hours: 4,
    tags: ["strategy", "planning", "analysis", "decision-making"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Open planning template and review current objectives
2. Write 3-sentence problem statement in header
3. List 5 key constraints or limitations
4. Brainstorm 10 potential approaches (no filtering yet)
5. Create 2x2 matrix: Impact vs Effort
6. Plot each approach on matrix
7. Select top 3 approaches for deeper analysis
8. For each: write 2-paragraph opportunity/risk assessment
9. Draft implementation timeline with 5 major milestones
10. Review and refine based on resource constraints`,
    
    challengeLevel: 6,
    engagementStrategy: "sleep-to-flow",
    minimumFlowHours: 3,
    minimumFlowMinutes: 0,
    energyLevel: 3,
    procrastinationTips: "Strategic work feels overwhelming because outcomes are unclear. The micro-goals eliminate this by providing concrete next steps. If you're procrastinating, you might be unclear on success criteria - spend 10 minutes defining 'done' before starting."
  },

  {
    id: "complex-data-analysis",
    name: "📊 Complex Data Analysis",
    description: "Deep dive into datasets to extract insights, identify patterns, and generate actionable recommendations.",
    context: "Data analysis requires sustained attention and pattern recognition. The key is structuring the exploration to maintain momentum while avoiding analysis paralysis. This template prevents the common trap of endless data exploration without conclusions.",
    priority: TaskPriority.MEDIUM,
    estimated_hours: 3,
    tags: ["analysis", "data", "insights", "reporting"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Open data file and save backup copy
2. Scan first 20 rows to understand structure
3. Create summary stats table (count, mean, median for key columns)
4. Identify 3 most interesting variables to investigate
5. Create basic visualization for each variable
6. Look for correlations between top variables
7. Document 5 initial observations in bullet points
8. Generate 3 hypotheses to test
9. Create deeper analysis for hypothesis #1
10. Write 2-paragraph summary of key finding
11. Repeat steps 9-10 for remaining hypotheses
12. Compile findings into executive summary`,
    
    challengeLevel: 5,
    engagementStrategy: "lower-hurdle",
    minimumFlowHours: 2,
    minimumFlowMinutes: 30,
    energyLevel: 3,
    procrastinationTips: "Data analysis procrastination often stems from not knowing where to start with large datasets. Begin with simple counts and averages - your brain will naturally start seeing patterns, pulling you deeper into the work."
  },

  {
    id: "technical-system-design",
    name: "⚙️ Technical System Design",
    description: "Design complex technical systems, architectures, or integration solutions requiring deep technical expertise.",
    context: "System design combines analytical thinking with creative problem-solving. The challenge is balancing thoroughness with forward momentum. This template structures the design process to build complexity gradually while maintaining flow.",
    priority: TaskPriority.HIGH,
    estimated_hours: 5,
    tags: ["technical", "architecture", "design", "systems"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Open design document template
2. Write 1-sentence system purpose statement
3. List 5-7 key requirements in priority order
4. Sketch high-level component diagram (boxes and arrows)
5. Define data flow between 3 main components
6. Detail component #1: inputs, processing, outputs
7. Detail component #2: inputs, processing, outputs  
8. Detail component #3: inputs, processing, outputs
9. Identify 3 potential failure points
10. Design error handling for each failure point
11. Estimate performance requirements (load, speed, capacity)
12. Document 5 key technical decisions and rationale
13. Create implementation phases (3-4 chunks)
14. Review design for completeness and feasibility`,
    
    challengeLevel: 6,
    engagementStrategy: "response-inhibition",
    minimumFlowHours: 3,
    minimumFlowMinutes: 30,
    energyLevel: 3,
    procrastinationTips: "Technical design can trigger perfectionism paralysis. Start with a rough sketch - your brain works better when it has something concrete to refine rather than starting from nothing. Embrace 'good enough' for the first pass."
  },

  {
    id: "creative-problem-solving",
    name: "💡 Creative Problem Solving",
    description: "Tackle open-ended problems requiring innovation, brainstorming, and creative breakthrough thinking.",
    context: "Creative work thrives in flow states but can be disrupted by judgment and self-criticism. This template structures creative exploration while protecting the vulnerable ideation process from premature evaluation.",
    priority: TaskPriority.MEDIUM,
    estimated_hours: 2.5,
    tags: ["creativity", "innovation", "brainstorming", "ideation"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Write problem statement in one clear sentence
2. Set timer for 10 minutes: brain dump everything related
3. Circle 3 most interesting ideas from brain dump
4. Use "How might we..." to reframe problem 5 different ways
5. Pick most intriguing reframe and set 15-minute timer
6. Generate 20 wild ideas (quantity over quality)
7. Take 5-minute walk/break (let subconscious process)
8. Return and highlight 5 most promising ideas
9. Combine 2 different ideas into hybrid solution
10. Write 3 pros and 3 cons for hybrid concept
11. Prototype or sketch the concept in 15 minutes
12. Test concept against original problem statement`,
    
    challengeLevel: 4,
    engagementStrategy: "time-constraint",
    minimumFlowHours: 2,
    minimumFlowMinutes: 0,
    energyLevel: 2,
    procrastinationTips: "Creative work procrastination often comes from fear of 'bad' ideas. Remember: you can't edit a blank page. Set quantity goals (20 ideas) rather than quality goals to bypass your inner critic and access flow state."
  }
];

// ================================================
// COMMUNICATION TEMPLATES (Medium Cognitive Load)
// ================================================

const communicationTemplates: TaskTemplate[] = [
  {
    id: "client-presentation-prep",
    name: "🎤 Client Presentation Prep",
    description: "Prepare compelling presentations for clients, stakeholders, or executive audiences requiring persuasive communication.",
    context: "Presentation prep often triggers perfectionism and anxiety about audience judgment. This template focuses on story structure and clear messaging to build confidence while maintaining audience focus.",
    priority: TaskPriority.HIGH,
    estimated_hours: 3,
    tags: ["presentation", "communication", "stakeholder", "persuasion"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Open presentation template and add title slide
2. Write one sentence describing presentation goal
3. List 3 key messages audience must remember
4. Create story arc: Problem → Solution → Benefit
5. Draft opening hook (question, statistic, or story)
6. Build "problem" section with 2-3 supporting points
7. Present solution with clear before/after comparison
8. Add 3 specific benefits with quantified impact
9. Create call-to-action slide with next steps
10. Review for logical flow and timing
11. Add visual elements to 5 key slides
12. Practice opening and closing aloud
13. Prepare for 3 likely questions
14. Final review focusing on audience value`,
    
    challengeLevel: 5,
    engagementStrategy: "lower-hurdle",
    minimumFlowHours: 2,
    minimumFlowMinutes: 30,
    energyLevel: 2,
    procrastinationTips: "Presentation procrastination stems from wanting to sound perfect. Focus on being helpful rather than impressive. Start with your core message - everything else is just support. Your expertise will naturally emerge once you start building."
  },

  {
    id: "difficult-conversation-prep",
    name: "🗣️ Difficult Conversation Prep",
    description: "Prepare for challenging conversations, feedback sessions, or conflict resolution meetings requiring emotional intelligence.",
    context: "Difficult conversations trigger avoidance because we anticipate negative emotions. This template provides structure to build confidence and reduce anxiety while ensuring productive outcomes.",
    priority: TaskPriority.MEDIUM,
    estimated_hours: 1,
    tags: ["communication", "conflict", "feedback", "leadership"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Write 2-sentence objective for the conversation
2. List 3 positive things about the person/situation
3. Identify the specific behavior or issue (not personality)
4. Write the impact using "when... then..." format
5. Prepare 2 open-ended questions to understand their perspective
6. Draft ideal outcome in specific, actionable terms
7. Anticipate 3 possible reactions/objections
8. Prepare empathetic responses for each reaction
9. Plan conversation setting and timing
10. Practice opening statement aloud (30 seconds max)
11. Identify 2 areas where you can compromise
12. Write follow-up plan with clear next steps`,
    
    challengeLevel: 4,
    engagementStrategy: "response-inhibition",
    minimumFlowHours: 1,
    minimumFlowMinutes: 0,
    energyLevel: 2,
    procrastinationTips: "We delay difficult conversations hoping problems will resolve themselves. They rarely do. Focus on the positive outcome you want rather than potential negative reactions. Most people appreciate direct, respectful communication more than we expect."
  },

  {
    id: "team-collaboration-session",
    name: "🤝 Team Collaboration Session",
    description: "Facilitate productive team workshops, brainstorming sessions, or collaborative planning meetings.",
    context: "Group facilitation requires balancing multiple perspectives while maintaining momentum toward objectives. This template ensures inclusive participation while preventing meetings from becoming unfocused discussions.",
    priority: TaskPriority.MEDIUM,
    estimated_hours: 2,
    tags: ["facilitation", "teamwork", "collaboration", "meetings"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Write meeting objective and success criteria
2. Create agenda with 4-5 time-boxed segments
3. Prepare opening activity (2-3 minutes) to engage everyone
4. List 3-4 key questions to guide discussion
5. Plan idea capture method (whiteboard, sticky notes, digital)
6. Design decision-making process for key choices
7. Prepare conversation starters for quiet participants
8. Plan redirect strategies for off-topic discussions
9. Create action item template with owner/deadline format
10. Draft meeting summary format
11. Send pre-meeting materials 24 hours ahead
12. Set up physical/digital collaboration space`,
    
    challengeLevel: 5,
    engagementStrategy: "lower-hurdle",
    minimumFlowHours: 1,
    minimumFlowMinutes: 30,
    energyLevel: 2,
    procrastinationTips: "Meeting facilitation anxiety comes from fear of awkward silences or conflict. Prepare more structure than you think you need - you can always be flexible, but having a clear path forward gives you confidence and helps participants feel secure."
  },

  {
    id: "progress-note-documentation",
    name: "📝 Progress Note Documentation",
    description: "Complete therapy progress notes, clinical documentation, and compliance-required records efficiently and thoroughly.",
    context: "Clinical documentation requires accuracy and completeness while managing time constraints. This template ensures quality while reducing the cognitive load through systematic approaches that maintain legal and ethical standards.",
    priority: TaskPriority.HIGH,
    estimated_hours: 1,
    tags: ["documentation", "therapy", "compliance", "clinical"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Open client file and review previous session notes
2. Write session date, duration, and modality
3. Document 3 key topics discussed in session
4. Note client's current mood and presentation
5. Record 2-3 specific interventions used
6. Document client's response to interventions
7. Update progress toward treatment goals (3-4 goals)
8. Note any homework assignments given
9. Record any safety concerns or risk factors
10. Plan for next session (focus areas)
11. Add relevant quotes or significant client statements
12. Review note for completeness and accuracy
13. Submit to system and update calendar`,
    
    challengeLevel: 3,
    engagementStrategy: "sleep-to-flow",
    minimumFlowHours: 0,
    minimumFlowMinutes: 45,
    energyLevel: 2,
    procrastinationTips: "Progress note procrastination happens when we wait and lose session details. Complete notes within 2 hours when memory is fresh. Use the same structure every time to build automaticity - your brain will start organizing information during sessions."
  }
];

// ====================================================
// ADMINISTRATIVE TEMPLATES (Low-Medium Cognitive Load)
// ====================================================

const administrativeTemplates: TaskTemplate[] = [
  {
    id: "process-documentation-update",
    name: "📋 Process Documentation Update",
    description: "Create or update standard operating procedures, workflows, and process documentation for team consistency.",
    context: "Process documentation feels tedious but is critical for scaling and knowledge transfer. This template makes the work engaging by focusing on user empathy and practical value while building comprehensive resources.",
    priority: TaskPriority.MEDIUM,
    estimated_hours: 2,
    tags: ["documentation", "processes", "procedures", "knowledge-transfer"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Open existing process document or create new template
2. Write 1-sentence purpose statement for this process
3. List 5-7 main steps in chronological order
4. For each step, add "what" and "why" details
5. Identify decision points and create if/then logic
6. Add screenshots or diagrams for complex steps
7. Note common mistakes and how to avoid them
8. Include quality checkpoints and success criteria
9. List required tools, access, or permissions
10. Add estimated time for each major step
11. Create troubleshooting section for issues
12. Review from new employee perspective
13. Test process by following documentation exactly`,
    
    challengeLevel: 3,
    engagementStrategy: "lower-hurdle",
    minimumFlowHours: 1,
    minimumFlowMinutes: 30,
    energyLevel: 2,
    procrastinationTips: "Process documentation procrastination happens because we know the process so well that writing it seems unnecessary. Remember: you're helping future team members and your future self. Focus on what would have helped you when you were learning this process."
  },

  {
    id: "compliance-audit-preparation",
    name: "✅ Compliance Audit Preparation",
    description: "Prepare for regulatory audits, certification reviews, or compliance assessments with systematic evidence gathering.",
    context: "Compliance work triggers anxiety because stakes feel high and requirements can be complex. This template breaks audit prep into manageable chunks while ensuring nothing critical is missed.",
    priority: TaskPriority.HIGH,
    estimated_hours: 4,
    tags: ["compliance", "audit", "regulatory", "documentation"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Create audit preparation folder structure
2. Review audit requirements and create checklist
3. Gather documentation for requirement #1
4. Organize and label documents clearly
5. Check requirement #1 for completeness
6. Repeat steps 3-5 for requirements #2-5
7. Identify any missing documentation
8. Create timeline to obtain missing items
9. Prepare staff interview talking points
10. Review previous audit findings and remediation
11. Conduct internal walkthrough simulation
12. Update policies/procedures if gaps found
13. Compile evidence binder with index
14. Schedule final review meeting with team`,
    
    challengeLevel: 4,
    engagementStrategy: "time-constraint",
    minimumFlowHours: 2,
    minimumFlowMinutes: 0,
    energyLevel: 2,
    procrastinationTips: "Audit anxiety amplifies procrastination. Start with organizing what you already have rather than focusing on gaps. Most organizations are more compliant than they realize - the challenge is usually organization and presentation, not fundamental problems."
  },

  {
    id: "routine-system-maintenance",
    name: "🔧 Routine System Maintenance",
    description: "Perform regular IT maintenance, updates, backups, and system health checks to prevent larger issues.",
    context: "Maintenance tasks are often delayed because they lack urgency, but systematic execution prevents larger problems. This template makes routine work engaging through progress tracking and problem prevention mindset.",
    priority: TaskPriority.MEDIUM,
    estimated_hours: 2,
    tags: ["maintenance", "systems", "IT", "prevention"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Open maintenance checklist and review last completion
2. Check server/system status indicators
3. Verify backup completion from last 24 hours
4. Review security log for any alerts or issues
5. Update 3 most critical software packages
6. Test 2-3 key system functions
7. Check storage space on primary systems
8. Verify user access and permission accuracy
9. Review and clear temporary files/logs
10. Update documentation with any changes
11. Schedule next maintenance window
12. Log completion and any issues found`,
    
    challengeLevel: 2,
    engagementStrategy: "time-constraint",
    minimumFlowHours: 1,
    minimumFlowMinutes: 30,
    energyLevel: 1,
    procrastinationTips: "Maintenance procrastination happens because tasks feel boring and non-urgent. Reframe this as 'insurance work' - you're preventing future emergencies and stress. Track how maintenance catches issues before they become problems."
  },

  {
    id: "project-status-reporting",
    name: "📈 Project Status Reporting",
    description: "Compile comprehensive project updates, progress reports, and stakeholder communications with key metrics.",
    context: "Status reporting often feels like administrative overhead but provides critical communication and accountability. This template focuses on storytelling with data to make reports valuable for both reporters and recipients.",
    priority: TaskPriority.MEDIUM,
    estimated_hours: 1.5,
    tags: ["reporting", "communication", "project-management", "stakeholders"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Open report template and add reporting period
2. List 3 major accomplishments from this period
3. Update progress metrics (budget, timeline, scope)
4. Identify 2-3 key challenges or risks
5. Document mitigation actions for each challenge
6. Update milestone completion percentage
7. List next period's 3 main priorities
8. Add any scope changes or decisions needed
9. Include relevant data visualizations or charts
10. Write executive summary (3-4 sentences)
11. Review for clarity and actionable insights
12. Format for specific audience needs
13. Send to stakeholders with clear subject line`,
    
    challengeLevel: 3,
    engagementStrategy: "lower-hurdle",
    minimumFlowHours: 1,
    minimumFlowMinutes: 0,
    energyLevel: 2,
    procrastinationTips: "Report procrastination often stems from fear of highlighting problems or lack of progress. Remember: stakeholders prefer transparency over surprise. Focus on what you learned and how you're adapting rather than just what went wrong."
  }
];

// ==============================================
// LEARNING TEMPLATES (Variable Cognitive Load)
// ==============================================

const learningTemplates: TaskTemplate[] = [
  {
    id: "skill-development-session",
    name: "🎓 Skill Development Session",
    description: "Focused learning and practice sessions for developing new professional skills or deepening existing expertise.",
    context: "Skill development requires sustained practice and reflection. This template structures learning to maximize retention while maintaining engagement through varied activities and progress tracking.",
    priority: TaskPriority.MEDIUM,
    estimated_hours: 2,
    tags: ["learning", "skills", "development", "practice"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Define specific skill objective for this session
2. Review previous session notes and progress
3. Identify 3 key concepts to focus on today
4. Read/watch primary learning material for 30 minutes
5. Take notes using active summarization technique
6. Practice first concept with hands-on exercise
7. Practice second concept with different application
8. Practice third concept in realistic scenario
9. Reflect on what clicked vs. what's still unclear
10. Connect new learning to existing knowledge
11. Plan practice opportunities for coming week
12. Update learning log with progress and insights`,
    
    challengeLevel: 4,
    engagementStrategy: "time-constraint",
    minimumFlowHours: 1,
    minimumFlowMinutes: 30,
    energyLevel: 2,
    procrastinationTips: "Learning procrastination often comes from information overwhelm or unclear progress. Focus on one specific skill per session and measure progress by what you can do, not just what you know. Apply learning immediately to make it stick."
  },

  {
    id: "research-investigation",
    name: "🔍 Research Investigation",
    description: "Deep research into industry trends, competitive analysis, or knowledge gathering for informed decision-making.",
    context: "Research can become endless browsing without clear objectives. This template provides structure to maintain focus while ensuring comprehensive coverage of important topics with actionable outcomes.",
    priority: TaskPriority.MEDIUM,
    estimated_hours: 3,
    tags: ["research", "analysis", "investigation", "insights"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Write clear research question in one sentence
2. Define what "enough" research looks like
3. Identify 5-7 key sources to investigate
4. Create simple template for capturing findings
5. Research source #1 and record 3 key insights
6. Research source #2 and record 3 key insights
7. Continue for remaining sources
8. Look for patterns across sources
9. Identify conflicting information and investigate
10. Summarize findings in 5 main points
11. Connect findings to original research question
12. Identify 3 actionable next steps
13. Create one-page summary for future reference`,
    
    challengeLevel: 5,
    engagementStrategy: "response-inhibition",
    minimumFlowHours: 2,
    minimumFlowMinutes: 0,
    energyLevel: 3,
    procrastinationTips: "Research procrastination happens when scope feels overwhelming or purpose is unclear. Start with a specific question and set a research limit (5 sources, 2 hours). Your brain will start connecting dots once you have some material to work with."
  },

  {
    id: "best-practices-analysis",
    name: "⭐ Best Practices Analysis",
    description: "Study and adapt best practices from other organizations, industries, or successful implementations.",
    context: "Best practice research requires balancing inspiration with practical application. This template ensures you extract actionable insights while avoiding the trap of copying without adapting to your context.",
    priority: TaskPriority.LOW,
    estimated_hours: 2.5,
    tags: ["best-practices", "benchmarking", "improvement", "adaptation"],
    project_context: ProjectContext.BUSINESS,
    
    microGoals: `1. Define current challenge or improvement area
2. Identify 3-4 organizations known for excellence in this area
3. Research organization #1's approach and methods
4. Document specific practices and implementation details
5. Identify what makes their approach successful
6. Repeat for organizations #2-4
7. Compare approaches and identify common elements
8. Note unique factors that might not apply to your context
9. Select 3 most promising practices to adapt
10. Design pilot implementation for practice #1
11. Identify resources needed and potential obstacles
12. Create action plan with 30/60/90 day milestones`,
    
    challengeLevel: 4,
    engagementStrategy: "lower-hurdle",
    minimumFlowHours: 2,
    minimumFlowMinutes: 0,
    energyLevel: 2,
    procrastinationTips: "Best practice research can feel like comparing yourself unfavorably to others. Focus on learning and adaptation rather than copying. Every organization adapted practices to their context - your job is intelligent adaptation, not replication."
  }
];

// Export all templates as single array
export const TASK_TEMPLATES: TaskTemplate[] = [
  ...deepWorkTemplates,
  ...communicationTemplates,
  ...administrativeTemplates,
  ...learningTemplates
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