AI Suggestions Workflow
Approval is all-or-nothing:
You want to review the entire AI-generated schedule (the “purple plan”) and either accept it as a whole or provide feedback for a complete rewrite.

Feedback should be simple:
You’re looking for the least complicated way to provide feedback—possibly a single form or free-text input for the whole plan.

Editing suggestions:
You want to be able to suggest changes (e.g., grouping tasks, changing order) before approval, but not by editing individual events—rather, by giving feedback and letting AI regenerate the plan.

Chronological view:
The suggestions should be shown in a chronological list, ideally with breakdowns for tasks and subtasks.

Calendar display:
Approved AI suggestions remain purple to distinguish them from other events. No need to manually delete or adjust individual purple events; if you want changes, you update the task/project and regenerate the plan.

Completed work:
You’ll manually update the task/project with what you’ve completed, and the AI will use this context to generate future plans and update progress.

Replacing suggestions:
Each new AI-generated plan replaces the previous suggestions for that task/project.

UI/UX Adjustments
Remove Day View:
Only Month and Week views should remain.

Sidebar for Day Details:
When a day is selected, a right-hand sidebar should show the details for that day (tasks, events, suggestions, etc.).

AI Suggestions Panel:
The AI suggestions panel should be accessible from the calendar, not a separate tab, to streamline workflow.

Recommended Next Steps
1. UI Changes
[] Remove the Day view from the calendar.
[] Add a right-hand sidebar that displays details for the selected day (including tasks, events, and AI suggestions).
[] Move the AI suggestions panel to be accessible directly from the calendar view (e.g., as a sidebar or modal).

2. AI Suggestions Logic
[] When you request a new plan, the AI generates a full schedule (purple events) for the relevant period.
[] You review the plan in a chronological list (sidebar or modal).
[] You can approve the entire plan, which overlays the purple events on the calendar.
[] If you want changes, you provide feedback (simple form or free-text), and the AI regenerates the plan.
[] Approved suggestions remain purple and are not individually editable or deletable.

3. Feedback and Regeneration
[] Add a feedback mechanism (form or text box) to the suggestions panel.
[] On feedback submission, the AI generates a new plan, replacing the previous suggestions.

4. Task/Project Updates
[] When you complete work, you update the task/project.
[] The AI uses this updated context for future plans and progress tracking.

Questions for Confirmation Before Implementation
Sidebar Details:
Should the sidebar show all (tasks, events, suggestions) for the selected day, or only suggestions? Everything

Feedback UI:
Do you prefer a simple text box for feedback, or would you like some structured options (e.g., checkboxes for common issues, plus a text box)? I like the hybrid option that has text boxes for frequent issues (allow more time for traffic, etc)

Approval Button:
Should there be a single “Approve Plan” button, or do you want to allow “Approve & Edit” (which would let you tweak the plan before final approval)? I like "approve & edit" that way the AI will not need to recreate everything but rather just make an adjustment to the work it has already done.

Progress Tracking:
Should the sidebar also show progress bars or completion status for tasks/projects? It can show the progress bar that is already present within the tasks.

I've transformed your task edit dialog to incorporate the powerful flow-based anti-procrastination concepts from the transcript! Here are the key improvements based on the video:
Flow-Based Features Added:
1. Clear Micro-Goals Section

Dedicated field for breaking tasks into "ridiculously specific" steps
Encourages the "open laptop → navigate to folder → click template" level of detail
Makes first actions so easy the brain has nothing to resist

2. Challenge-Skills Balance Controls

Visual slider to hit the "4% sweet spot" beyond current skill level
Real-time feedback on difficulty (boredom vs. anxiety zones)
Scope definition fields to avoid "Pandora's Box" effect

3. Flow Payoff Planning

"Minimum Flow Block" time instead of just estimates
Focuses on uninterrupted time needed to make struggle worthwhile
Prevents "Swiss cheese calendar" syndrome

4. Engagement Strategies

