import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../contexts/AppStateContext';

interface Notification {
  id: string;
  type: 'deadline' | 'completion' | 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  entityId?: string;
  entityType?: 'task' | 'project';
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { state } = useAppState();
  const { projects, tasks } = state;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionable'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate notifications from current data
  useEffect(() => {
    const generatedNotifications: Notification[] = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Task deadline notifications
    tasks.forEach(task => {
      if (task.due_date && task.status !== 'completed') {
        const dueDate = new Date(task.due_date);
        
        if (dueDate < now) {
          // Overdue tasks
          generatedNotifications.push({
            id: `overdue-${task.id}`,
            type: 'warning',
            title: 'Overdue Task',
            message: `"${task.title}" was due ${Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))} days ago`,
            timestamp: dueDate,
            read: false,
            actionable: true,
            entityId: task.id,
            entityType: 'task'
          });
        } else if (dueDate >= todayStart && dueDate < tomorrow) {
          // Due today
          generatedNotifications.push({
            id: `due-today-${task.id}`,
            type: 'deadline',
            title: 'Due Today',
            message: `"${task.title}" is due today`,
            timestamp: dueDate,
            read: false,
            actionable: true,
            entityId: task.id,
            entityType: 'task'
          });
        } else if (dueDate >= tomorrow && dueDate < sevenDaysFromNow) {
          // Due soon
          const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          generatedNotifications.push({
            id: `due-soon-${task.id}`,
            type: 'info',
            title: 'Upcoming Deadline',
            message: `"${task.title}" is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
            timestamp: dueDate,
            read: false,
            actionable: true,
            entityId: task.id,
            entityType: 'task'
          });
        }
      }
    });

    // Project deadline notifications
    projects.forEach(project => {
      if (project.deadline && project.status !== 'completed') {
        const deadline = new Date(project.deadline);
        
        if (deadline < now) {
          generatedNotifications.push({
            id: `project-overdue-${project.id}`,
            type: 'error',
            title: 'Project Overdue',
            message: `Project "${project.title}" deadline has passed`,
            timestamp: deadline,
            read: false,
            actionable: true,
            entityId: project.id,
            entityType: 'project'
          });
        } else if (deadline >= todayStart && deadline < sevenDaysFromNow) {
          const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          generatedNotifications.push({
            id: `project-due-${project.id}`,
            type: 'deadline',
            title: 'Project Deadline Approaching',
            message: `Project "${project.title}" is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
            timestamp: deadline,
            read: false,
            actionable: true,
            entityId: project.id,
            entityType: 'project'
          });
        }
      }
    });

    // Productivity insights notifications
    const completedTasksToday = tasks.filter(task => {
      if (task.status !== 'completed' || !task.updated_at) return false;
      const completedDate = new Date(task.updated_at);
      return completedDate >= todayStart && completedDate < tomorrow;
    });

    if (completedTasksToday.length >= 5) {
      generatedNotifications.push({
        id: 'productivity-high',
        type: 'success',
        title: 'Great Productivity!',
        message: `You've completed ${completedTasksToday.length} tasks today. Excellent work!`,
        timestamp: now,
        read: false,
        actionable: false
      });
    }

    // High priority tasks without deadlines
    const urgentTasksWithoutDeadlines = tasks.filter(task => 
      task.priority === 'urgent' && 
      task.status !== 'completed' && 
      !task.due_date
    );

    if (urgentTasksWithoutDeadlines.length > 0) {
      generatedNotifications.push({
        id: 'urgent-no-deadline',
        type: 'warning',
        title: 'Urgent Tasks Need Deadlines',
        message: `${urgentTasksWithoutDeadlines.length} urgent task${urgentTasksWithoutDeadlines.length !== 1 ? 's' : ''} without deadlines`,
        timestamp: now,
        read: false,
        actionable: true
      });
    }

    // Sort notifications by timestamp (newest first)
    generatedNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setNotifications(generatedNotifications);
  }, [tasks, projects]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'actionable':
        return notification.actionable;
      default:
        return true;
    }
  });

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Get notification icon
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'deadline':
        return (
          <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'completion':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute right-0 top-full mt-2 w-96 bg-slate-800 rounded-xl shadow-2xl border border-slate-600 z-50 max-h-96 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-100">Notifications</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded"
            title="Close notifications"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex space-x-2">
          {(['all', 'unread', 'actionable'] as const).map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                filter === filterType
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {filterType === 'all' ? 'All' : filterType}
              {filterType === 'unread' && unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="mt-2 text-xs text-sky-400 hover:text-sky-300"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V3h0v14z" />
            </svg>
            <p>No notifications found</p>
            <p className="text-xs mt-1">
              {filter === 'all' ? 'You\'re all caught up!' : 
               filter === 'unread' ? 'No unread notifications' : 
               'No actionable items'}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-3 mb-2 rounded-lg transition-colors cursor-pointer ${
                  notification.read 
                    ? 'bg-slate-700/50 opacity-75' 
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${
                        notification.read ? 'text-slate-300' : 'text-slate-100'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      notification.read ? 'text-slate-400' : 'text-slate-300'
                    }`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      {notification.actionable && (
                        <span className="text-xs px-2 py-0.5 bg-orange-900/50 text-orange-300 rounded">
                          Action needed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter; 