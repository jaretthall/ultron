// Security monitoring service for unauthorized access attempts

interface SecurityEvent {
  type: 'unauthorized_login' | 'unauthorized_signup' | 'suspicious_activity';
  email: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

class SecurityMonitor {
  private readonly STORAGE_KEY = 'ultron_security_events';
  private readonly MAX_EVENTS = 100; // Keep last 100 events

  private getEvents(): SecurityEvent[] {
    try {
      const events = localStorage.getItem(this.STORAGE_KEY);
      return events ? JSON.parse(events) : [];
    } catch (error) {
      console.error('Error reading security events:', error);
      return [];
    }
  }

  private saveEvents(events: SecurityEvent[]): void {
    try {
      // Keep only the most recent events
      const trimmedEvents = events.slice(-this.MAX_EVENTS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedEvents));
    } catch (error) {
      console.error('Error saving security events:', error);
    }
  }

  logUnauthorizedLogin(email: string): void {
    const event: SecurityEvent = {
      type: 'unauthorized_login',
      email: email.toLowerCase(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    console.warn('🚨 SECURITY ALERT - Unauthorized login attempt:', event);
    
    const events = this.getEvents();
    events.push(event);
    this.saveEvents(events);
  }

  logUnauthorizedSignup(email: string): void {
    const event: SecurityEvent = {
      type: 'unauthorized_signup',
      email: email.toLowerCase(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    console.warn('🚨 SECURITY ALERT - Unauthorized signup attempt:', event);
    
    const events = this.getEvents();
    events.push(event);
    this.saveEvents(events);
  }

  getRecentEvents(limit: number = 20): SecurityEvent[] {
    const events = this.getEvents();
    return events.slice(-limit).reverse(); // Most recent first
  }

  getEventsSummary(): { 
    totalEvents: number; 
    recentEvents: number; 
    uniqueEmails: number;
    lastEventTime?: string;
  } {
    const events = this.getEvents();
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentEvents = events.filter(e => new Date(e.timestamp).getTime() > last24Hours);
    const uniqueEmails = new Set(events.map(e => e.email)).size;
    const lastEvent = events[events.length - 1];

    return {
      totalEvents: events.length,
      recentEvents: recentEvents.length,
      uniqueEmails,
      lastEventTime: lastEvent?.timestamp
    };
  }

  clearEvents(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🧹 Security events cleared');
  }

  // Check if there have been suspicious patterns
  checkForSuspiciousActivity(): boolean {
    const events = this.getEvents();
    const last10Minutes = Date.now() - (10 * 60 * 1000);
    const recentAttempts = events.filter(e => new Date(e.timestamp).getTime() > last10Minutes);
    
    // Flag as suspicious if more than 3 attempts in 10 minutes
    return recentAttempts.length > 3;
  }

  // Get dashboard-friendly security status
  getSecurityStatus(): {
    status: 'secure' | 'warning' | 'alert';
    message: string;
    eventCount: number;
  } {
    const summary = this.getEventsSummary();
    const suspicious = this.checkForSuspiciousActivity();

    if (suspicious) {
      return {
        status: 'alert',
        message: 'Multiple unauthorized attempts detected in last 10 minutes',
        eventCount: summary.recentEvents
      };
    }

    if (summary.recentEvents > 0) {
      return {
        status: 'warning',
        message: `${summary.recentEvents} unauthorized attempts in last 24 hours`,
        eventCount: summary.recentEvents
      };
    }

    return {
      status: 'secure',
      message: 'No recent unauthorized access attempts',
      eventCount: 0
    };
  }
}

export const securityMonitor = new SecurityMonitor();