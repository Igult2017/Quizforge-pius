export function isUnauthorizedError(error: Error): boolean {
  // Check if error message starts with 401: (authentication failure)
  // Note: 403 is authorization failure (e.g. subscription required), not authentication
  return /^401:/.test(error.message);
}
