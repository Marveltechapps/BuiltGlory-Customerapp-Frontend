import { ApiError } from '../api';

/** Prefer API validation detail, then error.message. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const detail = error.details?.[0]?.message;
    if (detail) return detail;
    return error.message || 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
