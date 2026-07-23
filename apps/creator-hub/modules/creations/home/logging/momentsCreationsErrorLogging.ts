import type { UnifiedLogger } from '@rbx/unified-logger';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  appendMomentsCreationsContextParameters,
  type MomentsCreationsContext,
  MomentsCreationsOperation,
} from './momentsCreationsLoggingShared';

export {
  MomentsCreationsOperation as MomentsCreationsErrorOperation,
  type MomentsCreationsContext as MomentsCreationsErrorContext,
};

export type MomentsCreationsErrorDetails = {
  reason: string;
  httpStatus?: number;
  errorCode?: number;
};

const getMomentsCreationsErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
};

export const extractMomentsCreationsErrorDetails = async (
  error: unknown,
  explicitReason?: string,
): Promise<MomentsCreationsErrorDetails> => {
  const httpError = await tryParseResponseError(error);
  const fallbackReason = getMomentsCreationsErrorMessage(error);

  if (httpError) {
    return {
      reason: explicitReason ?? httpError.message ?? fallbackReason,
      httpStatus: httpError.status,
      errorCode: httpError.code,
    };
  }

  return {
    reason: explicitReason ?? fallbackReason,
  };
};

export const buildMomentsCreationsErrorEvent = (
  operation: MomentsCreationsOperation,
  errorDetails: MomentsCreationsErrorDetails,
  context: MomentsCreationsContext = {},
) => ({
  eventName: CreatorDashboardEventType.MomentsCreationsError,
  parameters: appendMomentsCreationsContextParameters(
    {
      operation,
      reason: errorDetails.reason,
      ...(errorDetails.httpStatus != null ? { httpStatus: String(errorDetails.httpStatus) } : {}),
      ...(errorDetails.errorCode != null ? { errorCode: String(errorDetails.errorCode) } : {}),
    },
    context,
  ),
});

export const logMomentsCreationsErrorAsync = async (
  operation: MomentsCreationsOperation,
  error: unknown,
  context: MomentsCreationsContext = {},
  client: UnifiedLogger = unifiedLoggerClient,
): Promise<void> => {
  const errorDetails = await extractMomentsCreationsErrorDetails(error, context.reason);
  client.logErrorEvent(buildMomentsCreationsErrorEvent(operation, errorDetails, context));
};

export const logMomentsCreationsError = (
  operation: MomentsCreationsOperation,
  error: unknown,
  context: MomentsCreationsContext = {},
  client: UnifiedLogger = unifiedLoggerClient,
): void => {
  void logMomentsCreationsErrorAsync(operation, error, context, client);
};

/** @deprecated Use buildMomentsCreationsErrorEvent for tests. */
export const createMomentsCreationsErrorEvent = (
  operation: MomentsCreationsOperation,
  error: unknown,
  context: MomentsCreationsContext = {},
) =>
  buildMomentsCreationsErrorEvent(
    operation,
    { reason: context.reason ?? getMomentsCreationsErrorMessage(error) },
    context,
  );
