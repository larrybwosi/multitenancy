/**
 * Format a date for display
 * 
 * @param date Date to format
 * @param options Display format options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  }
): string {
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;

  return dateObj.toLocaleString("en-US", options);
}

/**
 * Format a date as a relative time (e.g., "2 days ago")
 * 
 * @param date Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | number): string {
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays < 30) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  } else if (diffMonths < 12) {
    return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
  } else {
    return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
  }
} 