import { StatusCodes } from '@rbx/core';
/**
 * This network request manager exists because occassionally API Gateway calls
 * fail with a 502 or 504 and retries are needed. We specify that it should retry
 * exactly once if this occurs.
 */
import { getResponseFromError } from '@modules/clients/utils';
import type QuestionnaireNetworkRequestManager from '../interfaces/QuestionnaireNetworkRequestManager';

const networkRequestManager: QuestionnaireNetworkRequestManager = {
  async attemptNetworkRequestWithRetry<T>(callback: () => Promise<T>): Promise<T> {
    try {
      const callbackRes = await callback();
      return callbackRes;
    } catch (e) {
      const status = getResponseFromError(e)?.status;
      if (status === StatusCodes.BAD_GATEWAY || status === StatusCodes.GATEWAY_TIMEOUT) {
        const callbackRes = await callback();
        return callbackRes;
      }
      throw e;
    }
  },
  handleNetworkRequestFailure(
    e: unknown,
    showToastUserError: (titleKey: string, messageKey: string) => void,
    showToastNetworkError: (status: number) => void,
  ) {
    const status = getResponseFromError(e)?.status;

    if (!status) {
      showToastUserError('Error.UnknownError', 'Message.PleaseTryAgain');
      return;
    }

    const hasBody = e && typeof e === 'object' && 'body' in e;
    if (status === StatusCodes.BAD_REQUEST && hasBody) {
      // Should use showToastUserError() with correct translation keys
      showToastNetworkError(status);
    } else if (status === StatusCodes.NOT_FOUND && hasBody) {
      // Should use showToastUserError() with correct translation keys
      showToastNetworkError(status);
    } else {
      showToastNetworkError(status);
    }
  },
};

export default networkRequestManager;
