import type { Dispatch } from 'react';
import type { ConversationAction } from '../reducers/ConversationReducer';
import { ConversationActionType } from '../reducers/ConversationReducer';
import type { ConversationError, ConversationRateLimitError } from '../types';

export const convertConvAIErrorToConversationError = (convAIError: string): ConversationError => {
  switch (convAIError) {
    case 'ServersAtMaxCapacity':
      return 'ServiceRateLimitExceeded';
    case 'InappropriateRequest':
      return 'ContentFilterFailed';
    case 'QuotaError':
      return 'UserRateLimitExceeded';
    case 'GeneralError':
    default:
      return 'InternalError';
  }
};

export const isRateLimitError = (err?: ConversationError): err is ConversationRateLimitError =>
  err === 'ServiceRateLimitExceeded' ||
  err === 'UserRateLimitExceeded' ||
  err === 'TokenLimitExceeded';

const CreateConversationErrorStatus = {
  RateLimitExceeded: 429,
  ContentFilterFailed: 406,
};

const getCreateConversationError = async (
  errorResp: Response,
): Promise<{ error: ConversationError; userDailyRateLimit: number | undefined }> => {
  let error: ConversationError = 'InternalError';
  let userDailyRateLimit: number | undefined;
  if (errorResp.status === CreateConversationErrorStatus.ContentFilterFailed) {
    error = 'ContentFilterFailed';
  }
  if (errorResp.status === CreateConversationErrorStatus.RateLimitExceeded) {
    try {
      userDailyRateLimit = await errorResp.json();
      error = 'UserRateLimitExceeded';
    } catch {
      error = 'ServiceRateLimitExceeded';
    }
  }
  return { error, userDailyRateLimit };
};

export const handleDispatchUserPromptError = async (
  dispatch: Dispatch<ConversationAction>,
  createConversationErrorResp: Response,
) => {
  const { error, userDailyRateLimit } = await getCreateConversationError(
    createConversationErrorResp,
  );
  dispatch({
    type: ConversationActionType.activeMessageConversationError,
    error,
    userDailyRateLimit,
  });
};

export const conversationErrorSeverity: Record<ConversationError, 'warning' | 'error'> = {
  UserRateLimitExceeded: 'warning',
  ServiceRateLimitExceeded: 'warning',
  ContentFilterFailed: 'warning',
  TokenLimitExceeded: 'warning',
  InternalError: 'warning',
};
