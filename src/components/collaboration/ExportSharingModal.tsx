import React, { useState, useEffect } from 'react';
import AccessibleButton from '../AccessibleButton';
import { screenReaderUtils } from '../../utils/accessibilityUtils';

interface ExportSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportData: {
    type: 'workspace' | 'analytics' | 'performance-report';
    title: string;
    data: any;
    generatedAt: Date;
  } | null;
}

interface PublicReport {
  id: string;
  title: string;
  type: 'workspace' | 'analytics' | 'performance-report';
  publicUrl: string;
  views: number;
  createdAt: Date;
  expiresAt: Date | null;
  isPasswordProtected: boolean;
}

const ExportSharingModal: React.FC<ExportSharingModalProps> = ({ 
  isOpen, 
  onClose, 
  exportData 
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedReports, setPublishedReports] = useState<PublicReport[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState<'never' | '24h' | '7d' | '30d'>('30d');
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);

  // Load existing published reports
  useEffect(() => {
    if (isOpen) {
      loadPublishedReports();
      if (exportData) {
        setTitle(`${exportData.title} - ${new Date().toLocaleDateString()}`);
        setDescription(`Shared ${exportData.type} report generated on ${exportData.generatedAt.toLocaleDateString()}`);
      }
    }
  }, [isOpen, exportData]);

  const loadPublishedReports = () => {
    // Mock data - in real implementation, fetch from backend
    const mockReports: PublicReport[] = [
      {
        id: 'report-1',
        title: 'Q4 2024 Performance Report',
        type: 'performance-report',
        publicUrl: `${window.location.origin}/public/report/abc123def456`,
        views: 25,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        isPasswordProtected: false
      },
      {
        id: 'report-2',
        title: 'Project Analytics Overview',
        type: 'analytics',
        publicUrl: `${window.location.origin}/public/analytics/xyz789ghi012`,
        views: 12,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        expiresAt: null,
        isPasswordProtected: true
      }
    ];
    setPublishedReports(mockReports);
  };

  const publishReport = async () => {
    if (!exportData || !title.trim()) return;

    setIsPublishing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const expirationDate = getExpirationDate(expiresIn);
      const newReport: PublicReport = {
        id: `report-${Date.now()}`,
        title: title.trim(),
        type: exportData.type,
        publicUrl: `${window.location.origin}/public/${exportData.type}/${generateToken()}`,
        views: 0,
        createdAt: new Date(),
        expiresAt: expirationDate,
        isPasswordProtected
      };

      setPublishedReports(prev => [newReport, ...prev]);
      screenReaderUtils.announce(`Report "${title}" published successfully`);
      
      // Reset form
      setTitle('');
      setDescription('');
      setIsPasswordProtected(false);
      setPassword('');
      setExpiresIn('30d');
    } catch (error) {
      screenReaderUtils.announce('Error publishing report', 'assertive');
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = async (report: PublicReport) => {
    try {
      await navigator.clipboard.writeText(report.publicUrl);
      setCopiedReportId(report.id);
      screenReaderUtils.announce('Report link copied to clipboard');
      
      setTimeout(() => setCopiedReportId(null), 2000);
    } catch (error) {
      screenReaderUtils.announce('Failed to copy link', 'assertive');
    }
  };

  const revokeReport = async (reportId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPublishedReports(prev => prev.filter(report => report.id !== reportId));
      screenReaderUtils.announce('Report access revoked');
    } catch (error) {
      screenReaderUtils.announce('Error revoking report access', 'assertive');
    }
  };

  const getExpirationDate = (duration: typeof expiresIn): Date | null => {
    if (duration === 'never') return null;
    
    const now = Date.now();
    const durations = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    return new Date(now + durations[duration]);
  };

  const generateToken = (): string => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  const formatTimeRemaining = (expiresAt: Date | null): string => {
    if (!expiresAt) return 'Never expires';
    
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days === 1 ? '' : 's'} remaining`;
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} remaining`;
    return 'Less than 1 hour remaining';
  };

  const getReportTypeLabel = (type: string): string => {
    const labels = {
      'workspace': 'Workspace Snapshot',
      'analytics': 'Analytics Dashboard',
      'performance-report': 'Performance Report'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-sharing-modal-title"
    >
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-600">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div>
            <h2 id="export-sharing-modal-title" className="text-xl font-semibold text-slate-100">
              Share Export
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Create public links to share your reports and analytics
            </p>
          </div>
          <AccessibleButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close export sharing modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </AccessibleButton>
        </div>

        <div className="p-6 space-y-6">
          {/* Publish New Report */}
          {exportData && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200">Publish New Report</h3>
              
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                  <span className="text-slate-300 font-medium">
                    {getReportTypeLabel(exportData.type)}
                  </span>
                  <span className="text-slate-400 text-sm">
                    Generated {exportData.generatedAt.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">
                  {exportData.title}
                </p>
              </div>

              {/* Title and Description */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="report-title" className="block text-sm font-medium text-slate-300 mb-1">
                    Public Title
                  </label>
                  <input
                    id="report-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Enter a title for the public report"
                  />
                </div>

                <div>
                  <label htmlFor="report-description" className="block text-sm font-medium text-slate-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="report-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Add a description for the public report"
                  />
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    id="password-protected"
                    type="checkbox"
                    checked={isPasswordProtected}
                    onChange={(e) => setIsPasswordProtected(e.target.checked)}
                    className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-600 rounded focus:ring-sky-500"
                  />
                  <label htmlFor="password-protected" className="text-slate-300 text-sm">
                    Password protect this report
                  </label>
                </div>

                {isPasswordProtected && (
                  <div>
                    <label htmlFor="report-password" className="block text-sm font-medium text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      id="report-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="Enter password"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="expiration" className="block text-sm font-medium text-slate-300 mb-1">
                    Link Expiration
                  </label>
                  <select
                    id="expiration"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value as typeof expiresIn)}
                    className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="24h">24 hours</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="never">Never expires</option>
                  </select>
                </div>
              </div>

              {/* Publish Button */}
              <AccessibleButton
                variant="primary"
                onClick={publishReport}
                isLoading={isPublishing}
                loadingText="Publishing..."
                disabled={!title.trim()}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                }
              >
                Publish Report
              </AccessibleButton>
            </div>
          )}

          {/* Published Reports */}
          {publishedReports.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200">Published Reports</h3>
              
              <div className="space-y-3">
                {publishedReports.map((report) => (
                  <div key={report.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-slate-200 font-medium">{report.title}</h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-slate-400">
                          <span className="px-2 py-0.5 bg-sky-600 text-white rounded text-xs">
                            {getReportTypeLabel(report.type)}
                          </span>
                          <span>{report.views} view{report.views === 1 ? '' : 's'}</span>
                          <span>{formatTimeRemaining(report.expiresAt)}</span>
                          {report.isPasswordProtected && (
                            <span className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span>Protected</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={report.publicUrl}
                        readOnly
                        className="flex-1 bg-slate-600 border border-slate-500 text-slate-200 rounded px-3 py-2 text-sm font-mono"
                      />
                      <AccessibleButton
                        variant="secondary"
                        size="sm"
                        onClick={() => copyToClipboard(report)}
                        aria-label={`Copy public link for ${report.title}`}
                      >
                        {copiedReportId === report.id ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </AccessibleButton>
                      <AccessibleButton
                        variant="danger"
                        size="sm"
                        onClick={() => revokeReport(report.id)}
                        aria-label={`Revoke access to ${report.title}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </AccessibleButton>
                    </div>

                    <div className="mt-2 text-xs text-slate-400">
                      Published {report.createdAt.toLocaleDateString()} at {report.createdAt.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Notice */}
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-blue-400 font-medium text-sm">Public Sharing</h4>
                <p className="text-blue-200 text-sm mt-1">
                  Published reports are accessible to anyone with the link. They contain read-only views of your data at the time of export.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-slate-600">
          <AccessibleButton variant="secondary" onClick={onClose}>
            Done
          </AccessibleButton>
        </div>
      </div>
    </div>
  );
};

export default ExportSharingModal; 