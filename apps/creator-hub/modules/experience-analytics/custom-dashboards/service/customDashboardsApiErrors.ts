import {
  CustomDashboardNotAvailableError,
  CustomDashboardNotFoundError,
  CustomDashboardPermissionDeniedError,
  CustomDashboardQuotaExceededError,
  CustomDashboardServiceError,
  CustomDashboardStorageWriteError,
  CustomDashboardUnauthenticatedError,
  CustomDashboardValidationError,
  CustomDashboardVersionConflictError,
} from '../errors';
import { CustomDashboardsApiRequestError } from './customDashboardsApiClient';

function normaliseReason(message: string | undefined): string {
  return (message ?? '').toUpperCase().replaceAll('-', '_');
}

function apiMessage(error: CustomDashboardsApiRequestError): string | undefined {
  return error.body?.message ?? error.body?.error?.message ?? error.message;
}

export function mapCustomDashboardsApiError(error: unknown, dashboardId?: string): Error {
  if (error instanceof CustomDashboardServiceError) {
    return error;
  }

  if (!(error instanceof CustomDashboardsApiRequestError)) {
    return new CustomDashboardStorageWriteError(error);
  }

  const message = apiMessage(error);
  const reason = normaliseReason(`${message ?? ''} ${error.body?.error?.status ?? ''}`);

  if (error.status === 404 || reason.includes('NOT_FOUND')) {
    return new CustomDashboardNotFoundError(dashboardId ?? 'unknown');
  }

  if (error.status === 409 || reason.includes('VERSION_CONFLICT') || reason.includes('CONFLICT')) {
    return new CustomDashboardVersionConflictError(dashboardId ?? 'unknown');
  }

  if (
    error.status === 429 ||
    reason.includes('QUOTA_EXCEEDED') ||
    reason.includes('RESOURCE_EXHAUSTED')
  ) {
    return new CustomDashboardQuotaExceededError(message);
  }

  if (error.status === 401 || reason.includes('UNAUTHENTICATED')) {
    return new CustomDashboardUnauthenticatedError(message);
  }

  if (error.status === 403 || reason.includes('PERMISSION_DENIED')) {
    return new CustomDashboardPermissionDeniedError(message);
  }

  if (
    error.status === 400 ||
    reason.includes('VALIDATION_FAILED') ||
    reason.includes('INVALID_ARGUMENT')
  ) {
    return new CustomDashboardValidationError('document', message ?? 'Invalid custom dashboard.');
  }

  if (error.status === 503 || reason.includes('UNAVAILABLE')) {
    return new CustomDashboardNotAvailableError();
  }

  return new CustomDashboardStorageWriteError(error);
}
