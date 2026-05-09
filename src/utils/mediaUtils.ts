/**
 * Utility to resolve media URLs.
 * In a development environment with multiple devices, absolute URLs saved in the DB
 * point to 'localhost', which fails on other devices.
 * This utility prepends the current API base URL to relative paths.
 */
export const getMediaUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  
  // If it's already an absolute URL (starts with http or https), return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // Optional: if it's localhost and we are not on localhost, we could try to fix it
    // But better to just save relative paths in the first place.
    return path;
  }
  
  // If it's a blob or data URL, return as is
  if (path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }

  // Prepend the API base URL (stripping /api suffix if present)
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
  
  // Ensure the path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${apiBase}${normalizedPath}`;
};
