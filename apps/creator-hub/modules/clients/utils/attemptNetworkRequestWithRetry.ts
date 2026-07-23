import { StatusCodes } from '@rbx/core';
import { getErrorStatus } from './errorHelpers';

export default async function attemptNetworkRequestWithRetry<T>(
  callback: () => Promise<T>,
): Promise<T> {
  try {
    const callbackRes = await callback();
    return callbackRes;
  } catch (e) {
    const status = getErrorStatus(e);
    if (
      status === StatusCodes.BAD_GATEWAY ||
      status === StatusCodes.GATEWAY_TIMEOUT ||
      status === StatusCodes.REQUEST_TIMEOUT ||
      status === StatusCodes.INTERNAL_SERVER_ERROR ||
      status === StatusCodes.SERVICE_UNAVAILABLE
    ) {
      const callbackRes = await callback();
      return callbackRes;
    }
    throw e;
  }
}
