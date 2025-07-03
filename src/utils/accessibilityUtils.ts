/**
 * Accessibility utilities for improved user experience
 * Provides focus management, keyboard navigation, and screen reader support
 */

// Focus management utilities
export const focusUtils = {
  /**
   * Moves focus to the first focusable element within a container
   */
  focusFirst: (container: HTMLElement): boolean => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  },

  /**
   * Moves focus to the last focusable element within a container
   */
  focusLast: (container: HTMLElement): boolean => {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
      return true;
    }
    return false;
  },

  /**
   * Traps focus within a container (useful for modals)
   */
  trapFocus: (container: HTMLElement, event: KeyboardEvent): void => {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === 'Tab') {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  },

  /**
   * Restores focus to a previously focused element
   */
  restoreFocus: (element: HTMLElement | null): void => {
    if (element && typeof element.focus === 'function') {
      // Use setTimeout to ensure the element is available for focus
      setTimeout(() => element.focus(), 0);
    }
  }
};

// Keyboard navigation utilities
export const keyboardUtils = {
  /**
   * Standard keyboard navigation handler for lists and grids
   */
  handleArrowNavigation: (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      loop?: boolean;
      columns?: number;
    } = {}
  ): number => {
    const { orientation = 'vertical', loop = true, columns = 1 } = options;
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = columns > 1 ? currentIndex - columns : currentIndex - 1;
          if (newIndex < 0) {
            newIndex = loop ? items.length - 1 : 0;
          }
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = columns > 1 ? currentIndex + columns : currentIndex + 1;
          if (newIndex >= items.length) {
            newIndex = loop ? 0 : items.length - 1;
          }
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex - 1;
          if (newIndex < 0) {
            newIndex = loop ? items.length - 1 : 0;
          }
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = currentIndex + 1;
          if (newIndex >= items.length) {
            newIndex = loop ? 0 : items.length - 1;
          }
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus();
    }

    return newIndex;
  }
};

// Screen reader utilities
export const screenReaderUtils = {
  /**
   * Announces a message to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  /**
   * Updates the page title and announces it to screen readers
   */
  updatePageTitle: (title: string, announce: boolean = true): void => {
    document.title = `${title} - Ultron`;
    if (announce) {
      screenReaderUtils.announce(`Navigated to ${title}`);
    }
  }
};

// ARIA utilities
export const ariaUtils = {
  /**
   * Generates unique IDs for ARIA relationships
   */
  generateId: (prefix: string = 'aria'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Creates ARIA labelled-by relationships
   */
  createLabelledBy: (labelId: string, controlId: string): Record<string, string> => {
    return {
      'aria-labelledby': labelId,
      id: controlId
    };
  },

  /**
   * Creates ARIA described-by relationships
   */
  createDescribedBy: (descriptionId: string, controlId: string): Record<string, string> => {
    return {
      'aria-describedby': descriptionId,
      id: controlId
    };
  }
};

// Color contrast utilities
export const contrastUtils = {
  /**
   * Validates if text has sufficient contrast against background
   */
  hasGoodContrast: (foreground: string, background: string): boolean => {
    // This is a simplified implementation
    // In production, you'd want a more robust color contrast calculation
    const fgLuminance = getLuminance(foreground);
    const bgLuminance = getLuminance(background);
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
    return ratio >= 4.5; // WCAG AA standard
  }
};

// Helper functions
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
}

function getLuminance(color: string): number {
  // Simplified luminance calculation
  // In production, use a proper color library
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Custom hooks for accessibility
export const useAccessibility = () => {
  return {
    focusUtils,
    keyboardUtils,
    screenReaderUtils,
    ariaUtils,
    contrastUtils
  };
}; 