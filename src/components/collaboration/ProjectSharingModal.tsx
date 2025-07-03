import React, { useState, useEffect } from 'react';
import { Project } from '../../../types';
import AccessibleButton from '../AccessibleButton';
import { screenReaderUtils } from '../../utils/accessibilityUtils';

interface ProjectSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

type ShareMode = 'read-only' | 'comment' | 'edit';
type ShareDuration = '1-hour' | '24-hours' | '7-days' | '30-days' | 'never-expires';

interface ShareLink {
  id: string;
  url: string;
  mode: ShareMode;
  expiresAt: Date | null;
  createdAt: Date;
  accessCount: number;
}

const ProjectSharingModal: React.FC<ProjectSharingModalProps> = ({ 
  isOpen, 
  onClose, 
  project 
}) => {
  const [shareMode, setShareMode] = useState<ShareMode>('read-only');
  const [shareDuration, setShareDuration] = useState<ShareDuration>('24-hours');
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Load existing share links when modal opens
  useEffect(() => {
    if (isOpen && project) {
      // In a real implementation, this would fetch from the backend
      loadExistingShareLinks();
      screenReaderUtils.announce(`Opened sharing options for project ${project.title}`);
    }
  }, [isOpen, project]);

  const loadExistingShareLinks = () => {
    // Mock data - in real implementation, fetch from backend
    const mockLinks: ShareLink[] = [
      {
        id: 'link-1',
        url: `${window.location.origin}/shared/project/${project?.id}?token=abc123`,
        mode: 'read-only',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        accessCount: 3
      }
    ];
    setShareLinks(mockLinks);
  };

  const generateShareLink = async () => {
    if (!project) return;

    setIsGenerating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const expirationTime = getExpirationTime(shareDuration);
      const newLink: ShareLink = {
        id: `link-${Date.now()}`,
        url: `${window.location.origin}/shared/project/${project.id}?token=${generateToken()}`,
        mode: shareMode,
        expiresAt: expirationTime,
        createdAt: new Date(),
        accessCount: 0
      };

      setShareLinks(prev => [newLink, ...prev]);
      screenReaderUtils.announce('Share link generated successfully');
    } catch (error) {
      screenReaderUtils.announce('Error generating share link', 'assertive');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (link: ShareLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedLinkId(link.id);
      screenReaderUtils.announce('Link copied to clipboard');
      
      // Reset copy status after 2 seconds
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      screenReaderUtils.announce('Failed to copy link', 'assertive');
    }
  };

  const revokeShareLink = async (linkId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setShareLinks(prev => prev.filter(link => link.id !== linkId));
      screenReaderUtils.announce('Share link revoked');
    } catch (error) {
      screenReaderUtils.announce('Error revoking share link', 'assertive');
    }
  };

  const getExpirationTime = (duration: ShareDuration): Date | null => {
    if (duration === 'never-expires') return null;
    
    const now = Date.now();
    const durations = {
      '1-hour': 60 * 60 * 1000,
      '24-hours': 24 * 60 * 60 * 1000,
      '7-days': 7 * 24 * 60 * 60 * 1000,
      '30-days': 30 * 24 * 60 * 60 * 1000
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
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days === 1 ? '' : 's'} remaining`;
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} remaining`;
    return 'Less than 1 hour remaining';
  };

  const getShareModeDescription = (mode: ShareMode): string => {
    const descriptions = {
      'read-only': 'View project details, tasks, and progress',
      'comment': 'View and add comments to tasks',
      'edit': 'Full access to edit project and tasks'
    };
    return descriptions[mode];
  };

  if (!isOpen || !project) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sharing-modal-title"
    >
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-600">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600">
          <div>
            <h2 id="sharing-modal-title" className="text-xl font-semibold text-slate-100">
              Share Project
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Generate secure links to share "{project.title}"
            </p>
          </div>
          <AccessibleButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close sharing modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </AccessibleButton>
        </div>

        <div className="p-6 space-y-6">
          {/* Share Link Generator */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200">Generate New Share Link</h3>
            
            {/* Share Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Access Level
              </label>
              <div className="space-y-2">
                {(['read-only', 'comment', 'edit'] as ShareMode[]).map((mode) => (
                  <label key={mode} className="flex items-start space-x-3 p-3 rounded-lg border border-slate-600 hover:border-slate-500 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="shareMode"
                      value={mode}
                      checked={shareMode === mode}
                      onChange={(e) => setShareMode(e.target.value as ShareMode)}
                      className="mt-1 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-slate-200 font-medium capitalize">
                        {mode.replace('-', ' ')}
                      </div>
                      <div className="text-slate-400 text-sm">
                        {getShareModeDescription(mode)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Duration Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Link Expiration
              </label>
              <select
                value={shareDuration}
                onChange={(e) => setShareDuration(e.target.value as ShareDuration)}
                className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="1-hour">1 hour</option>
                <option value="24-hours">24 hours</option>
                <option value="7-days">7 days</option>
                <option value="30-days">30 days</option>
                <option value="never-expires">Never expires</option>
              </select>
            </div>

            {/* Generate Button */}
            <AccessibleButton
              variant="primary"
              onClick={generateShareLink}
              isLoading={isGenerating}
              loadingText="Generating..."
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              }
            >
              Generate Share Link
            </AccessibleButton>
          </div>

          {/* Existing Share Links */}
          {shareLinks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200">Active Share Links</h3>
              
              <div className="space-y-3">
                {shareLinks.map((link) => (
                  <div key={link.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs font-medium bg-sky-600 text-white rounded-full capitalize">
                          {link.mode.replace('-', ' ')}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {formatTimeRemaining(link.expiresAt)}
                        </span>
                      </div>
                      <div className="text-slate-400 text-sm">
                        {link.accessCount} access{link.accessCount === 1 ? '' : 'es'}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={link.url}
                        readOnly
                        className="flex-1 bg-slate-600 border border-slate-500 text-slate-200 rounded px-3 py-2 text-sm font-mono"
                      />
                      <AccessibleButton
                        variant="secondary"
                        size="sm"
                        onClick={() => copyToClipboard(link)}
                        aria-label={`Copy share link for ${link.mode} access`}
                      >
                        {copiedLinkId === link.id ? (
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
                        onClick={() => revokeShareLink(link.id)}
                        aria-label={`Revoke share link for ${link.mode} access`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </AccessibleButton>
                    </div>

                    <div className="mt-2 text-xs text-slate-400">
                      Created {link.createdAt.toLocaleDateString()} at {link.createdAt.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-yellow-400 font-medium text-sm">Security Notice</h4>
                <p className="text-yellow-200 text-sm mt-1">
                  Anyone with a share link can access your project according to the permissions set. 
                  Revoke links when no longer needed.
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

export default ProjectSharingModal; 