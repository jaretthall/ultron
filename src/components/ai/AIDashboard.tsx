import React, { useState, useEffect } from 'react';
// Using inline SVG icons to match application pattern
import { useAppState } from '../../contexts/AppStateContext';
import { generateAIInsights, generateAIDailyPlan, generateAIWorkloadAnalysis, checkAIProviderHealth, AIServiceResult, AIInsights, DailyPlan, WorkloadAnalysis } from '../../services/aiService';

// Icon components as inline SVGs
const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25m3 2.25H3.75m16.5 0v11.25A2.25 2.25 0 0119.5 21H4.5a2.25 2.25 0 01-2.25-2.25V8.25m16.5 0V6a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 6v2.25" />
  </svg>
);

const BarChart3Icon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const BrainIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const AlertTriangleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// const ZapIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
//     <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
//   </svg>
// );

const TrendingUpIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 010 0L21.75 9M21.75 9l-3.75 3.75M21.75 9v3.75" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AIDashboard: React.FC = () => {
  const { state } = useAppState();
  const { projects, tasks, userPreferences } = state;
  const [insights, setInsights] = useState<AIServiceResult<AIInsights> | null>(null);
  const [dailyPlan, setDailyPlan] = useState<AIServiceResult<DailyPlan> | null>(null);
  const [workloadAnalysis, setWorkloadAnalysis] = useState<AIServiceResult<WorkloadAnalysis> | null>(null);
  const [providerHealth, setProviderHealth] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'planning' | 'workload' | 'health'>('insights');

  // Load AI data on component mount and when dependencies change
  useEffect(() => {
    if (userPreferences) {
      loadAIData();
    }
  }, [projects, tasks, userPreferences?.ai_provider]);

  const loadAIData = async () => {
    if (!userPreferences) {
      console.log('User preferences not loaded yet, skipping AI data load');
      return;
    }

    setIsLoading(true);
    
    try {
      // Load provider health first
      const health = await checkAIProviderHealth(userPreferences);
      setProviderHealth(health);

      // Only proceed if we have at least one provider available
      if (health.fallback_available || health.providers[health.primary_provider]?.available) {
        // Load insights
        const insightsResult = await generateAIInsights(projects, tasks, userPreferences);
        setInsights(insightsResult);

        // Load daily plan for selected date
        const planResult = await generateAIDailyPlan(selectedDate, projects, tasks, userPreferences);
        setDailyPlan(planResult);

        // Load workload analysis
        const workloadResult = await generateAIWorkloadAnalysis(projects, tasks, userPreferences);
        setWorkloadAnalysis(workloadResult);
      }
    } catch (error) {
      console.error('Error loading AI data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAIData = async () => {
    console.log('Refresh button clicked - reloading AI data...');
    setIsLoading(true);
    try {
      await loadAIData();
      console.log('AI data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing AI data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewDailyPlan = async () => {
    if (!userPreferences || !providerHealth?.fallback_available) return;
    
    setIsLoading(true);
    try {
      const planResult = await generateAIDailyPlan(selectedDate, projects, tasks, userPreferences);
      setDailyPlan(planResult);
    } catch (error) {
      console.error('Error generating daily plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const ProviderHealthIndicator: React.FC<{ provider: string; health: any }> = ({ provider, health }) => (
    <div className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
      <div className="flex items-center space-x-1">
        {health.available ? (
          <CheckCircleIcon className="w-4 h-4 text-green-500" />
        ) : (
          <XCircleIcon className="w-4 h-4 text-red-500" />
        )}
        <span className="text-sm font-medium capitalize text-gray-800">{provider}</span>
      </div>
      <span className="text-xs text-gray-700">
        {health.configured ? (health.available ? 'Ready' : 'Error') : 'Not configured'}
      </span>
    </div>
  );

  const InsightsPanel: React.FC = () => (
    <div className="space-y-6">
      {insights?.success ? (
        <>
          {/* Blocked Tasks */}
          {insights.data.blocked_tasks.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangleIcon className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-800">Blocked Tasks</h3>
              </div>
              <div className="space-y-2">
                {insights.data.blocked_tasks.map((task, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <p className="text-sm text-gray-800 mt-1">{task.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Needing Attention */}
          {insights.data.projects_needing_attention.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUpIcon className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-yellow-800">Projects Needing Attention</h3>
              </div>
              <div className="space-y-2">
                {insights.data.projects_needing_attention.map((project, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-900">{project.title}</h4>
                    <p className="text-sm text-gray-800 mt-1">{project.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <BrainIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">AI Recommendations</h3>
            </div>
            <ul className="space-y-2">
              {insights.data.recommendations?.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <BrainIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{recommendation}</span>
                </li>
              )) || []}
            </ul>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <BrainIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {insights?.error || 'Configure AI providers to get intelligent insights'}
          </p>
        </div>
      )}
    </div>
  );

  const DailyPlanPanel: React.FC = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label htmlFor="plan-date" className="sr-only">Select Date for Daily Plan</label>
          <input
            id="plan-date"
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={generateNewDailyPlan}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>
      </div>

      {dailyPlan?.success ? (
        <>
          {/* Recommended Schedule */}
          {dailyPlan.data.recommended_schedule.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommended Schedule</h3>
              <div className="space-y-2">
                {dailyPlan.data.recommended_schedule.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.task_title}</h4>
                      <p className="text-sm text-gray-700">
                        {item.suggested_start_time} • {item.suggested_duration_minutes} min
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-700">Match Scores</div>
                      <div className="text-xs text-gray-600">
                        Energy: {item.energy_match_score} • Context: {item.context_match_score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Focus Blocks */}
          {dailyPlan.data.focus_blocks.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Focus Blocks</h3>
              <div className="space-y-2">
                {dailyPlan.data.focus_blocks.map((block, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded border border-green-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-green-800 capitalize">
                        {block.block_type.replace('_', ' ')}
                      </h4>
                      <span className="text-sm text-green-600">
                        {block.start_time} • {block.duration_minutes} min
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">{block.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Energy Optimization */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Energy Optimization</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700">Peak Hours</h4>
                <p className="text-sm text-green-600">
                  {dailyPlan.data.energy_optimization.peak_hours.join(' - ')}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Low Energy</h4>
                <p className="text-sm text-orange-600">
                  {dailyPlan.data.energy_optimization.low_energy_periods.join(' - ')}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-700">Task Distribution</h4>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="text-sm font-medium text-green-800">High Energy</div>
                  <div className="text-lg font-bold text-green-600">
                    {dailyPlan.data.energy_optimization.recommended_task_distribution.high_energy_tasks}
                  </div>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <div className="text-sm font-medium text-yellow-800">Medium Energy</div>
                  <div className="text-lg font-bold text-yellow-600">
                    {dailyPlan.data.energy_optimization.recommended_task_distribution.medium_energy_tasks}
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-sm font-medium text-gray-800">Low Energy</div>
                  <div className="text-lg font-bold text-gray-600">
                    {dailyPlan.data.energy_optimization.recommended_task_distribution.low_energy_tasks}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {dailyPlan?.error || 'Configure AI providers to get intelligent daily planning'}
          </p>
        </div>
      )}
    </div>
  );

  const WorkloadPanel: React.FC = () => (
    <div className="space-y-6">
      {workloadAnalysis?.success ? (
        <>
          {/* Capacity Analysis */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Capacity Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-700">Current Workload</span>
                  <div className="text-2xl font-bold text-blue-600">
                    {workloadAnalysis.data.capacity_analysis.current_workload_hours}h
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-700">Available Capacity</span>
                  <div className="text-2xl font-bold text-green-600">
                    {workloadAnalysis.data.capacity_analysis.available_capacity_hours}h
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-700">Utilization Rate</span>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(workloadAnalysis.data.capacity_analysis.utilization_rate * 100)}%
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-700">Burnout Risk</span>
                  <div className="text-2xl font-bold text-red-600">
                    {workloadAnalysis.data.capacity_analysis.burnout_risk_score}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Efficiency Metrics */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Efficiency Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-700">Task Completion Velocity</div>
                <div className="text-lg font-bold text-blue-600">
                  {workloadAnalysis.data.efficiency_metrics.task_completion_velocity.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-700">Priority Alignment</div>
                <div className="text-lg font-bold text-green-600">
                  {workloadAnalysis.data.efficiency_metrics.priority_alignment_score}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-700">Energy Efficiency</div>
                <div className="text-lg font-bold text-purple-600">
                  {workloadAnalysis.data.efficiency_metrics.energy_utilization_efficiency}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-700">Focus Time</div>
                <div className="text-lg font-bold text-orange-600">
                  {workloadAnalysis.data.efficiency_metrics.focus_time_percentage}%
                </div>
              </div>
            </div>
          </div>

          {/* Work-Life Balance */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Work-Life Balance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Balance Score</span>
                <div className="text-xl font-bold text-blue-600">
                  {workloadAnalysis.data.work_life_balance.balance_score}/100
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${workloadAnalysis.data.work_life_balance.balance_score}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Strategic Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Strategic Recommendations</h3>
            <ul className="space-y-2">
              {workloadAnalysis.data.strategic_recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <TrendingUpIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-blue-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <BarChart3Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {workloadAnalysis?.error || 'Configure AI providers to get workload analysis'}
          </p>
        </div>
      )}
    </div>
  );

  const HealthPanel: React.FC = () => (
    <div className="space-y-6">
      {providerHealth ? (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Provider Status</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-700">Primary Provider</span>
                <div className="text-lg font-medium text-blue-600 capitalize">
                  {providerHealth.primary_provider}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-700">Fallback Available</span>
                <div className="flex items-center space-x-2">
                  {providerHealth.fallback_available ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700">
                    {providerHealth.fallback_available ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">All Providers</h3>
            <div className="space-y-2">
              {Object.entries(providerHealth.providers).map(([provider, health]) => (
                <ProviderHealthIndicator key={provider} provider={provider} health={health} />
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">Configuration Tips</h3>
            <ul className="space-y-1 text-sm text-yellow-700">
              <li>• Configure multiple providers for better reliability</li>
              <li>• Gemini offers excellent context understanding</li>
              <li>• Claude provides detailed strategic analysis</li>
              <li>• OpenAI excels at structured planning</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading provider health status...</p>
        </div>
      )}
    </div>
  );

  // Show loading state if user preferences are not loaded yet
  if (!userPreferences) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <BrainIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading user preferences...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Intelligent insights and automation for your productivity
          </p>
        </div>
        <button
          onClick={refreshAIData}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <BrainIcon className="w-4 h-4" />
          <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Status Indicators */}
      {providerHealth && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">AI Status:</span>
              <ProviderHealthIndicator 
                provider={providerHealth.primary_provider} 
                health={providerHealth.providers[providerHealth.primary_provider]} 
              />
              {providerHealth.fallback_available && (
                <span className="text-xs text-green-600">+ Fallback available</span>
              )}
            </div>
            {insights?.fallback_used && (
              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                Using fallback provider
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'insights', label: 'Strategic Insights', icon: BrainIcon },
            { id: 'planning', label: 'Daily Planning', icon: CalendarIcon },
            { id: 'workload', label: 'Workload Analysis', icon: BarChart3Icon },
            { id: 'health', label: 'Provider Health', icon: CheckCircleIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'insights' && <InsightsPanel />}
        {activeTab === 'planning' && <DailyPlanPanel />}
        {activeTab === 'workload' && <WorkloadPanel />}
        {activeTab === 'health' && <HealthPanel />}
      </div>
    </div>
  );
};

export default AIDashboard; 