Four research-backed approaches: Sleep-to-Flow, Lower the Hurdle, Time Constraint, Response Inhibition
Contextual tips that change based on selected strategy
Addresses the critical "engage" phase before struggle

5. Procrastination vs. Ambivalence Check

Radio buttons to distinguish approach-avoidance conflict from intuitive ambivalence
Helps identify when "procrastination" might actually be wisdom
Prevents mixing up signals that need different responses

The interface now embodies the video's core insight: procrastination = high motivation + inaction, and provides specific tools to resolve the neurochemical "civil war" between approach and avoidance systems. It's designed to help users achieve that "buttery execution" state where tasks feel effortless rather than forced.

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Edit Dialog</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }

        .dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .dialog-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            width: 600px;
            max-width: 90vw;
            max-height: 90vh;
            overflow: hidden;
            position: relative;
        }

        .dialog-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .dialog-title {
            font-size: 20px;
            font-weight: 600;
        }

        .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }

        .close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .dialog-content {
            padding: 24px;
            max-height: 60vh;
            overflow-y: auto;
        }

        .form-section {
            margin-bottom: 24px;
        }

        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 6px;
        }

        .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s, box-shadow 0.2s;
            background: white;
        }

        .form-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-textarea {
            min-height: 80px;
            resize: vertical;
            font-family: inherit;
        }

        .form-select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 12px center;
            background-repeat: no-repeat;
            background-size: 16px;
            padding-right: 40px;
        }

        .priority-buttons {
            display: flex;
            gap: 8px;
        }

        .priority-btn {
            flex: 1;
            padding: 8px 12px;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            background: white;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.2s;
        }

        .priority-btn.low {
            border-color: #10b981;
            color: #10b981;
        }

        .priority-btn.medium {
            border-color: #f59e0b;
            color: #f59e0b;
        }

        .priority-btn.high {
            border-color: #ef4444;
            color: #ef4444;
        }

        .priority-btn.urgent {
            border-color: #7c3aed;
            color: #7c3aed;
        }

        .priority-btn.active.low {
            background: #10b981;
            color: white;
        }

        .priority-btn.active.medium {
            background: #f59e0b;
            color: white;
        }

        .priority-btn.active.high {
            background: #ef4444;
            color: white;
        }

        .priority-btn.active.urgent {
            background: #7c3aed;
            color: white;
        }

        .tag-input-container {
            position: relative;
        }

        .tag-suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 2px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
            max-height: 120px;
            overflow-y: auto;
            z-index: 10;
        }

        .tag-suggestion {
            padding: 8px 16px;
            cursor: pointer;
            font-size: 13px;
            border-bottom: 1px solid #f3f4f6;
        }

        .tag-suggestion:hover {
            background: #f9fafb;
        }

        .current-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;
        }

        .tag {
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .tag-remove {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
        }

        .progress-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .progress-bar {
            flex: 1;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: #10b981;
            transition: width 0.3s;
        }

        .progress-input {
            width: 60px;
            text-align: center;
        }

        .time-estimate-group {
            display: flex;
            gap: 12px;
            align-items: end;
        }

        .time-input {
            flex: 1;
        }

        .energy-level {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }

        .energy-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid #e5e7eb;
            cursor: pointer;
            transition: all 0.2s;
        }

        .energy-dot.active {
            border-color: #667eea;
            background: #667eea;
        }

        .dialog-actions {
            padding: 24px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            background: #f9fafb;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }

        .btn-secondary:hover {
            background: #e5e7eb;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5a67d8;
        }

        .btn-danger {
            background: #ef4444;
            color: white;
        }

        .btn-danger:hover {
            background: #dc2626;
        }

        .challenge-slider-container {
            margin-top: 8px;
        }

        .slider-labels {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .challenge-slider {
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: linear-gradient(to right, #ef4444 0%, #10b981 45%, #10b981 55%, #ef4444 100%);
            outline: none;
            appearance: none;
        }

        .challenge-slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #667eea;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .challenge-slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #667eea;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .challenge-display {
            text-align: center;
            margin-top: 8px;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
        }

        .scope-inputs input {
            border-left: 4px solid #667eea;
        }

        .procrastination-analysis {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .analysis-question {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .analysis-question:hover {
            background: #f9fafb;
        }

        .analysis-question input[type="radio"] {
            margin: 0;
        }

        .analysis-question label {
            margin: 0;
            cursor: pointer;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="dialog-overlay">
        <div class="dialog-container">
            <div class="dialog-header">
                <h2 class="dialog-title">Edit Task</h2>
                <button class="close-btn" onclick="closeDialog()">×</button>
            </div>
            
            <div class="dialog-content">
                <!-- Basic Information Section -->
                <div class="form-section">
                    <div class="section-title">Basic Information</div>
                    
                    <div class="form-group">
                        <label class="form-label" for="task-title">Task Title *</label>
                        <input type="text" id="task-title" class="form-input" value="Progress Note - 2025-07-14" placeholder="Enter task title...">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="clear-goals">Clear Micro-Goals</label>
                        <textarea id="clear-goals" class="form-input form-textarea" placeholder="Break this down into ridiculously specific steps:
1. Open laptop
2. Navigate to client file folder
3. Open progress note template
4. Write client name and session date
5. Document session highlights..."></textarea>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                            ✨ <strong>Flow Tip:</strong> Make each step so easy your brain has nothing to resist
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="task-description">Context & Why</label>
                        <textarea id="task-description" class="form-input form-textarea" placeholder="Why does this matter? What's the bigger purpose? How does it connect to your goals?"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="project-select">Project</label>
                        <select id="project-select" class="form-input form-select">
                            <option value="">Select a project...</option>
                            <option value="therapy-notes" selected>Therapy Notes</option>
                            <option value="facilities">Facilities</option>
                            <option value="1148">1148</option>
                            <option value="renuevo">Renuevo</option>
                            <option value="tech">Tech</option>
                            <option value="clinica-medicos">Clinica Medicos</option>
                        </select>
                    </div>
                </div>

                <!-- Challenge-Skills Balance Section -->
                <div class="form-section">
                    <div class="section-title">Challenge-Skills Balance</div>
                    
                    <div class="form-group">
                        <label class="form-label">Difficulty Level</label>
                        <div class="challenge-slider-container">
                            <div class="slider-labels">
                                <span style="font-size: 11px; color: #6b7280;">Too Easy (Boredom)</span>
                                <span style="font-size: 11px; color: #10b981; font-weight: 600;">4% Sweet Spot</span>
                                <span style="font-size: 11px; color: #6b7280;">Too Hard (Anxiety)</span>
                            </div>
                            <input type="range" class="challenge-slider" min="1" max="10" value="6" onchange="updateChallengeDisplay(this.value)">
                            <div class="challenge-display">
                                <span id="challenge-text">Slightly challenging (perfect for flow)</span>
                            </div>
                        </div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                            🎯 <strong>Flow Tip:</strong> Sweet spot is 4% beyond your current skill level
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Scope Definition</label>
                        <div class="scope-inputs">
                            <input type="text" class="form-input" placeholder="What exactly needs to be done?" style="margin-bottom: 8px;">
                            <input type="text" class="form-input" placeholder="Why does it need to be done?" style="margin-bottom: 8px;">
                            <input type="text" class="form-input" placeholder="How will I know it's complete?">
                        </div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                            🧩 <strong>Clarity Boost:</strong> Define scope to avoid "Pandora's Box" effect
                        </div>
                    </div>
                </div>
                <div class="form-section">
                    <div class="section-title">Priority & Scheduling</div>
                    
                    <div class="form-group">
                        <label class="form-label">Priority Level</label>
                        <div class="priority-buttons">
                            <button class="priority-btn low" onclick="setPriority('low')">Low</button>
                            <button class="priority-btn medium active" onclick="setPriority('medium')">Medium</button>
                            <button class="priority-btn high" onclick="setPriority('high')">High</button>
                            <button class="priority-btn urgent" onclick="setPriority('urgent')">Urgent</button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="due-date">Due Date</label>
                        <input type="date" id="due-date" class="form-input" value="2025-07-14">
                    </div>
                    
                    <div class="form-group">
                        <div class="section-title" style="margin-bottom: 8px; font-size: 12px;">Minimum Flow Block</div>
                        <div class="time-estimate-group">
                            <div class="time-input">
                                <input type="number" class="form-input" placeholder="2" min="1" max="8" style="text-align: center;">
                                <label class="form-label" style="text-align: center; margin-top: 4px;">Hours</label>
                            </div>
                            <div class="time-input">
                                <input type="number" class="form-input" placeholder="0" min="0" max="59" step="15" style="text-align: center;">
                                <label class="form-label" style="text-align: center; margin-top: 4px;">Minutes</label>
                            </div>
                        </div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                            🌊 <strong>Flow Payoff:</strong> Minimum uninterrupted time needed to make struggle worthwhile
                        </div>
                        <div class="form-label" style="margin-top: 8px; font-size: 12px; color: #6b7280;">Energy Level Required</div>
                        <div class="energy-level">
                            <div class="energy-dot" onclick="setEnergy(1)" title="Low energy"></div>
                            <div class="energy-dot active" onclick="setEnergy(2)" title="Medium energy"></div>
                            <div class="energy-dot" onclick="setEnergy(3)" title="High energy"></div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Engagement Strategy</label>
                        <select class="form-input form-select" onchange="updateEngagementTips(this.value)">
                            <option value="sleep-to-flow">Sleep-to-Flow (Morning, within 60 seconds)</option>
                            <option value="lower-hurdle">Lower the Hurdle (Start with easier version)</option>
                            <option value="time-constraint">Time Constraint (Artificial deadline pressure)</option>
                            <option value="response-inhibition">Response Inhibition (Bypass thinking)</option>
                        </select>
                        <div id="engagement-tip" style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                            ⚡ <strong>Strategy:</strong> Wake up and start this task within 60 seconds, no time to procrastinate
                        </div>
                    </div>
                </div>

                <!-- Progress & Status Section -->
                <div class="form-section">
                    <div class="section-title">Progress & Status</div>
                    
                    <div class="form-group">
                        <label class="form-label">Progress</label>
                        <div class="progress-container">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 0%"></div>
                            </div>
                            <input type="number" class="form-input progress-input" value="0" min="0" max="100" onchange="updateProgress(this.value)">
                            <span style="font-size: 14px; color: #6b7280;">%</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="status-select">Status</label>
                        <select id="status-select" class="form-input form-select">
                            <option value="todo" selected>To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="waiting">Waiting</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                <!-- Organization Section -->
                <div class="form-section">
                    <div class="section-title">Organization</div>
                    
                    <div class="form-group">
                        <label class="form-label" for="tags-input">Tags</label>
                        <div class="tag-input-container">
                            <input type="text" id="tags-input" class="form-input" placeholder="Add tags..." onkeyup="showTagSuggestions(this.value)">
                            <div class="tag-suggestions" id="tag-suggestions" style="display: none;">
                                <div class="tag-suggestion" onclick="addTag('progress-note')">progress-note</div>
                                <div class="tag-suggestion" onclick="addTag('therapy')">therapy</div>
                                <div class="tag-suggestion" onclick="addTag('documentation')">documentation</div>
                                <div class="tag-suggestion" onclick="addTag('compliance')">compliance</div>
                                <div class="tag-suggestion" onclick="addTag('admin')">admin</div>
                            </div>
                        </div>
                        <div class="current-tags">
                            <div class="tag">
                                progress-note
                                <button class="tag-remove" onclick="removeTag(this)">×</button>
                            </div>
                            <div class="tag">
                                therapy
                                <button class="tag-remove" onclick="removeTag(this)">×</button>
                            </div>
                            <div class="tag">
                                documentation
                                <button class="tag-remove" onclick="removeTag(this)">×</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Procrastination Check</label>
                        <div class="procrastination-analysis">
                            <div class="analysis-question">
                                <input type="radio" name="avoid-reason" id="approach-avoidance" value="approach-avoidance">
                                <label for="approach-avoidance">I want to do this but can't bring myself to start</label>
                            </div>
                            <div class="analysis-question">
                                <input type="radio" name="avoid-reason" id="ambivalence" value="ambivalence">
                                <label for="ambivalence">Something feels "off" about this task</label>
                            </div>
                            <div class="analysis-question">
                                <input type="radio" name="avoid-reason" id="ready" value="ready">
                                <label for="ready">I'm ready to engage with this task</label>
                            </div>
                        </div>
                        <div id="procrastination-tip" style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                            🧠 <strong>Self-Awareness:</strong> Distinguish between procrastination and ambivalence
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="dialog-actions">
                <button class="btn btn-danger" onclick="deleteTask()">Delete Task</button>
                <button class="btn btn-secondary" onclick="closeDialog()">Cancel</button>
                <button class="btn btn-primary" onclick="saveTask()">Save Changes</button>
            </div>
        </div>
    </div>

    <script>
        function closeDialog() {
            console.log('Closing dialog...');
        }

        function setPriority(level) {
            document.querySelectorAll('.priority-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`.priority-btn.${level}`).classList.add('active');
        }

        function setEnergy(level) {
            document.querySelectorAll('.energy-dot').forEach((dot, index) => {
                dot.classList.toggle('active', index < level);
            });
        }

        function updateProgress(value) {
            document.querySelector('.progress-fill').style.width = value + '%';
        }

        function showTagSuggestions(value) {
            const suggestions = document.getElementById('tag-suggestions');
            if (value.length > 0) {
                suggestions.style.display = 'block';
            } else {
                suggestions.style.display = 'none';
            }
        }

        function addTag(tagName) {
            const tagsContainer = document.querySelector('.current-tags');
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tagName}
                <button class="tag-remove" onclick="removeTag(this)">×</button>
            `;
            tagsContainer.appendChild(tagElement);
            document.getElementById('tags-input').value = '';
            document.getElementById('tag-suggestions').style.display = 'none';
        }

        function removeTag(button) {
            button.parentElement.remove();
        }

        function updateChallengeDisplay(value) {
            const display = document.getElementById('challenge-text');
            const messages = {
                1: "Way too easy (will cause boredom)",
                2: "Too easy (might lose interest)", 
                3: "Slightly easy (good warm-up)",
                4: "Just right (flow sweet spot!)",
                5: "Perfect challenge (4% stretch)",
                6: "Slightly challenging (perfect for flow)",
                7: "Moderately hard (still manageable)",
                8: "Getting difficult (anxiety risk)",
                9: "Too hard (likely overwhelm)",
                10: "Extremely difficult (will cause anxiety)"
            };
            display.textContent = messages[value];
        }

        function updateEngagementTips(strategy) {
            const tip = document.getElementById('engagement-tip');
            const tips = {
                'sleep-to-flow': '⚡ <strong>Strategy:</strong> Wake up and start this task within 60 seconds, no time to procrastinate',
                'lower-hurdle': '🎯 <strong>Strategy:</strong> Start with the easiest possible version to build momentum',
                'time-constraint': '⏰ <strong>Strategy:</strong> Set artificial deadline pressure to increase challenge level',
                'response-inhibition': '🚀 <strong>Strategy:</strong> Commit to starting before you can think about it'
            };
            tip.innerHTML = tips[strategy];
        }

        function saveTask() {
            console.log('Saving task...');
        }

        function deleteTask() {
            if (confirm('Are you sure you want to delete this task?')) {
                console.log('Deleting task...');
            }
        }

        // Auto-focus title input
        document.getElementById('task-title').focus();
    </script>
</body>
</html>