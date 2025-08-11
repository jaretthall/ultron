
import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences, AIProvider } from '../../../types';
import { AVAILABLE_CLAUDE_MODELS, AVAILABLE_OPENAI_MODELS, APP_VERSION } from '../../constants';
import { useAppState } from '../../contexts/AppStateContext';
import TagManager from '../tags/TagManager';
import { useAppMode } from '../../hooks/useLabels';
import { IdGenerator } from '../../utils/idGeneration';
import { projectsService, tasksService, schedulesService, tagsService, tagCategoriesService, notesService, userPreferencesService } from '../../../services/databaseService';
import { useAuth } from '../../contexts/AuthContext';
import { DEFAULT_QUICK_ACTIONS_PREFERENCES, EventShortcut, DEFAULT_SCHEDULING_PREFERENCES } from '../../types/userPreferences';

const SettingsPage: React.FC = () => {
  const { state, updateUserPreferences } = useAppState();
  const { userPreferences } = state;

  const [activeTab, setActiveTab] = useState('AI Provider');
  const [currentAiProvider, setCurrentAiProvider] = useState<AIProvider>(userPreferences?.ai_provider === 'gemini' ? 'claude' : userPreferences?.ai_provider || 'claude');
  const [currentClaudeApiKey, setCurrentClaudeApiKey] = useState<string>(userPreferences?.claude_api_key || '');
  const [currentSelectedClaudeModel, setCurrentSelectedClaudeModel] = useState<string>(userPreferences?.selected_claude_model || 'claude-3-5-sonnet-20241022');
  const [currentOpenaiApiKey, setCurrentOpenaiApiKey] = useState<string>(userPreferences?.openai_api_key || '');
  const [currentSelectedOpenaiModel, setCurrentSelectedOpenaiModel] = useState<string>(userPreferences?.selected_openai_model || 'gpt-4o');
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [appMode, setAppMode] = useAppMode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportingData, setIsImportingData] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const { user } = useAuth();

  // Preferences state
  const [workingHoursStart, setWorkingHoursStart] = useState(userPreferences?.working_hours_start || '09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState(userPreferences?.working_hours_end || '17:00');
  const [focusBlockDuration, setFocusBlockDuration] = useState(userPreferences?.focus_block_duration || 90);
  const [breakDuration, setBreakDuration] = useState(userPreferences?.break_duration || 15);
  const [priorityWeightDeadline, setPriorityWeightDeadline] = useState(userPreferences?.priority_weight_deadline || 0.4);
  const [priorityWeightEffort, setPriorityWeightEffort] = useState(userPreferences?.priority_weight_effort || 0.3);
  const [priorityWeightDeps, setPriorityWeightDeps] = useState(userPreferences?.priority_weight_deps || 0.3);
  const [contextSwitchBuffer, setContextSwitchBuffer] = useState(userPreferences?.context_switch_buffer_minutes || 10);

  // Integration state
  const [showCalendarImport, setShowCalendarImport] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [appleConnected] = useState(false);
  const [importedEvents, setImportedEvents] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Shortcuts state
  const [eventShortcuts, setEventShortcuts] = useState<EventShortcut[]>(
    userPreferences?.scheduling_preferences?.quickActions?.eventShortcuts || DEFAULT_QUICK_ACTIONS_PREFERENCES.eventShortcuts
  );
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);

  useEffect(() => {
    if (userPreferences) {
      setCurrentAiProvider(userPreferences.ai_provider);
      // Gemini model removed
      setCurrentClaudeApiKey(userPreferences.claude_api_key || '');
      setCurrentSelectedClaudeModel(userPreferences.selected_claude_model || 'claude-3-5-sonnet-20241022');
      setCurrentOpenaiApiKey(userPreferences.openai_api_key || '');
      setCurrentSelectedOpenaiModel(userPreferences.selected_openai_model || 'gpt-4o');
      
      // Update preferences
      setWorkingHoursStart(userPreferences.working_hours_start || '09:00');
      setWorkingHoursEnd(userPreferences.working_hours_end || '17:00');
      setFocusBlockDuration(userPreferences.focus_block_duration || 90);
      setBreakDuration(userPreferences.break_duration || 15);
      setPriorityWeightDeadline(userPreferences.priority_weight_deadline || 0.4);
      setPriorityWeightEffort(userPreferences.priority_weight_effort || 0.3);
      setPriorityWeightDeps(userPreferences.priority_weight_deps || 0.3);
      setContextSwitchBuffer(userPreferences.context_switch_buffer_minutes || 10);
      
      // Update shortcuts state
      setEventShortcuts(userPreferences.scheduling_preferences?.quickActions?.eventShortcuts || DEFAULT_QUICK_ACTIONS_PREFERENCES.eventShortcuts);
    }  
  }, [userPreferences]);


  const tabs = ['AI Provider', 'Preferences', 'Shortcuts', 'Sync', 'Security', 'Integrations', 'Advanced', 'Notes'];

  const handleSaveChanges = () => {
    const updatedPrefs: Partial<UserPreferences> = {
        ai_provider: currentAiProvider,
        claude_api_key: currentClaudeApiKey,
        selected_claude_model: currentSelectedClaudeModel,
        openai_api_key: currentOpenaiApiKey,
        selected_openai_model: currentSelectedOpenaiModel,
    };
    updateUserPreferences(updatedPrefs);
  };

  // Shortcut management functions
  const handleSaveShortcuts = () => {
    const updatedPrefs: Partial<UserPreferences> = {
      scheduling_preferences: {
        ...DEFAULT_SCHEDULING_PREFERENCES,
        ...userPreferences?.scheduling_preferences,
        quickActions: {
          ...DEFAULT_QUICK_ACTIONS_PREFERENCES,
          ...userPreferences?.scheduling_preferences?.quickActions,
          eventShortcuts: eventShortcuts
        }
      }
    };
    updateUserPreferences(updatedPrefs);
    setEditingShortcut(null);
  };

  const handleEditShortcut = (shortcutId: string) => {
    setEditingShortcut(shortcutId);
  };

  const handleDeleteShortcut = (shortcutId: string) => {
    setEventShortcuts(eventShortcuts.filter(s => s.id !== shortcutId));
  };

  const handleAddShortcut = () => {
    const newShortcut: EventShortcut = {
      id: IdGenerator.generateId(),
      name: 'New Shortcut',
      icon: '📅',
      color: 'blue',
      eventTitle: 'New Event',
      eventDuration: 60,
      createTask: false,
      taskPriority: 'MEDIUM',
      taskTags: [],
      isActive: true
    };
    setEventShortcuts([...eventShortcuts, newShortcut]);
    setEditingShortcut(newShortcut.id);
  };

  const handleShortcutChange = (shortcutId: string, field: keyof EventShortcut, value: any) => {
    setEventShortcuts(eventShortcuts.map(shortcut => 
      shortcut.id === shortcutId 
        ? { ...shortcut, [field]: value }
        : shortcut
    ));
  };

  const handleSavePreferences = () => {
    const updatedPrefs: Partial<UserPreferences> = {
      working_hours_start: workingHoursStart,
      working_hours_end: workingHoursEnd,
      focus_block_duration: focusBlockDuration,
      break_duration: breakDuration,
      priority_weight_deadline: priorityWeightDeadline,
      priority_weight_effort: priorityWeightEffort,
      priority_weight_deps: priorityWeightDeps,
      context_switch_buffer_minutes: contextSwitchBuffer,
    };
    updateUserPreferences(updatedPrefs);
  };

  // Simplified calendar integration handlers
  const handleOutlookConnect = () => {
    setShowCalendarImport(true);
  };

  const handleAppleConnect = () => {
    setShowCalendarImport(true);
  };

  const handleFileImport = async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      let events: any[] = [];

      if (file.name.endsWith('.ics')) {
        // Parse ICS file (simplified)
        events = parseICSFile(text);
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV file
        events = parseCSVFile(text);
      }

      setImportedEvents(events);
      setOutlookConnected(true); // Mark as connected for demo
      setShowCalendarImport(false);
      
      // Save events to schedules table (simplified)
      await saveImportedEvents(events);
      
    } catch (error) {
      console.error('Error importing calendar file:', error);
      alert('Error importing calendar file. Please check the format.');
    } finally {
      setIsImporting(false);
    }
  };

  const parseICSFile = (icsText: string) => {
    const events: any[] = [];
    const lines = icsText.split('\n');
    let currentEvent: any = {};

    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (cleanLine === 'END:VEVENT') {
        if (currentEvent.title) {
          events.push({
            title: currentEvent.title,
            start_date: currentEvent.start_date,
            end_date: currentEvent.end_date,
            all_day: false,
            event_type: 'meeting',
            tags: ['imported'],
            imported: true
          });
        }
      } else if (cleanLine.startsWith('SUMMARY:')) {
        currentEvent.title = cleanLine.substring(8);
      } else if (cleanLine.startsWith('DTSTART:')) {
        currentEvent.start_date = parseDateString(cleanLine.substring(8));
      } else if (cleanLine.startsWith('DTEND:')) {
        currentEvent.end_date = parseDateString(cleanLine.substring(6));
      }
    }

    return events;
  };

  const parseCSVFile = (csvText: string) => {
    const lines = csvText.split('\n');
    const events: any[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',');
      if (columns.length >= 3) {
        events.push({
          title: columns[0]?.replace(/"/g, '') || 'Imported Event',
          start_date: columns[1]?.replace(/"/g, '') || new Date().toISOString(),
          end_date: columns[2]?.replace(/"/g, '') || new Date().toISOString(),
          all_day: false,
          event_type: 'meeting',
          tags: ['imported'],
          imported: true
        });
      }
    }

    return events;
  };

  const parseDateString = (dateStr: string) => {
    // Simple date parsing for ICS format (YYYYMMDDTHHMMSSZ)
    if (dateStr.length >= 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const hour = dateStr.substring(9, 11) || '00';
      const minute = dateStr.substring(11, 13) || '00';
      
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`).toISOString();
    }
    return new Date().toISOString();
  };

  const saveImportedEvents = async (events: any[]) => {
    // In a real implementation, this would save to the schedules table
    console.log('Saving imported events:', events);
    // For now, just log the events - in production this would use the database service
  };

  // Ensure date strings are parseable by JS Date: trim fractional seconds to max 3 digits
  const normalizeIsoFraction = (value?: string | null): string | undefined => {
    if (!value || typeof value !== 'string') return value ?? undefined;
    // Replace cases like .0000+00:00 -> .000+00:00 (keep timezone if present)
    return value.replace(/(\.\d{3})\d+/, '$1');
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Fetch all data
      const [projects, tasks, schedules, tags, tagCategories, notes] = await Promise.all([
        projectsService.getAll(),
        tasksService.getAll(),
        schedulesService.getAll(),
        tagsService.getAll(),
        tagCategoriesService.getAll(),
        notesService.getAll(),
      ]);

      const exportData = {
        version: APP_VERSION,
        exportDate: new Date().toISOString(),
        userId: user?.id || 'unknown',
        data: {
          projects,
          tasks,
          schedules,
          tags,
          tagCategories,
          notes,
          userPreferences,
        },
      };

      // Create and download the file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ultron-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImportingData(true);
    setImportProgress('Reading file...');

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate structure
      if (!importData.data || !importData.version) {
        throw new Error('Invalid backup file format');
      }

      const currentUserId = user?.id;
      if (!currentUserId) {
        throw new Error('You must be logged in to import data');
      }

      const { projects, tasks, schedules, tags, tagCategories, notes, userPreferences: importedPrefs } = importData.data;

      // Normalize incoming data to be resilient to older export formats
      const normalizedTasks = Array.isArray(tasks)
        ? tasks.map((t: any) => ({
            ...t,
            due_date: normalizeIsoFraction(t?.due_date) || t?.due_date,
            tags: Array.isArray(t?.tags) ? t.tags : [],
          }))
        : [];

      const normalizedSchedules = Array.isArray(schedules)
        ? schedules.map((s: any) => ({
            ...s,
            start_date: normalizeIsoFraction(s?.start_date) || s?.start_date,
            end_date: normalizeIsoFraction(s?.end_date) || s?.end_date,
            tags: Array.isArray(s?.tags) ? s.tags : [],
          }))
        : [];

      // Generate new IDs to avoid conflicts
      const projectIdMap = new Map<string, string>();
      const taskIdMap = new Map<string, string>();
      const tagIdMap = new Map<string, string>();
      const categoryIdMap = new Map<string, string>();

      // Import tag categories first
      if (tagCategories?.length) {
        setImportProgress('Importing tag categories...');
        for (const category of tagCategories) {
          // Let the service/database assign the ID; then record it
          const createdCategory = await tagCategoriesService.create({
            ...category,
            user_id: currentUserId,
          } as any);
          categoryIdMap.set(category.id, createdCategory.id);
        }
      }

      // Import tags
      if (tags?.length) {
        setImportProgress('Importing tags...');
        for (const tag of tags) {
          const createdTag = await tagsService.create({
            ...tag,
            user_id: currentUserId,
            category_id: tag.category_id ? categoryIdMap.get(tag.category_id) || tag.category_id : null,
          } as any);
          tagIdMap.set(tag.id, createdTag.id);
        }
      }

      // Import projects
      if (projects?.length) {
        setImportProgress('Importing projects...');
        for (const project of projects) {
          // Create and capture the actual DB id, then map original->new
          const createdProject = await projectsService.create({
            ...project,
            user_id: currentUserId,
            tags: project.tags?.map((tagId: string) => tagIdMap.get(tagId) || tagId) || [],
          } as any);
          projectIdMap.set(project.id, createdProject.id);
        }
      }

      // Import tasks
      if (normalizedTasks.length) {
        setImportProgress('Importing tasks...');
        for (const task of normalizedTasks) {
          const newId = IdGenerator.generateTaskId();
          taskIdMap.set(task.id, newId);
          await tasksService.create({
            ...task,
            user_id: currentUserId,
            // Remap to the actual created project id; if not found, null to avoid FK violations
            project_id: task.project_id ? projectIdMap.get(task.project_id) || null : null,
            tags: task.tags?.map((tagId: string) => tagIdMap.get(tagId) || tagId) || [],
          });
        }
      }

      // Import schedules
      if (normalizedSchedules.length) {
        setImportProgress('Importing schedules...');
        for (const schedule of normalizedSchedules) {
          await schedulesService.create({
            ...schedule,
            id: IdGenerator.generateScheduleId(),
            user_id: currentUserId,
            task_id: schedule.task_id ? taskIdMap.get(schedule.task_id) || schedule.task_id : null,
          });
        }
      }

      // Import notes
      if (notes?.length) {
        setImportProgress('Importing notes...');
        for (const note of notes) {
          await notesService.create({
            ...note,
            id: IdGenerator.generateNoteId(),
            user_id: currentUserId,
            project_id: note.project_id ? projectIdMap.get(note.project_id) || note.project_id : null,
            task_id: note.task_id ? taskIdMap.get(note.task_id) || note.task_id : null,
            tags: note.tags?.map((tagId: string) => tagIdMap.get(tagId) || tagId) || [],
          });
        }
      }

      // Update user preferences if provided
      if (importedPrefs) {
        setImportProgress('Importing preferences...');
        // Use upsert to satisfy RLS (inserts for current auth user are allowed by policy)
        await userPreferencesService.upsert(importedPrefs as any);
      }

      setImportProgress('Import completed successfully!');
      setTimeout(() => {
        setImportProgress('');
        window.location.reload(); // Reload to show imported data
      }, 2000);

    } catch (error) {
      console.error('Import failed:', error);
      setImportProgress('');
      const message = error instanceof Error ? error.message : String(error);
      alert(`Failed to import data. ${message}`);
    } finally {
      setIsImportingData(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAppModeChange = (mode: 'business' | 'student') => {
    setAppMode(mode);
  };

  const handleSaveAppMode = () => {
    // Mode is already saved to localStorage via setAppMode
    alert(`App mode changed to ${appMode === 'student' ? 'Student' : 'Business'} mode. The interface will update to reflect this change.`);
    // Optionally trigger a page reload to ensure all components update
    window.location.reload();
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case 'AI Provider':
        return (
          <section className="p-6 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl relative overflow-hidden">
            {/* Glass reflection effects */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>
            
            <div className="relative">
              <h3 className="text-xl font-semibold mb-6 text-white/95">AI Provider Configuration</h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="aiProvider" className="block text-sm font-medium text-white/80 mb-2">Choose AI Provider</label>
                  <select
                    id="aiProvider"
                    value={currentAiProvider}
                    onChange={(e) => setCurrentAiProvider(e.target.value as AIProvider)}
                    className="w-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white rounded-xl p-3 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                >
                  <option value="claude">Anthropic Claude</option>
                  <option value="openai">OpenAI GPT</option>
                </select>
              </div>


              {currentAiProvider === 'claude' && (
                <>
                  <div>
                    <label htmlFor="claudeApiKey" className="block text-sm font-medium text-white/80 mb-2">Anthropic Claude API Key</label>
                    <input
                      type="password"
                      id="claudeApiKey"
                      value={currentClaudeApiKey}
                      onChange={(e) => setCurrentClaudeApiKey(e.target.value)}
                      placeholder="Enter your Claude API Key"
                      className="w-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white placeholder-white/50 rounded-xl p-3 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                      aria-label="Anthropic Claude API Key"
                    />
                    <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-xs text-amber-300 font-medium mb-1">🔐 Security Notice:</p>
                      <ul className="text-xs text-amber-200/80 space-y-1">
                        <li>• API keys are encrypted and stored securely in the database</li>
                        <li>• Keys are never logged or exposed in browser tools</li>
                        <li>• Only you have access to your API keys</li>
                        <li>• Claude integration is experimental and not yet fully functional</li>
                      </ul>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="claudeModel" className="block text-sm font-medium text-white/80 mb-2">Preferred Claude Model</label>
                    <select
                      id="claudeModel"
                      value={currentSelectedClaudeModel}
                      onChange={(e) => setCurrentSelectedClaudeModel(e.target.value)}
                      className="w-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white rounded-xl p-3 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                      disabled={!currentClaudeApiKey}
                    >
                      {AVAILABLE_CLAUDE_MODELS.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                    {!currentClaudeApiKey && <p className="text-xs text-slate-500 mt-1">Model selection disabled until API key is configured.</p>}
                  </div>
                </>
              )}

              {currentAiProvider === 'openai' && (
                <>
                  <div>
                    <label htmlFor="openaiApiKey" className="block text-sm font-medium text-slate-300 mb-1">OpenAI API Key</label>
                    <input
                      type="password"
                      id="openaiApiKey"
                      value={currentOpenaiApiKey}
                      onChange={(e) => setCurrentOpenaiApiKey(e.target.value)}
                      placeholder="Enter your OpenAI API Key"
                      className="w-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white rounded-xl p-3 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                      aria-label="OpenAI API Key"
                    />
                    <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-xs text-amber-300 font-medium mb-1">🔐 Security Notice:</p>
                      <ul className="text-xs text-amber-200/80 space-y-1">
                        <li>• API keys are encrypted and stored securely in the database</li>
                        <li>• Keys are never logged or exposed in browser tools</li>
                        <li>• Only you have access to your API keys</li>
                        <li>• OpenAI integration is experimental and not yet fully functional</li>
                      </ul>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="openaiModel" className="block text-sm font-medium text-slate-300 mb-1">Preferred OpenAI Model</label>
                    <select
                      id="openaiModel"
                      value={currentSelectedOpenaiModel}
                      onChange={(e) => setCurrentSelectedOpenaiModel(e.target.value)}
                      className="w-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white rounded-xl p-3 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                      disabled={!currentOpenaiApiKey}
                    >
                      {AVAILABLE_OPENAI_MODELS.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                    {!currentOpenaiApiKey && <p className="text-xs text-slate-500 mt-1">Model selection disabled until API key is configured.</p>}
                  </div>
                </>
              )}
                 <button
                    onClick={handleSaveChanges}
                    className="mt-6 w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm"
                  >
                    Save AI Preferences
                  </button>
            </div>
            </div>
          </section>
        );
      case 'Preferences':
        return (
          <section className="p-6 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl relative overflow-hidden">
            {/* Glass reflection effects */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>
            <div className="relative">
            <h3 className="text-xl font-semibold mb-6 text-white/95">Application Preferences</h3>
            
            <div className="space-y-6">
              {/* Working Hours */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Working Hours</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="workingHoursStart" className="block text-sm font-medium text-slate-300 mb-1">Start Time</label>
                    <input
                      type="time"
                      id="workingHoursStart"
                      value={workingHoursStart}
                      onChange={(e) => setWorkingHoursStart(e.target.value)}
                      className="w-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white rounded-xl p-3 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="workingHoursEnd" className="block text-sm font-medium text-slate-300 mb-1">End Time</label>
                    <input
                      type="time"
                      id="workingHoursEnd"
                      value={workingHoursEnd}
                      onChange={(e) => setWorkingHoursEnd(e.target.value)}
                      className="w-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white rounded-xl p-3 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Focus & Break Settings */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Focus & Break Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="focusBlockDuration" className="block text-sm font-medium text-slate-300 mb-1">Focus Block Duration (minutes)</label>
                    <input
                      type="number"
                      id="focusBlockDuration"
                      value={focusBlockDuration}
                      onChange={(e) => setFocusBlockDuration(Number(e.target.value))}
                      min="15"
                      max="240"
                      className="w-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white rounded-xl p-3 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="breakDuration" className="block text-sm font-medium text-slate-300 mb-1">Break Duration (minutes)</label>
                    <input
                      type="number"
                      id="breakDuration"
                      value={breakDuration}
                      onChange={(e) => setBreakDuration(Number(e.target.value))}
                      min="5"
                      max="60"
                      className="w-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white rounded-xl p-3 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Priority Weights */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Priority Calculation Weights</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="priorityWeightDeadline" className="block text-sm font-medium text-slate-300 mb-1">
                      Deadline Weight: {priorityWeightDeadline.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      id="priorityWeightDeadline"
                      min="0"
                      max="1"
                      step="0.1"
                      value={priorityWeightDeadline}
                      onChange={(e) => setPriorityWeightDeadline(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="priorityWeightEffort" className="block text-sm font-medium text-slate-300 mb-1">
                      Effort Weight: {priorityWeightEffort.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      id="priorityWeightEffort"
                      min="0"
                      max="1"
                      step="0.1"
                      value={priorityWeightEffort}
                      onChange={(e) => setPriorityWeightEffort(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="priorityWeightDeps" className="block text-sm font-medium text-slate-300 mb-1">
                      Dependencies Weight: {priorityWeightDeps.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      id="priorityWeightDeps"
                      min="0"
                      max="1"
                      step="0.1"
                      value={priorityWeightDeps}
                      onChange={(e) => setPriorityWeightDeps(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  These weights determine how task priorities are calculated. Total should equal 1.0.
                </p>
              </div>

              {/* Context Switching */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Context Switching</h4>
                <div>
                  <label htmlFor="contextSwitchBuffer" className="block text-sm font-medium text-slate-300 mb-1">
                    Buffer Time Between Different Task Types (minutes)
                  </label>
                  <input
                    type="number"
                    id="contextSwitchBuffer"
                    value={contextSwitchBuffer}
                    onChange={(e) => setContextSwitchBuffer(Number(e.target.value))}
                    min="0"
                    max="60"
                    className="w-full bg-white/[0.08] backdrop-blur-md border border-white/[0.12] text-white rounded-xl p-3 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Time buffer automatically added when switching between business and personal tasks.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSavePreferences}
                className="mt-6 w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm"
              >
                Save Preferences
              </button>
            </div>
            </div>
          </section>
        );
      case 'Shortcuts':
        return (
          <section className="p-6 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl relative overflow-hidden">
            {/* Glass reflection effects */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>

            <div className="relative">
              <h3 className="text-xl font-semibold mb-6 text-white/95">Event Shortcuts</h3>
              
              <div className="space-y-6">
                <p className="text-sm text-white/70">
                  Create customizable shortcuts for quickly adding events to your calendar. These shortcuts appear as buttons in the calendar view and can automatically create accompanying tasks.
                </p>

                <div className="grid gap-4">
                  {eventShortcuts.map((shortcut) => (
                    <div key={shortcut.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/8 transition-colors">
                      {editingShortcut === shortcut.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name and Icon */}
                            <div>
                              <label className="block text-sm font-medium text-white/70 mb-2">Name</label>
                              <input
                                type="text"
                                value={shortcut.name}
                                onChange={(e) => handleShortcutChange(shortcut.id, 'name', e.target.value)}
                                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-white/70 mb-2">Icon (emoji)</label>
                              <input
                                type="text"
                                value={shortcut.icon}
                                onChange={(e) => handleShortcutChange(shortcut.id, 'icon', e.target.value)}
                                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                                placeholder="📅"
                              />
                            </div>

                            {/* Event Title and Duration */}
                            <div>
                              <label className="block text-sm font-medium text-white/70 mb-2">Event Title</label>
                              <input
                                type="text"
                                value={shortcut.eventTitle}
                                onChange={(e) => handleShortcutChange(shortcut.id, 'eventTitle', e.target.value)}
                                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-white/70 mb-2">Duration (minutes)</label>
                              <input
                                type="number"
                                value={shortcut.eventDuration}
                                onChange={(e) => handleShortcutChange(shortcut.id, 'eventDuration', parseInt(e.target.value))}
                                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                                min="1"
                              />
                            </div>

                            {/* Color */}
                            <div>
                              <label className="block text-sm font-medium text-white/70 mb-2">Color Theme</label>
                              <select
                                value={shortcut.color}
                                onChange={(e) => handleShortcutChange(shortcut.id, 'color', e.target.value)}
                                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                              >
                                <option value="blue">Blue</option>
                                <option value="teal">Teal</option>
                                <option value="slate">Slate</option>
                                <option value="emerald">Emerald</option>
                                <option value="purple">Purple</option>
                                <option value="amber">Amber</option>
                                <option value="red">Red</option>
                              </select>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={`active-${shortcut.id}`}
                                checked={shortcut.isActive}
                                onChange={(e) => handleShortcutChange(shortcut.id, 'isActive', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/20 rounded bg-white/10"
                              />
                              <label htmlFor={`active-${shortcut.id}`} className="text-sm font-medium text-white/70">
                                Active
                              </label>
                            </div>
                          </div>

                          {/* Task Creation Settings */}
                          <div className="border-t border-white/10 pt-4">
                            <div className="flex items-center space-x-3 mb-4">
                              <input
                                type="checkbox"
                                id={`create-task-${shortcut.id}`}
                                checked={shortcut.createTask}
                                onChange={(e) => handleShortcutChange(shortcut.id, 'createTask', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-white/20 rounded bg-white/10"
                              />
                              <label htmlFor={`create-task-${shortcut.id}`} className="text-sm font-medium text-white/70">
                                Create accompanying task
                              </label>
                            </div>

                            {shortcut.createTask && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
                                <div>
                                  <label className="block text-sm font-medium text-white/70 mb-2">Task Title</label>
                                  <input
                                    type="text"
                                    value={shortcut.taskTitle || ''}
                                    onChange={(e) => handleShortcutChange(shortcut.id, 'taskTitle', e.target.value)}
                                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                                    placeholder="Task title (use {clientName} for placeholders)"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-white/70 mb-2">Priority</label>
                                  <select
                                    value={shortcut.taskPriority}
                                    onChange={(e) => handleShortcutChange(shortcut.id, 'taskPriority', e.target.value)}
                                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                                  >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                  </select>
                                </div>

                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-white/70 mb-2">Tags (comma-separated)</label>
                                  <input
                                    type="text"
                                    value={shortcut.taskTags.join(', ')}
                                    onChange={(e) => handleShortcutChange(shortcut.id, 'taskTags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                                    className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                                    placeholder="progress-note, therapy, documentation"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Edit Actions */}
                          <div className="flex gap-2 pt-4 border-t border-white/10">
                            <button
                              onClick={handleSaveShortcuts}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingShortcut(null)}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/90 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Display Mode
                        <div className="flex items-start gap-4">
                          {/* Icon and Color */}
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{shortcut.icon}</span>
                            <div className={`w-4 h-4 rounded-full bg-${shortcut.color}-500/50 border border-${shortcut.color}-500/70`}></div>
                          </div>

                          {/* Shortcut Details */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-white/90">{shortcut.name}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${shortcut.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-400'}`}>
                                {shortcut.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            
                            <div className="text-sm text-white/60 space-y-1">
                              <p><span className="text-white/80">Event:</span> {shortcut.eventTitle} ({shortcut.eventDuration} min)</p>
                              {shortcut.createTask && (
                                <p><span className="text-white/80">Creates task:</span> {shortcut.taskTitle} ({shortcut.taskPriority} priority)</p>
                              )}
                              {shortcut.taskTags.length > 0 && (
                                <p><span className="text-white/80">Tags:</span> {shortcut.taskTags.join(', ')}</p>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditShortcut(shortcut.id)}
                              className="p-2 text-white/60 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                              title="Edit shortcut"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteShortcut(shortcut.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete shortcut"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add New Shortcut */}
                <button
                  onClick={handleAddShortcut}
                  className="w-full p-4 border-2 border-dashed border-white/20 hover:border-white/30 rounded-xl text-white/60 hover:text-white/80 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add New Shortcut</span>
                </button>
                
                {/* Save Changes Button */}
                {(editingShortcut || eventShortcuts.length !== DEFAULT_QUICK_ACTIONS_PREFERENCES.eventShortcuts.length) && (
                  <button
                    onClick={handleSaveShortcuts}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
                  >
                    Save All Shortcuts
                  </button>
                )}

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <h4 className="font-medium text-blue-300 mb-2">💡 How Shortcuts Work</h4>
                  <ul className="text-sm text-blue-200/80 space-y-1">
                    <li>• Shortcuts appear as buttons in your calendar view</li>
                    <li>• Click a shortcut to instantly create an event at the current date/time</li>
                    <li>• Optionally create accompanying tasks with custom priorities and tags</li>
                    <li>• Perfect for recurring activities like meetings, counseling sessions, or focus blocks</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        );
      case 'Sync':
         return (
          <div>
            <section className="mb-8 p-6 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl relative overflow-hidden">
            {/* Glass reflection effects */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>
            <div className="relative">
              <h3 className="text-xl font-semibold mb-6 text-white/95">Data Synchronization</h3>
              
              <div className="space-y-6">
                {/* Sync Status */}
                <div>
                  <h4 className="text-lg font-medium text-slate-200 mb-4">Sync Status</h4>
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 mb-1">✓</div>
                        <div className="text-slate-400">Database Connected</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 mb-1">0</div>
                        <div className="text-slate-400">Pending Changes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400 mb-1">Real-time</div>
                        <div className="text-slate-400">Sync Mode</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400 mb-1">{new Date().toLocaleString()}</div>
                        <div className="text-slate-400">Last Sync</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sync Settings */}
                <div>
                  <h4 className="text-lg font-medium text-slate-200 mb-4">Sync Configuration</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-white/90">Real-time Sync</h5>
                        <p className="text-xs text-slate-400">Automatically sync changes as they happen</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-white/90">Offline Mode</h5>
                        <p className="text-xs text-slate-400">Allow app to work without internet connection</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-white/90">Conflict Resolution</h5>
                        <p className="text-xs text-slate-400">How to handle data conflicts during sync</p>
                      </div>
                      <select className="bg-slate-600 border-slate-500 text-slate-100 rounded-md px-3 py-1 text-sm">
                        <option value="ask">Ask me</option>
                        <option value="client">Client wins</option>
                        <option value="server">Server wins</option>
                        <option value="newest">Newest wins</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Manual Sync Actions */}
                <div>
                  <h4 className="text-lg font-medium text-slate-200 mb-4">Manual Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="px-4 py-2 bg-sky-500/80 hover:bg-sky-500 backdrop-blur-md border border-sky-500/30 text-white text-sm font-medium rounded-xl transition-all hover:shadow-sky-500/25 shadow-lg">
                      Force Full Sync
                    </button>
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors">
                      Validate Data Integrity
                    </button>
                    <button className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-md transition-colors">
                      Clear Sync Cache
                    </button>
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors">
                      Reset Sync Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </section>

            <section className="mb-8 p-6 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl relative overflow-hidden">
            {/* Glass reflection effects */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>
            <div className="relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-100">Tag & Category Management</h3>
                    <button 
                      onClick={() => setIsTagManagerOpen(true)}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Manage Tags & Categories
                    </button>
                </div>
                <div className="space-y-3">
                  <p className="text-slate-400">
                    Organize your projects and tasks with a comprehensive tagging system. 
                    Create categories, manage tags, and analyze usage patterns.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-3">
                      <h4 className="font-medium text-white/90 mb-2">Create & Edit Tags</h4>
                      <p className="text-slate-400">Add custom tags with colors and categories</p>
                    </div>
                    <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-3">
                      <h4 className="font-medium text-white/90 mb-2">Tag Analytics</h4>
                      <p className="text-slate-400">View usage statistics and cleanup suggestions</p>
                    </div>
                    <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-3">
                      <h4 className="font-medium text-white/90 mb-2">Category Organization</h4>
                      <p className="text-slate-400">Group tags into meaningful categories</p>
                    </div>
                  </div>
                </div>
            </div>
            </section>
          </div>
        );
      case 'Security':
        return (
          <section className="p-6 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl relative overflow-hidden">
            {/* Glass reflection effects */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>
            <div className="relative">
            <h3 className="text-xl font-semibold mb-6 text-white/95">Security & Privacy</h3>
            
            <div className="space-y-6">
              {/* API Key Management */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">API Key Management</h4>
                <div className="space-y-4">
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-medium text-slate-100">Claude API Key</h5>
                        <p className="text-sm text-slate-400">Used for AI-powered insights and recommendations</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${currentClaudeApiKey ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {currentClaudeApiKey ? 'Active' : 'Not Set'}
                      </span>
                    </div>
                    {currentClaudeApiKey && (
                      <div className="text-sm text-slate-300">
                        Key: •••••••••••••••• (configured)
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-medium text-slate-100">OpenAI API Key</h5>
                        <p className="text-sm text-slate-400">Alternative AI provider for insights</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${currentOpenaiApiKey ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {currentOpenaiApiKey ? 'Active' : 'Not Set'}
                      </span>
                    </div>
                    {currentOpenaiApiKey && (
                      <div className="text-sm text-slate-300">
                        Key: ••••••••••••{currentOpenaiApiKey.slice(-4)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Session Management */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Session Management</h4>
                <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Current Session</span>
                    <span className="text-sm text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Session Started</span>
                    <span className="text-sm text-slate-400">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Auto-logout</span>
                    <span className="text-sm text-slate-400">24 hours</span>
                  </div>
                  <button className="w-full mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors">
                    End All Sessions
                  </button>
                </div>
              </div>

              {/* Privacy Controls */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Privacy Controls</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Analytics Collection</h5>
                      <p className="text-xs text-slate-400">Help improve the app by sharing usage analytics</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Error Reporting</h5>
                      <p className="text-xs text-slate-400">Automatically send crash reports to help fix bugs</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Data Security */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Data Security</h4>
                <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Data Encryption</span>
                    <span className="text-sm text-green-400">AES-256 Enabled</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Database Security</span>
                    <span className="text-sm text-green-400">Row-Level Security Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">API Transport</span>
                    <span className="text-sm text-green-400">TLS 1.3</span>
                  </div>
                </div>
              </div>

              {/* Data Management moved to Advanced tab */}
            </div>
            </div>
          </section>
        );
      case 'Integrations':
        return (
          <section className="p-6 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl relative overflow-hidden">
            {/* Glass reflection effects */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>
            <div className="relative">
            <h3 className="text-xl font-semibold mb-6 text-white/95">External Integrations</h3>
            
            <div className="space-y-6">
              {/* Calendar Integrations */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Calendar Integrations</h4>
                <div className="space-y-4">
                  {/* Outlook Calendar */}
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 0v12h12V4H4z"/>
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-medium text-slate-100">Microsoft Outlook</h5>
                          <p className="text-sm text-slate-400">Import your Outlook calendar events</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${outlookConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {outlookConnected ? `Connected (${importedEvents.length} events)` : 'Not Connected'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm text-slate-300">
                        <p className="mb-2">Features:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-400">
                          <li>Import events and meetings from .ics or .csv files</li>
                          <li>Events become visible in your calendar view</li>
                          <li>AI can analyze schedule conflicts and patterns</li>
                          <li>Helps with workload planning and focus blocks</li>
                        </ul>
                      </div>
                      <button 
                        onClick={handleOutlookConnect}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                      >
                        {outlookConnected ? 'Import More Events' : 'Import Outlook Calendar'}
                      </button>
                    </div>
                  </div>

                  {/* Apple Calendar */}
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1z"/>
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-medium text-slate-100">Apple Calendar</h5>
                          <p className="text-sm text-slate-400">Import your Apple Calendar events</p>
                        </div>
                      </div>
                      
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm text-slate-300">
                        <p className="mb-2">Features:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-400">
                          <li>Import events from exported .ics files</li>
                          <li>Support for multiple calendar imports</li>
                          <li>Automatic timezone handling</li>
                          <li>Events integrated into AI planning</li>
                        </ul>
                      </div>
                      <button 
                        onClick={handleAppleConnect}
                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
                      >
                        {appleConnected ? 'Import More Events' : 'Import Apple Calendar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cloud Storage Integrations */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Cloud Storage & Backup</h4>
                <div className="space-y-4">
                  {/* OneDrive */}
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                          </svg>
                        </div>
                        <div>
                          <h5 className="font-medium text-slate-100">Microsoft OneDrive</h5>
                          <p className="text-sm text-slate-400">Backup your data to OneDrive</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-red-900 text-red-300">
                        Not Connected
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm text-slate-300">
                        <p className="mb-2">Features:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-400">
                          <li>Automatic daily backups</li>
                          <li>Document and file storage</li>
                          <li>Version history and recovery</li>
                          <li>Encrypted backup storage</li>
                        </ul>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 backdrop-blur-md border border-blue-500/30 text-white text-sm font-medium rounded-xl transition-all hover:shadow-blue-500/25 shadow-lg">
                          Connect OneDrive
                        </button>
                        <button className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-md transition-colors">
                          Backup Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Integration Status */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Integration Status</h4>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">{(outlookConnected ? 1 : 0) + (appleConnected ? 1 : 0)}</div>
                      <div className="text-slate-400">Active Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">0</div>
                      <div className="text-slate-400">Import Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-1">{importedEvents.length > 0 ? new Date().toLocaleDateString() : 'Never'}</div>
                      <div className="text-slate-400">Last Import</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Integration Settings */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Advanced Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Auto-sync Frequency</h5>
                      <p className="text-xs text-slate-400">How often to sync with external services</p>
                    </div>
                    <select className="bg-slate-600 border-slate-500 text-slate-100 rounded-md px-3 py-1 text-sm">
                      <option value="realtime">Real-time</option>
                      <option value="5min">Every 5 minutes</option>
                      <option value="15min">Every 15 minutes</option>
                      <option value="1hour">Every hour</option>
                      <option value="manual">Manual only</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Conflict Resolution</h5>
                      <p className="text-xs text-slate-400">How to handle sync conflicts</p>
                    </div>
                    <select className="bg-slate-600 border-slate-500 text-slate-100 rounded-md px-3 py-1 text-sm">
                      <option value="ask">Ask me</option>
                      <option value="ultron">Ultron wins</option>
                      <option value="external">External wins</option>
                      <option value="newest">Newest wins</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Backup Encryption</h5>
                      <p className="text-xs text-slate-400">Encrypt backups before uploading</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </section>
        );
      case 'Notes':
        return (
          <section className="p-6 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl relative overflow-hidden">
            {/* Glass reflection effects */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>
            <div className="relative">
            <h3 className="text-xl font-semibold mb-6 text-white/95">Notes & Documentation</h3>
            
            <div className="space-y-6">
              {/* Notes Management */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Note Management</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Auto-save Notes</h5>
                      <p className="text-xs text-slate-400">Automatically save notes as you type</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Version History</h5>
                      <p className="text-xs text-slate-400">Keep track of note changes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Default Note Format</h5>
                      <p className="text-xs text-slate-400">Choose your preferred note format</p>
                    </div>
                    <select className="bg-slate-600 border-slate-500 text-slate-100 rounded-md px-3 py-1 text-sm">
                      <option value="markdown">Markdown</option>
                      <option value="plain">Plain Text</option>
                      <option value="rich">Rich Text</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Note Templates */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Note Templates</h4>
                <div className="space-y-3">
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4">
                    <h5 className="font-medium text-slate-100 mb-2">Available Templates</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-600 p-3 rounded">
                        <h6 className="font-medium text-slate-100">Meeting Notes</h6>
                        <p className="text-xs text-slate-400">Structured template for meeting documentation</p>
                      </div>
                      <div className="bg-slate-600 p-3 rounded">
                        <h6 className="font-medium text-slate-100">Project Summary</h6>
                        <p className="text-xs text-slate-400">Template for project documentation</p>
                      </div>
                      <div className="bg-slate-600 p-3 rounded">
                        <h6 className="font-medium text-slate-100">Daily Journal</h6>
                        <p className="text-xs text-slate-400">Personal daily reflection template</p>
                      </div>
                      <div className="bg-slate-600 p-3 rounded">
                        <h6 className="font-medium text-slate-100">Task Planning</h6>
                        <p className="text-xs text-slate-400">Template for task breakdown and planning</p>
                      </div>
                    </div>
                    <button className="mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md transition-colors">
                      Create Custom Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Note Organization */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Organization</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Auto-link to Projects</h5>
                      <p className="text-xs text-slate-400">Automatically link notes to related projects</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Smart Tagging</h5>
                      <p className="text-xs text-slate-400">Automatically suggest tags based on content</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Archive Old Notes</h5>
                      <p className="text-xs text-slate-400">How long to keep notes before archiving</p>
                    </div>
                    <select className="bg-slate-600 border-slate-500 text-slate-100 rounded-md px-3 py-1 text-sm">
                      <option value="never">Never</option>
                      <option value="6months">6 Months</option>
                      <option value="1year">1 Year</option>
                      <option value="2years">2 Years</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Note Search & Discovery */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Search & Discovery</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Full-text Search</h5>
                      <p className="text-xs text-slate-400">Enable searching within note content</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">AI-powered Summaries</h5>
                      <p className="text-xs text-slate-400">Generate automatic summaries of long notes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Note Statistics */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Note Statistics</h4>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-1">0</div>
                      <div className="text-slate-400">Total Notes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">0</div>
                      <div className="text-slate-400">This Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-1">0</div>
                      <div className="text-slate-400">Templates Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">0</div>
                      <div className="text-slate-400">Avg. Words/Note</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </section>
        );
      case 'Advanced':
        return (
          <section className="p-6 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl relative overflow-hidden">
            {/* Glass reflection effects */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>
            <div className="relative">
            <h3 className="text-xl font-semibold mb-6 text-white/95">Advanced Settings</h3>
            
            <div className="space-y-6">
              {/* Data Backup and Restore */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Data Backup & Restore</h4>
                <div className="space-y-4">
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4">
                    <h5 className="font-medium text-slate-100 mb-2">Export Data</h5>
                    <p className="text-sm text-slate-400 mb-3">Download all your data as a JSON file for backup or migration</p>
                    <button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      {isExporting ? 'Exporting...' : 'Export All Data'}
                    </button>
                  </div>
                  
                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4">
                    <h5 className="font-medium text-slate-100 mb-2">Import Data</h5>
                    <p className="text-sm text-slate-400 mb-3">Restore data from a previously exported JSON file</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImportingData}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-sm font-medium rounded-md transition-colors"
                    >
                      {isImportingData ? `Importing... ${importProgress}` : 'Import Data'}
                    </button>
                    {importProgress && (
                      <p className="text-sm text-slate-300 mt-2">{importProgress}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* App Mode Toggle */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">App Mode</h4>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-sm text-slate-400 mb-4">Choose the terminology that best fits your use case</p>
                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="appMode"
                        value="business"
                        checked={appMode === 'business'}
                        onChange={() => handleAppModeChange('business')}
                        className="mr-3 text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <span className="text-slate-100 font-medium">Business Mode</span>
                        <p className="text-xs text-slate-400">Projects, Tasks, Counseling visible</p>
                      </div>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="appMode"
                        value="student"
                        checked={appMode === 'student'}
                        onChange={() => handleAppModeChange('student')}
                        className="mr-3 text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <span className="text-slate-100 font-medium">Student Mode</span>
                        <p className="text-xs text-slate-400">Classes, Assignments, Counseling hidden</p>
                      </div>
                    </label>
                  </div>
                  <button
                    onClick={handleSaveAppMode}
                    className="mt-4 w-full px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    Apply Mode Change
                  </button>
                </div>
              </div>

              {/* Performance Settings */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Performance & Optimization</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Enable Hardware Acceleration</h5>
                      <p className="text-xs text-slate-400">Use GPU acceleration for better performance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Cache Duration</h5>
                      <p className="text-xs text-slate-400">How long to keep data in cache</p>
                    </div>
                    <select className="bg-slate-600 border-slate-500 text-slate-100 rounded-md px-3 py-1 text-sm">
                      <option value="1hour">1 Hour</option>
                      <option value="6hours">6 Hours</option>
                      <option value="1day">1 Day</option>
                      <option value="1week">1 Week</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Preload Data</h5>
                      <p className="text-xs text-slate-400">Preload upcoming tasks and projects</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Developer Settings */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Developer Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Debug Mode</h5>
                      <p className="text-xs text-slate-400">Enable debug logging and console output</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">API Response Time Logging</h5>
                      <p className="text-xs text-slate-400">Log API response times for debugging</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Experimental Features</h5>
                      <p className="text-xs text-slate-400">Enable beta features and experiments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">Data Management</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Data Retention Policy</h5>
                      <p className="text-xs text-slate-400">How long to keep deleted items</p>
                    </div>
                    <select className="bg-slate-600 border-slate-500 text-slate-100 rounded-md px-3 py-1 text-sm">
                      <option value="immediate">Delete Immediately</option>
                      <option value="7days">7 Days</option>
                      <option value="30days">30 Days</option>
                      <option value="90days">90 Days</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Compress Old Data</h5>
                      <p className="text-xs text-slate-400">Automatically compress old projects and tasks</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>

                  <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4">
                    <h5 className="font-medium text-slate-100 mb-2">Database Maintenance</h5>
                    <p className="text-sm text-slate-400 mb-3">Clean up and optimize database performance</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors">
                        Optimize Database
                      </button>
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors">
                        Clean Orphaned Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Configuration */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">AI Configuration</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">AI Response Timeout</h5>
                      <p className="text-xs text-slate-400">Maximum time to wait for AI responses</p>
                    </div>
                    <select className="bg-slate-600 border-slate-500 text-slate-100 rounded-md px-3 py-1 text-sm">
                      <option value="10">10 seconds</option>
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="120">2 minutes</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">Context Window Size</h5>
                      <p className="text-xs text-slate-400">Amount of context to send to AI models</p>
                    </div>
                    <select className="bg-slate-600 border-slate-500 text-slate-100 rounded-md px-3 py-1 text-sm">
                      <option value="small">Small (4k tokens)</option>
                      <option value="medium">Medium (8k tokens)</option>
                      <option value="large">Large (16k tokens)</option>
                      <option value="xlarge">Extra Large (32k tokens)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-medium text-slate-100">AI Fallback Chain</h5>
                      <p className="text-xs text-slate-400">Try alternative AI providers if primary fails</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div>
                <h4 className="text-lg font-medium text-slate-200 mb-4">System Information</h4>
                <div className="bg-white/[0.08] backdrop-blur-md border border-white/[0.10] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">Application Version</span>
                    <span className="text-slate-400">{APP_VERSION}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">Database Version</span>
                    <span className="text-slate-400">PostgreSQL 15.2</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">Build Environment</span>
                    <span className="text-slate-400">Production</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">Last Update</span>
                    <span className="text-slate-400">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div>
                <h4 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h4>
                <div className="bg-red-900/20 border border-red-700 p-4 rounded-lg space-y-3">
                  <div className="text-sm text-red-300 mb-3">
                    These actions are irreversible. Please proceed with caution.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors">
                      Reset All Settings
                    </button>
                    <button className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium rounded-md transition-colors">
                      Factory Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </section>
        );
      default:
        return (
            <section className="p-6 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl relative overflow-hidden">
            {/* Glass reflection effects */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>
            <div className="relative">
                <h3 className="text-xl font-semibold mb-4 text-slate-100">{activeTab} Settings</h3>
                <p className="text-slate-400">Configuration for {activeTab} is under development.</p>
            </div>
            </section>
        );
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto text-white">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/70 mt-1">Manage your account and application preferences.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="md:w-1/5 shrink-0" aria-label="Settings Tabs">
          <div className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.25)] rounded-2xl p-4 relative overflow-hidden">
            {/* Glass reflection effects */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>
            
            <div className="relative space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                    ${activeTab === tab 
                      ? 'bg-white/[0.12] text-white shadow-lg border border-white/[0.18]' 
                      : 'text-white/70 hover:bg-white/[0.08] hover:text-white/90 hover:border-white/[0.12] border border-transparent'}`}
                  aria-current={activeTab === tab ? 'page' : undefined}
                >
                  {/* Active tab glow effect */}
                  {activeTab === tab && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 via-sky-500/5 to-slate-400/5 opacity-100"></div>
                  )}
                  <span className="relative">{tab}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>

      {/* Tag Manager Modal */}
      {isTagManagerOpen && (
        <TagManager onClose={() => setIsTagManagerOpen(false)} />
      )}

      {/* Calendar Import Modal */}
      {showCalendarImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-2xl w-full max-w-md mx-4 p-6 relative overflow-hidden">
            {/* Glass reflection effects */}
            <div className="absolute inset-0 rounded-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-transparent to-transparent"></div>
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Import Calendar Events</h3>
              <button
                onClick={() => setShowCalendarImport(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                <h4 className="font-medium text-blue-300 mb-2">How to Export Your Calendar</h4>
                <div className="text-sm text-slate-300 space-y-2">
                  <p><strong>Outlook:</strong> Go to File → Save Calendar → Save as .ics file</p>
                  <p><strong>Apple Calendar:</strong> File → Export → Export as .ics file</p>
                  <p><strong>Google Calendar:</strong> Settings → Import & Export → Export (creates .ics files)</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-slate-300 mb-2">Drop your calendar file here</p>
                <p className="text-sm text-slate-400 mb-4">Supports .ics and .csv files</p>
                <input
                  type="file"
                  accept=".ics,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileImport(file);
                  }}
                  className="hidden"
                  id="calendar-file-input"
                />
                <label
                  htmlFor="calendar-file-input"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>

              {isImporting && (
                <div className="flex items-center justify-center space-x-2 text-blue-400">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Importing calendar events...</span>
                </div>
              )}

              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
                <p className="text-sm text-yellow-300">
                  <strong>Note:</strong> Events are imported read-only for AI analysis and calendar visibility. This helps with scheduling conflicts and workload planning without complicating your main calendar.
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowCalendarImport(false)}
                className="px-4 py-2 text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
