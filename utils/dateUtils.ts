/**
 * Date utility functions for consistent date handling across the application
 * These functions help avoid timezone-related issues when working with dates
 */

/**
 * Formats a Date object to YYYY-MM-DD format for HTML date inputs
 * Uses local date components to avoid timezone issues
 */
export const formatDateForInput = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Creates a Date object from a YYYY-MM-DD string ensuring it's treated as local date
 * This avoids the timezone conversion issue when parsing date-only strings
 */
export const parseDateString = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  // Handle both YYYY-MM-DD and full ISO string formats
  if (dateString.includes('T')) {
    // Full ISO string - extract just the date part
    const datePart = dateString.split('T')[0];
    return parseDateString(datePart);
  }
  
  // Parse YYYY-MM-DD as local date to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null;
  }
  
  // Create date in local timezone (month is 0-indexed)
  return new Date(year, month - 1, day);
};

/**
 * Compares two dates for equality (date-only, ignoring time)
 * Handles both Date objects and date strings consistently
 */
export const isSameDate = (date1: Date | string | null | undefined, date2: Date | string | null | undefined): boolean => {
  if (!date1 || !date2) return false;
  
  let d1: Date | null;
  let d2: Date | null;
  
  if (typeof date1 === 'string') {
    d1 = parseDateString(date1);
  } else {
    d1 = date1;
  }
  
  if (typeof date2 === 'string') {
    d2 = parseDateString(date2);
  } else {
    d2 = date2;
  }
  
  if (!d1 || !d2) return false;
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

/**
 * Gets the date string in YYYY-MM-DD format from a Date object or date string
 * Ensures consistent formatting regardless of input type
 */
export const getDateString = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  if (typeof date === 'string') {
    // If it's already a string, return just the date part
    return date.includes('T') ? date.split('T')[0] : date;
  }
  
  return formatDateForInput(date);
};

/**
 * Checks if a date (string or Date object) matches today's date
 */
export const isToday = (date: Date | string | null | undefined): boolean => {
  return isSameDate(date, new Date());
}; 