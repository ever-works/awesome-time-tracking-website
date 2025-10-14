/**
 * Utility functions for cleaning and validating URLs
 */

/**
 * Clean and validate a URL string
 * Removes surrounding quotes, whitespace, and ensures proper protocol
 */
export function cleanUrl(url: string): string {
  if (!url) return '';
  
  // Remove any surrounding quotes or whitespace
  let cleaned = url.trim().replace(/^["']|["']$/g, '');
  
  // Ensure it's a valid URL with protocol
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `http://${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Get the base URL for API calls with proper cleaning
 */
export function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return cleanUrl(envUrl);
}

/**
 * Construct a full URL from a path
 */
export function buildUrl(path: string, baseUrl?: string): string {
  const base = baseUrl ? cleanUrl(baseUrl) : getBaseUrl();
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${base}${cleanPath}`;
}
