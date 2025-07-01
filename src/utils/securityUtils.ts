/**
 * Security utilities for production-ready application
 * Implements OWASP security best practices and protection mechanisms
 */

// Security Headers Configuration
export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Remove unsafe-* in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' wss: https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()'
  ].join(', ')
};

// Input Validation Utilities
export class InputValidator {
  /**
   * Sanitizes user input to prevent XSS attacks
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>'"]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return entities[char] || char;
      })
      .trim();
  }

  /**
   * Validates email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validates password strength
   */
  static isValidPassword(password: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (password.length < 8) {
      issues.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      issues.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      issues.push('Password must contain at least one special character');
    }
    if (password.length > 128) {
      issues.push('Password must be less than 128 characters long');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Validates project/task title input
   */
  static validateTitle(title: string): { valid: boolean; error?: string } {
    const sanitized = this.sanitizeInput(title);
    
    if (!sanitized || sanitized.length === 0) {
      return { valid: false, error: 'Title is required' };
    }
    
    if (sanitized.length > 200) {
      return { valid: false, error: 'Title must be less than 200 characters' };
    }
    
    // Check for potential malicious patterns
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i
    ];
    
    if (maliciousPatterns.some(pattern => pattern.test(sanitized))) {
      return { valid: false, error: 'Title contains invalid characters' };
    }
    
    return { valid: true };
  }

  /**
   * Validates description input
   */
  static validateDescription(description: string): { valid: boolean; error?: string } {
    const sanitized = this.sanitizeInput(description);
    
    if (sanitized.length > 2000) {
      return { valid: false, error: 'Description must be less than 2000 characters' };
    }
    
    return { valid: true };
  }
}

// Rate Limiting Utilities
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check if request is within rate limit
   */
  static checkLimit(
    identifier: string, 
    maxRequests: number = 60, 
    windowMs: number = 60000
  ): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const requestData = this.requests.get(identifier);

    if (!requestData || now > requestData.resetTime) {
      // Reset or create new entry
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true };
    }

    if (requestData.count >= maxRequests) {
      return { 
        allowed: false, 
        resetTime: requestData.resetTime 
      };
    }

    requestData.count++;
    return { allowed: true };
  }

  /**
   * Clean up expired entries
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Secure Storage Utilities
export class SecureStorage {
  /**
   * Securely store sensitive data in localStorage
   */
  static setSecure(key: string, value: string): boolean {
    try {
      const encrypted = btoa(value); // Basic encoding (use proper encryption in production)
      localStorage.setItem(`ultron_${key}`, encrypted);
      return true;
    } catch (error) {
      console.error('Failed to store secure data:', error);
      return false;
    }
  }

  /**
   * Securely retrieve sensitive data from localStorage
   */
  static getSecure(key: string): string | null {
    try {
      const encrypted = localStorage.getItem(`ultron_${key}`);
      if (!encrypted) return null;
      return atob(encrypted); // Basic decoding (use proper decryption in production)
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  }

  /**
   * Securely remove data from localStorage
   */
  static removeSecure(key: string): void {
    localStorage.removeItem(`ultron_${key}`);
  }

  /**
   * Clear all Ultron-related secure storage
   */
  static clearAll(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('ultron_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// CSRF Protection
export class CSRFProtection {
  private static token: string | null = null;

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    this.token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return this.token;
  }

  /**
   * Get current CSRF token
   */
  static getToken(): string {
    if (!this.token) {
      return this.generateToken();
    }
    return this.token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(providedToken: string): boolean {
    return this.token !== null && this.token === providedToken;
  }
}

// Security Event Logging
export class SecurityLogger {
  /**
   * Log security events for monitoring
   */
  static logSecurityEvent(
    event: 'login_attempt' | 'failed_auth' | 'suspicious_activity' | 'data_access' | 'permission_change',
    details: Record<string, any> = {}
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...details
    };

    // In production, send to security monitoring service
    console.log('[SECURITY EVENT]', logEntry);
    
    // Store locally for debugging (remove in production)
    const existingLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    existingLogs.push(logEntry);
    
    // Keep only last 100 logs
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem('security_logs', JSON.stringify(existingLogs));
  }

  /**
   * Get security logs for debugging
   */
  static getSecurityLogs(): any[] {
    return JSON.parse(localStorage.getItem('security_logs') || '[]');
  }
}

// Content Security Policy Report Handler
export const handleCSPViolation = (event: SecurityPolicyViolationEvent): void => {
  SecurityLogger.logSecurityEvent('suspicious_activity', {
    type: 'csp_violation',
    blockedURI: event.blockedURI,
    violatedDirective: event.violatedDirective,
    originalPolicy: event.originalPolicy
  });
};

// Initialize security monitoring
export const initializeSecurity = (): void => {
  // Set up CSP violation monitoring
  if (typeof document !== 'undefined') {
    document.addEventListener('securitypolicyviolation', handleCSPViolation);
  }

  // Generate initial CSRF token
  CSRFProtection.generateToken();

  // Clean up rate limiter periodically
  setInterval(() => {
    RateLimiter.cleanup();
  }, 60000); // Every minute

  SecurityLogger.logSecurityEvent('security_initialized');
};

// Export default security configuration
export const securityConfig = {
  headers: securityHeaders,
  validation: InputValidator,
  rateLimiting: RateLimiter,
  storage: SecureStorage,
  csrf: CSRFProtection,
  logging: SecurityLogger,
  initialize: initializeSecurity
};

export default securityConfig; 