import React, { useState, useEffect } from 'react';
import { securityMonitor } from '../../services/securityMonitor';

const SecurityDashboard: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [status, setStatus] = useState<any>({});

  useEffect(() => {
    loadSecurityData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = () => {
    setEvents(securityMonitor.getRecentEvents(50));
    setSummary(securityMonitor.getEventsSummary());
    setStatus(securityMonitor.getSecurityStatus());
  };

  const clearEvents = () => {
    securityMonitor.clearEvents();
    loadSecurityData();
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'alert': return 'bg-red-100 border-red-500 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default: return 'bg-green-100 border-green-500 text-green-800';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'alert': return '🚨';
      case 'warning': return '⚠️';
      default: return '✅';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🛡️ Security Dashboard</h1>
        
        {/* Security Status */}
        <div className={`p-4 rounded-lg border-2 mb-6 ${getStatusColor()}`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getStatusIcon()}</span>
            <div>
              <h2 className="text-lg font-semibold">Security Status</h2>
              <p>{status.message}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-slate-400">Total Events</h3>
            <p className="text-2xl font-bold">{summary.totalEvents || 0}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-slate-400">Last 24 Hours</h3>
            <p className="text-2xl font-bold">{summary.recentEvents || 0}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-slate-400">Unique Emails</h3>
            <p className="text-2xl font-bold">{summary.uniqueEmails || 0}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-slate-400">Last Event</h3>
            <p className="text-xs font-mono">
              {summary.lastEventTime ? formatTimestamp(summary.lastEventTime) : 'None'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={loadSecurityData}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            🔄 Refresh
          </button>
          <button
            onClick={clearEvents}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            🗑️ Clear Events
          </button>
        </div>

        {/* Recent Events */}
        <div className="bg-slate-800 rounded-lg">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold">Recent Security Events</h2>
            <p className="text-sm text-slate-400">
              Showing {events.length} most recent unauthorized access attempts
            </p>
          </div>
          
          {events.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <p>No security events recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      User Agent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {events.map((event, index) => (
                    <tr key={index} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          event.type === 'unauthorized_login' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {event.type === 'unauthorized_login' ? '🔑 Login' : '📝 Signup'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {event.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {formatTimestamp(event.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                        {event.userAgent || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-900/50 border border-blue-600 rounded-lg p-4">
          <h3 className="font-semibold mb-2">💡 How to Access This Dashboard:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Sign in to your Ultron app with your authorized credentials</li>
            <li>Add <code className="bg-slate-700 px-1 rounded">/security</code> to your app URL</li>
            <li>Bookmark this page for quick security monitoring</li>
            <li>Check regularly for unauthorized access attempts</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;