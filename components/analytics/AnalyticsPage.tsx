import React, { useState, useEffect } from 'react';
import { useAppState } from '../../src/contexts/AppStateContext';
import { AnalyticsService, AnalyticsData } from '../../services/analyticsService';
import { generateWorkspaceSnapshot } from '../../services/exportService';
import { APP_VERSION, APP_NAME } from '../../constants';
import { Task, Project } from '../../types';
import StatCard from '../../src/components/StatCard';
import LoadingSpinner from '../../src/components/LoadingSpinner';

// Chart Icons
const ChartIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const TrendIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
  </svg>
);

const GoalIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const DownloadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const CalendarIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

// Progress Ring Component
interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ 
  percentage, 
  size = 120, 
  strokeWidth = 8, 
  color = '#0ea5e9',
  children 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(51 65 85)" // slate-600
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

// Simple Bar Chart Component
interface BarChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  maxValue?: number;
}

const SimpleBarChart: React.FC<BarChartProps> = ({ data, maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-16 text-xs text-slate-300 text-right">{item.label}</div>
          <div className="flex-1">
            <div className="bg-slate-700 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
          <div className="w-12 text-xs text-slate-300 text-right">{item.value.toFixed(1)}%</div>
        </div>
      ))}
    </div>
  );
};

const AnalyticsPage: React.FC = () => {
  const { state } = useAppState();
  const { projects, tasks, userPreferences } = state;
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [performanceReport, setPerformanceReport] = useState<any>(null);

  useEffect(() => {
    const calculateAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = AnalyticsService.calculateAnalytics(projects, tasks);
        setAnalyticsData(data);
        
        // Generate performance report
        const report = AnalyticsService.generatePerformanceReport(projects, tasks);
        setPerformanceReport(report);
      } catch (error) {
        console.error('Error calculating analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateAnalytics();
  }, [projects, tasks]);

  // Helper to download JSON
  const downloadJson = (data: object, filename: string): void => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to download CSV
  const downloadCSV = (data: string, filename: string): void => {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate CSV report
  const generateCSVReport = (analyticsData: AnalyticsData): string => {
    const csvRows = [
      // Header
      ['Metric', 'Value', 'Category'],
      
      // Productivity Metrics
      ['Task Completion Rate', `${analyticsData.productivity.taskCompletionRate.toFixed(1)}%`, 'Productivity'],
      ['Project Completion Rate', `${analyticsData.productivity.projectCompletionRate.toFixed(1)}%`, 'Productivity'],
      ['Productivity Score', analyticsData.productivity.productivityScore.toString(), 'Productivity'],
      ['Task Velocity', `${analyticsData.productivity.taskVelocity} tasks/week`, 'Productivity'],
      ['Focus Time Utilization', `${analyticsData.productivity.focusTimeUtilization}%`, 'Productivity'],
      ['Deadline Miss Rate', `${analyticsData.productivity.deadlineMissRate}%`, 'Productivity'],
      ['Average Task Duration', `${analyticsData.productivity.averageTaskCompletionTime.toFixed(1)} hours`, 'Productivity'],
      ['Time Estimation Accuracy', `${analyticsData.productivity.timeEstimationAccuracy.toFixed(1)}%`, 'Productivity'],
      
      // Goals
      ['Goal Completion Rate', `${analyticsData.goals.goalCompletionRate.toFixed(1)}%`, 'Goals'],
      ['Total Goals', analyticsData.goals.totalGoals.toString(), 'Goals'],
      ['Completed Goals', analyticsData.goals.completedGoals.toString(), 'Goals'],
      ['Projects with Goals', analyticsData.goals.projectsWithGoals.toString(), 'Goals'],
      ['Average Goals per Project', analyticsData.goals.averageGoalsPerProject.toFixed(1), 'Goals'],
      
      // Workload
      ['Tasks In Progress', analyticsData.workloadInsights.totalTasksInProgress.toString(), 'Workload'],
      ['Average Tasks per Project', analyticsData.workloadInsights.averageTasksPerProject.toFixed(1), 'Workload'],
      ['Context Switch Frequency', `${analyticsData.workloadInsights.contextSwitchFrequency} switches/day`, 'Workload'],
      ['Burnout Risk', analyticsData.workloadInsights.burnoutRisk, 'Workload'],
      ['Consistency Score', `${analyticsData.performanceInsights.consistencyScore}%`, 'Performance'],
      
      // Priority Distribution
      ['Urgent Tasks', `${analyticsData.productivity.priorityDistribution.urgent.toFixed(1)}%`, 'Priority Distribution'],
      ['High Priority Tasks', `${analyticsData.productivity.priorityDistribution.high.toFixed(1)}%`, 'Priority Distribution'],
      ['Medium Priority Tasks', `${analyticsData.productivity.priorityDistribution.medium.toFixed(1)}%`, 'Priority Distribution'],
      ['Low Priority Tasks', `${analyticsData.productivity.priorityDistribution.low.toFixed(1)}%`, 'Priority Distribution'],
      
      // Energy Distribution
      ['High Energy Tasks', `${analyticsData.workloadInsights.energyLevelDistribution.high}%`, 'Energy Distribution'],
      ['Medium Energy Tasks', `${analyticsData.workloadInsights.energyLevelDistribution.medium}%`, 'Energy Distribution'],
      ['Low Energy Tasks', `${analyticsData.workloadInsights.energyLevelDistribution.low}%`, 'Energy Distribution'],
    ];

    return csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  // Export analytics data
  const handleExportAnalytics = async () => {
    if (!analyticsData || !userPreferences) {
      setExportError('Analytics data or preferences not available');
      return;
    }
    
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);
    
    try {
      const analyticsReport = {
        generated_at: new Date().toISOString(),
        version: APP_VERSION,
        analytics: analyticsData,
        summary: {
          total_projects: projects.length,
          total_tasks: tasks.length,
          completion_rate: analyticsData.productivity.taskCompletionRate,
          goal_achievement: analyticsData.goals.goalCompletionRate
        }
      };
      
      downloadJson(analyticsReport, `ultron_analytics_${new Date().toISOString().split('T')[0]}.json`);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Analytics export failed:', err);
      setExportError(err instanceof Error ? err.message : 'Analytics export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Export complete workspace snapshot
  const handleExportWorkspace = async () => {
    if (!userPreferences) {
      setExportError('User preferences not loaded');
      return;
    }
    
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);
    
    try {
      const snapshot = await generateWorkspaceSnapshot(projects, tasks, userPreferences);
      downloadJson(snapshot, `ultron_workspace_${new Date().toISOString().split('T')[0]}.json`);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Workspace export failed:', err);
      setExportError(err instanceof Error ? err.message : 'Workspace export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Export performance report as PDF-style HTML
  const handleExportReport = async () => {
    if (!analyticsData || !performanceReport) {
      setExportError('Report data not available');
      return;
    }
    
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);
    
    try {
      const reportHtml = generateReportHTML(analyticsData, performanceReport);
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ultron_performance_report_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Report export failed:', err);
      setExportError(err instanceof Error ? err.message : 'Report export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate comprehensive HTML report
  const generateReportHTML = (analytics: AnalyticsData, report: any): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Ultron Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        .header { border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9; }
        .section { margin: 30px 0; }
        .trend-up { color: #10b981; }
        .trend-down { color: #ef4444; }
        .trend-stable { color: #f59e0b; }
        .recommendation { background: #eff6ff; padding: 10px; margin: 5px 0; border-radius: 6px; border-left: 3px solid #3b82f6; }
        .strength { background: #f0fdf4; padding: 10px; margin: 5px 0; border-radius: 6px; border-left: 3px solid #22c55e; }
        .improvement { background: #fef2f2; padding: 10px; margin: 5px 0; border-radius: 6px; border-left: 3px solid #ef4444; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Productivity Performance Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()} | Ultron Analytics v${APP_VERSION}</p>
        <p class="trend-${report.trend}">Overall Trend: ${report.trend.toUpperCase()}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <p>${report.executiveSummary}</p>
    </div>

    <div class="section">
        <h2>Key Metrics</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <h3>Productivity Score</h3>
                <p style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${analytics.productivity.productivityScore}%</p>
            </div>
            <div class="metric-card">
                <h3>Task Completion</h3>
                <p style="font-size: 24px; font-weight: bold; color: #10b981;">${analytics.productivity.taskCompletionRate.toFixed(1)}%</p>
            </div>
            <div class="metric-card">
                <h3>Goal Achievement</h3>
                <p style="font-size: 24px; font-weight: bold; color: #3b82f6;">${analytics.goals.goalCompletionRate.toFixed(1)}%</p>
            </div>
            <div class="metric-card">
                <h3>Task Velocity</h3>
                <p style="font-size: 24px; font-weight: bold; color: #0ea5e9;">${analytics.productivity.taskVelocity} tasks/week</p>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Key Insights</h2>
        <ul>
            ${report.keyInsights.map((insight: string) => `<li>${insight}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>Strengths</h2>
        ${report.strengths.map((strength: string) => `<div class="strength">${strength}</div>`).join('')}
    </div>

    <div class="section">
        <h2>Areas for Improvement</h2>
        ${report.areasForImprovement.map((area: string) => `<div class="improvement">${area}</div>`).join('')}
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        ${report.recommendations.map((rec: string) => `<div class="recommendation">${rec}</div>`).join('')}
    </div>

    <div class="section">
        <h2>Detailed Analytics</h2>
        <h3>Priority Distribution</h3>
        <ul>
            <li>Urgent: ${analytics.productivity.priorityDistribution.urgent.toFixed(1)}%</li>
            <li>High: ${analytics.productivity.priorityDistribution.high.toFixed(1)}%</li>
            <li>Medium: ${analytics.productivity.priorityDistribution.medium.toFixed(1)}%</li>
            <li>Low: ${analytics.productivity.priorityDistribution.low.toFixed(1)}%</li>
        </ul>
        
        <h3>Workload Analysis</h3>
        <ul>
            <li>Tasks in Progress: ${analytics.workloadInsights.totalTasksInProgress}</li>
            <li>Average Tasks per Project: ${analytics.workloadInsights.averageTasksPerProject.toFixed(1)}</li>
            <li>Burnout Risk: ${analytics.workloadInsights.burnoutRisk}</li>
            <li>Context Switch Frequency: ${analytics.workloadInsights.contextSwitchFrequency} switches/day</li>
        </ul>
    </div>

    <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        <p>This report was automatically generated by Ultron Analytics. Data reflects productivity patterns and recommendations based on current task and project management.</p>
    </footer>
</body>
</html>`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="h-8 w-8" />
          <p className="mt-4 text-slate-400">Calculating analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <p>Unable to load analytics data</p>
        </div>
      </div>
    );
  }

  const { productivity, trends, goals, workloadInsights, performanceInsights } = analyticsData;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-sky-400 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-400">Performance metrics and productivity insights</p>
        </div>
        
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button 
            onClick={handleExportAnalytics}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:text-emerald-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
          >
            {isExporting ? (
              <LoadingSpinner size="h-4 w-4" />
            ) : (
              <DownloadIcon />
            )}
            <span className="ml-2">{isExporting ? 'Exporting...' : 'Export JSON'}</span>
          </button>
          <button 
            onClick={() => {
              if (analyticsData) {
                const csvData = generateCSVReport(analyticsData);
                downloadCSV(csvData, `ultron_analytics_${new Date().toISOString().split('T')[0]}.csv`);
              }
            }}
            disabled={!analyticsData}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-blue-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
          >
            <CalendarIcon />
            <span className="ml-2">Export CSV</span>
          </button>
          <button 
            onClick={handleExportWorkspace}
            disabled={isExporting}
            className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 disabled:text-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
          >
            {isExporting ? (
              <LoadingSpinner size="h-4 w-4" />
            ) : (
              <CalendarIcon />
            )}
            <span className="ml-2">{isExporting ? 'Exporting...' : 'Export Workspace'}</span>
          </button>
          <button 
            onClick={handleExportReport}
            disabled={isExporting}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:text-purple-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg flex items-center text-sm"
          >
            {isExporting ? (
              <LoadingSpinner size="h-4 w-4" />
            ) : (
              <CalendarIcon />
            )}
            <span className="ml-2">{isExporting ? 'Exporting...' : 'Export Performance Report'}</span>
          </button>
        </div>
      </header>

      {/* Export Status Messages */}
      {exportError && (
        <div className="bg-red-900/50 border border-red-500 text-red-100 px-4 py-3 rounded-md mb-6">
          <p className="text-sm">Export Error: {exportError}</p>
        </div>
      )}
      {exportSuccess && (
        <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-md mb-6">
          <p className="text-sm">✅ Export completed successfully! Check your downloads folder.</p>
        </div>
      )}

      {/* Analytics Summary Cards */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Task Completion</h3>
              <ChartIcon />
            </div>
            <div className="text-3xl font-bold mb-1">{productivity.taskCompletionRate.toFixed(1)}%</div>
            <p className="text-sm opacity-75">
              {tasks.filter((t: Task) => t.status === 'completed').length} of {tasks.length} tasks
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Goal Achievement</h3>
              <GoalIcon />
            </div>
            <div className="text-3xl font-bold mb-1">{goals.goalCompletionRate.toFixed(1)}%</div>
            <p className="text-sm opacity-75">
              {goals.completedGoals} of {goals.totalGoals} goals
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Productivity Score</h3>
              <ClockIcon />
            </div>
            <div className="text-3xl font-bold mb-1">{productivity.productivityScore}</div>
            <p className="text-sm opacity-75">Overall performance</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Task Velocity</h3>
              <TrendIcon />
            </div>
            <div className="text-3xl font-bold mb-1">{productivity.taskVelocity}</div>
            <p className="text-sm opacity-75">Tasks per week</p>
          </div>
        </div>
      </section>

      {/* Performance Insights */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-sky-300 mb-6">Performance Insights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Consistency & Focus */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Focus & Consistency</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                <span className="text-slate-300">Consistency Score:</span>
                <span className="text-emerald-400 font-semibold">{performanceInsights.consistencyScore}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                <span className="text-slate-300">Focus Time Utilization:</span>
                <span className="text-blue-400 font-semibold">{productivity.focusTimeUtilization}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-700 rounded">
                <span className="text-slate-300">Deadline Miss Rate:</span>
                <span className={`font-semibold ${productivity.deadlineMissRate > 20 ? 'text-red-400' : productivity.deadlineMissRate > 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {productivity.deadlineMissRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Top Performing Days */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Top Performing Days</h3>
            <div className="space-y-2">
              {performanceInsights.topPerformingDays.map((day, index) => (
                <div key={day} className="flex items-center p-3 bg-slate-700 rounded">
                  <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                    {index + 1}
                  </div>
                  <span className="text-slate-300">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Priority Distribution */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-xl font-semibold text-sky-300 mb-6">Priority & Energy Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Priority Distribution with Bar Chart */}
          <div>
            <h4 className="text-lg font-semibold text-slate-200 mb-4">Task Priorities</h4>
            <SimpleBarChart 
              data={[
                { label: 'Urgent', value: productivity.priorityDistribution.urgent, color: '#ef4444' },
                { label: 'High', value: productivity.priorityDistribution.high, color: '#fb923c' },
                { label: 'Medium', value: productivity.priorityDistribution.medium, color: '#fbbf24' },
                { label: 'Low', value: productivity.priorityDistribution.low, color: '#22c55e' }
              ]}
              maxValue={100}
            />
          </div>

          {/* Energy Level Distribution with Bar Chart */}
          <div>
            <h4 className="text-lg font-semibold text-slate-200 mb-4">Energy Levels</h4>
            <SimpleBarChart 
              data={[
                { label: 'High', value: workloadInsights.energyLevelDistribution.high, color: '#ef4444' },
                { label: 'Medium', value: workloadInsights.energyLevelDistribution.medium, color: '#fbbf24' },
                { label: 'Low', value: workloadInsights.energyLevelDistribution.low, color: '#22c55e' }
              ]}
              maxValue={100}
            />
          </div>
        </div>
      </section>

      {/* Visual Performance Overview */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-sky-300 mb-6">Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Task Completion Ring */}
          <div className="text-center">
            <ProgressRing 
              percentage={productivity.taskCompletionRate} 
              color="#10b981"
              size={100}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">
                  {productivity.taskCompletionRate.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-400">Tasks</div>
              </div>
            </ProgressRing>
            <h4 className="text-sm font-medium text-slate-300 mt-2">Task Completion</h4>
          </div>

          {/* Goal Achievement Ring */}
          <div className="text-center">
            <ProgressRing 
              percentage={goals.goalCompletionRate} 
              color="#3b82f6"
              size={100}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">
                  {goals.goalCompletionRate.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-400">Goals</div>
              </div>
            </ProgressRing>
            <h4 className="text-sm font-medium text-slate-300 mt-2">Goal Achievement</h4>
          </div>

          {/* Productivity Score Ring */}
          <div className="text-center">
            <ProgressRing 
              percentage={productivity.productivityScore} 
              color="#8b5cf6"
              size={100}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">
                  {productivity.productivityScore}
                </div>
                <div className="text-xs text-slate-400">Score</div>
              </div>
            </ProgressRing>
            <h4 className="text-sm font-medium text-slate-300 mt-2">Productivity Score</h4>
          </div>

          {/* Focus Time Ring */}
          <div className="text-center">
            <ProgressRing 
              percentage={productivity.focusTimeUtilization} 
              color="#f59e0b"
              size={100}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-400">
                  {productivity.focusTimeUtilization}%
                </div>
                <div className="text-xs text-slate-400">Focus</div>
              </div>
            </ProgressRing>
            <h4 className="text-sm font-medium text-slate-300 mt-2">Focus Time Utilization</h4>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="text-center p-4 bg-slate-700 rounded-lg">
            <div className="text-2xl font-bold text-sky-400">{productivity.taskVelocity}</div>
            <div className="text-sm text-slate-400">Tasks per week</div>
          </div>
          <div className="text-center p-4 bg-slate-700 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">{productivity.timeEstimationAccuracy.toFixed(0)}%</div>
            <div className="text-sm text-slate-400">Time accuracy</div>
          </div>
          <div className="text-center p-4 bg-slate-700 rounded-lg">
            <div className={`text-2xl font-bold ${
              productivity.deadlineMissRate > 20 ? 'text-red-400' : 
              productivity.deadlineMissRate > 10 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {productivity.deadlineMissRate}%
            </div>
            <div className="text-sm text-slate-400">Deadline misses</div>
          </div>
          <div className="text-center p-4 bg-slate-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{performanceInsights.consistencyScore}%</div>
            <div className="text-sm text-slate-400">Consistency</div>
          </div>
        </div>
      </section>

      {/* Productivity Trends */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-sky-300 flex items-center">
            <TrendIcon />
            <span className="ml-2">Productivity Trends</span>
          </h2>
          <div className="flex space-x-2">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  selectedPeriod === period
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trends[selectedPeriod].slice(-8).map((period, index) => (
            <div key={period.period} className="bg-slate-700 p-4 rounded-lg hover:bg-slate-600 transition-colors">
              <div className="text-sm text-slate-400 mb-3 font-medium">
                {new Date(period.period).toLocaleDateString()}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300">Tasks:</span>
                  <span className="text-emerald-400 font-semibold">{period.tasksCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Projects:</span>
                  <span className="text-blue-400 font-semibold">{period.projectsCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Hours:</span>
                  <span className="text-yellow-400 font-semibold">{period.hoursWorked}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Rate:</span>
                  <span className="text-purple-400 font-semibold">{period.completionRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Enhanced Workload Insights */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-sky-300 mb-6">Workload Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Workload */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Current Load</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                <span className="text-slate-400">Tasks In Progress:</span>
                <span className="text-emerald-400 font-semibold">{workloadInsights.totalTasksInProgress}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                <span className="text-slate-400">Avg Tasks/Project:</span>
                <span className="text-blue-400 font-semibold">{workloadInsights.averageTasksPerProject.toFixed(1)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                <span className="text-slate-400">Context Switches/Day:</span>
                <span className="text-yellow-400 font-semibold">{workloadInsights.contextSwitchFrequency}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                <span className="text-slate-400">Burnout Risk:</span>
                <span className={`font-semibold ${
                  workloadInsights.burnoutRisk === 'high' ? 'text-red-400' :
                  workloadInsights.burnoutRisk === 'medium' ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {workloadInsights.burnoutRisk.charAt(0).toUpperCase() + workloadInsights.burnoutRisk.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Most Active Projects */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Most Active Projects</h3>
            <div className="space-y-2">
              {workloadInsights.mostActiveProjects.slice(0, 4).map((item, index) => (
                <div key={item.project.id} className="flex justify-between items-center p-3 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
                  <span className="text-slate-300 truncate max-w-[150px]">
                    {item.project.title}
                  </span>
                  <span className="text-sky-400 font-semibold">{item.taskCount} tasks</span>
                </div>
              ))}
              {workloadInsights.mostActiveProjects.length === 0 && (
                <div className="text-center text-slate-400 p-4">
                  No active projects with tasks
                </div>
              )}
            </div>
          </div>

          {/* Improvement Suggestions */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">AI Suggestions</h3>
            <div className="space-y-3">
              {performanceInsights.improvementSuggestions.map((suggestion, index) => (
                <div key={index} className="p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-start">
                    <div className="w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        {workloadInsights.upcomingDeadlines.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Upcoming Deadlines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {workloadInsights.upcomingDeadlines.slice(0, 6).map((deadline, index) => (
                <div key={index} className="flex justify-between items-center bg-slate-700 p-3 rounded hover:bg-slate-600 transition-colors">
                  <span className="text-slate-300 truncate max-w-[150px]">
                    {deadline.entity.title}
                  </span>
                  <span className={`font-semibold text-sm ${
                    deadline.daysUntil <= 3 ? 'text-red-400' : 
                    deadline.daysUntil <= 7 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {deadline.daysUntil === 0 ? 'Today' : 
                     deadline.daysUntil === 1 ? 'Tomorrow' : 
                     `${deadline.daysUntil} days`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Bottleneck Analysis */}
      <section className="bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-sky-300 mb-6">Bottleneck Analysis</h2>
        <div className="space-y-4">
          {performanceInsights.bottleneckAnalysis.map((bottleneck, index) => (
            <div key={index} className="flex items-center p-4 bg-slate-700 rounded-lg">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm font-bold mr-4">
                !
              </div>
              <div>
                <p className="text-slate-300">{bottleneck}</p>
                <div className="text-xs text-slate-400 mt-1">
                  Impact: Medium • Recommended action: Review and optimize
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Performance Report Section */}
      {performanceReport && (
        <section className="bg-slate-800 p-6 rounded-xl shadow-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-sky-300">Performance Report</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              performanceReport.trend === 'improving' ? 'bg-green-100 text-green-800' :
              performanceReport.trend === 'declining' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {performanceReport.trend === 'improving' ? '📈 Improving' :
               performanceReport.trend === 'declining' ? '📉 Declining' :
               '📊 Stable'}
            </div>
          </div>

          {/* Executive Summary */}
          <div className="mb-6 p-4 bg-slate-700 rounded-lg border-l-4 border-sky-400">
            <h3 className="text-lg font-semibold text-sky-300 mb-2">Executive Summary</h3>
            <p className="text-slate-300 leading-relaxed">{performanceReport.executiveSummary}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Strengths */}
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Strengths
              </h3>
              <div className="space-y-2">
                {performanceReport.strengths.map((strength: string, index: number) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-300 text-sm">{strength}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Areas for Improvement
              </h3>
              <div className="space-y-2">
                {performanceReport.areasForImprovement.map((area: string, index: number) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-300 text-sm">{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-slate-700 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Key Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {performanceReport.keyInsights.map((insight: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 p-2 bg-slate-600 rounded">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-300 text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-slate-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Recommendations
            </h3>
            <div className="space-y-3">
              {performanceReport.recommendations.map((recommendation: string, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-purple-900/30 rounded-lg border border-purple-500/20">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-slate-300 text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AnalyticsPage; 