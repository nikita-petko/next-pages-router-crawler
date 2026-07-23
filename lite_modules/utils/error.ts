import { captureException as sentryCaptureException } from '@sentry/nextjs';
import { AxiosError } from 'axios';

import ErrorCodes from '@constants/errorCodes';

export const CaptureException = (error: unknown, extra: Record<string, unknown> = {}) => {
  sentryCaptureException(error, extra);
};

export const IsImpersonationError = (error: unknown) =>
  error instanceof AxiosError && error.response?.data?.error?.code === ErrorCodes.FORBIDDEN_ACTION;
