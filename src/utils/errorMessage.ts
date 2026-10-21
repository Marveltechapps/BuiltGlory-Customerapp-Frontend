import { ApiError } from '../api';

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Validation failures carry per-field messages; the first one is the most useful to show.
    if (
      (error.status === 422 || error.status === 400) &&
      error.details.length
    ) {
      return error.details[0].message || error.message;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}

/** All field messages from a validation error, keyed by backend field path. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  return error.details.reduce<Record<string, string>>((acc, d) => {
    if (d.field && !acc[d.field]) acc[d.field] = d.message;
    return acc;
  }, {});
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.isNetwork;
}

export function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
